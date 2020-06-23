const { default: axios } = require('axios')
const updateClientLocations = require('./mse-update-client-locations')
const updateLocations = require('./mse-update-locations')
const { logger } = require('@vtfk/logger')

module.exports = ({ username, password, baseUrl }) => {
  logger('debug', ['mse-factory', 'creating axios instance for mse'])
  const mse = axios.create({
    baseURL: baseUrl,
    auth: {
      username,
      password
    }
  })

  async function getPagination (path) {
    logger('debug', ['mse-factory', 'mse-api call', 'GET path', path])
    const { data } = await mse.get(path)
    logger('debug', ['mse-factory', 'mse-api call', 'got data'])
    if (!data.Locations || data.Locations.totalPages === 1) return data

    let { currentPage, totalPages } = data.Locations
    logger('debug', ['mse-factory', 'mse-api call', 'data has more pages', 'total pages', totalPages])

    while (currentPage < totalPages) {
      logger('debug', ['mse-factory', 'mse-api call', 'getting next page', 'currentPage', currentPage, 'nextPage', currentPage + 1])
      const { data: pageData } = await mse.get(`${path}?page=${currentPage + 1}&pageSize=5000`)
      currentPage = pageData.Locations.currentPage
      data.Locations.entries = [
        ...data.Locations.entries,
        ...pageData.Locations.entries
      ]
    }
    logger('debug', ['mse-factory', 'mse-api call', 'got all pages', 'total entries', data.Locations.entries.length])
    return { data }
  }

  mse.getPagination = getPagination

  return {
    updateClientLocations: (mapHierarchies) => updateClientLocations(mse, mapHierarchies),
    updateLocations: (mapHierarchies) => updateLocations(mse, mapHierarchies)
  }
}
