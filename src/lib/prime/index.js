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
  // TODO: Create function to paginate reports
  // Maybe create a report wrapper? NPM module?

  return {
    getClientsPerLocation: (reportName) => getClientsPerLocation(prime, reportName),
    getClients: (reportName) => getClients(prime, reportName)
  }
}
