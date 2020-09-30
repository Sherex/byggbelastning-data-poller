const { default: axios } = require('axios')
const updateClientLocations = require('./mse-update-client-locations')
const updateLocations = require('./mse-update-locations')
const { getFloors } = require('./mse-get-floors')
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

  return {
    updateClientLocations: (mapHierarchies) => updateClientLocations(mse, mapHierarchies),
    updateLocations: (mapHierarchies) => updateLocations(mse, mapHierarchies),
    getFloors: () => getFloors(mse)
  }
}
