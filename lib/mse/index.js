const { default: axios } = require('axios')
const updateClientLocations = require('./mse-update-client-locations')
const updateLocations = require('./mse-update-locations')
const { logger } = require('@vtfk/logger')
const pLimit = require('p-limit')

module.exports = ({ username, password, baseUrl }) => {
  logger('debug', ['mse-factory', 'creating axios instance for mse'])
  const mse = axios.create({
    baseURL: baseUrl,
    auth: {
      username,
      password
    }
  })

  // TODO: Move to "mse-update-client-locations"
  // TODO: Stop when at last stopping point
  // TODO: Filter duplicates (Unique constraint in DB)
  async function getPagination (path) {
    logger('debug', ['mse-factory', 'mse-api call', 'GET path', path])
    const { data } = await mse.get(path)
    logger('debug', ['mse-factory', 'mse-api call', 'got data'])
    if (!data.Locations || data.Locations.totalPages === 1) return data

    let { totalPages } = data.Locations
    logger('debug', ['mse-factory', 'mse-api call', 'data has more pages', 'total pages', totalPages])

    // Create array with all page numbers to get and removing first page as we already have it
    const pagesToGet = Array.from(Array(totalPages)).map((e, i) => i + 1).slice(1)
    const getPageFunctions = pagesToGet.map((page) => async () => {
      try {
        const { data: pageData } = await mse.get(`${path}?page=${page}&pageSize=5000`)
        data.Locations.entries = [
          ...data.Locations.entries,
          ...pageData.Locations.entries
        ]
        logger('debug', ['mse-factory', 'mse-api call', 'successfully got page', `${page}/${totalPages}`, 'length', pageData.Locations.entries.length])
      } catch (error) {
        logger('warn', ['mse-factory', 'mse-api call', 'failed to get page', `${page}/${totalPages}`, 'skipping page'])
      }
    })

    const limit = pLimit(5)
    await Promise.all(getPageFunctions.map(limit))

    logger('debug', ['mse-factory', 'mse-api call', 'got all pages', 'total entries', data.Locations.entries.length])
    return { data }
  }

  mse.getPagination = getPagination

  return {
    updateClientLocations: (mapHierarchies) => updateClientLocations(mse, mapHierarchies),
    updateLocations: (mapHierarchies) => updateLocations(mse, mapHierarchies)
  }
}
