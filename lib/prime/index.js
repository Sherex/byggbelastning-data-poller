const axios = require('axios')
const getClientsPerLocation = require('./get-clients-per-location')
const getClients = require('./get-clients')

module.exports = ({ username, password, baseUrl }) => {
  const prime = axios.create({
    baseURL: baseUrl,
    auth: {
      username,
      password
    }
  })

  return {
    getClientsPerLocation: (reportName) => getClientsPerLocation(prime, reportName),
    getClients: (reportName) => getClients(prime, reportName)
  }
}
