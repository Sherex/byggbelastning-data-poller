const axios = require('axios')
const updateClientLocations = require('./mse-update-client-locations')

module.exports = ({ username, password, baseUrl }) => {
  const mse = axios.create({
    baseURL: baseUrl,
    auth: {
      username,
      password
    }
  })

  return {
    updateClientLocations: (mapHierarchies) => updateClientLocations(mse, mapHierarchies)
  }
}
