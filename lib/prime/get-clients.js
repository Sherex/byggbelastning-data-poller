const axios = require('axios')
const errorHandler = require('../error-handler')
const parseData = require('./prime-client-report-parser')

// DEBUG: Dummy data for offline use
const dummyData = require('../dummy')

function unwrap (unwrap) {
  const clients = unwrap.mgmtResponse.reportDataDTO
  return Array.isArray(clients) ? clients[0].dataRows.dataRow : clients.dataRows.dataRow
}

/**
 * Returns a promise with client count for each location.
 * @param  {String} apiUrl URL to the API including path.
 * @param  {Object} headers Headers to include in the request.
 * @param  {String} headers.Authorization A basic auth string.
 * @return {Promise<array>} Client count per location.
 */
module.exports = async (apiUrl, headers, reportName) => {
  const resource = 'op/reportService/report.json?reportTitle=' + reportName

  // DEBUG: Save this report for offline use
  let response
  if (process.env.DUMMY_GET_CLIENTS) {
    response = await dummyData.load(process.env.DUMMY_GET_CLIENTS)
  } else {
    response = await axios.get(apiUrl + resource, headers)
    if (response.data) { response = response.data }
    dummyData.save(reportName, response)
  }
  // DEBUG END

  const clients = unwrap(response)

  const clientsParsed = []
  clients.forEach(client => {
    try {
      clientsParsed.push(parseClient(client))
    } catch (error) {
      errorHandler(error)
    }
  })
  return clientsParsed
}

function parseClient (client) {
  client = client.entries.entry
  const parsedInfo = {}

  client.forEach(element => {
    const attribute = element.attributeName
    let value = element.dataValue
    value = parseData(value, attribute)
    parsedInfo[attribute] = value
  })
  return parsedInfo
}
