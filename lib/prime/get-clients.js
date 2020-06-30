const errorHandler = require('../error-handler')
const parseData = require('./report-parser-clients')

// DEBUG: Dummy data for offline use
const dummyData = require('../dummy')

function unwrap (unwrap) {
  const clients = unwrap.mgmtResponse.reportDataDTO
  return Array.isArray(clients) ? clients[0].dataRows.dataRow : clients.dataRows.dataRow
}

/**
 * Returns a promise with all clients from report.
 * @param  {any} axiosInstance Instance of axios with baseUrl and auth set.
 * @param  {String} reportName Name of the report to get and parse.
 * @return {Promise<array>} Clients from report.
 */
module.exports = async (axiosInstance, reportName) => {
  const resource = 'webacs/api/v3/op/reportService/report.json?reportTitle=' + reportName

  // DEBUG: Save this report for offline use
  let response
  if (process.env.DUMMY_GET_CLIENTS) {
    response = await dummyData.load(process.env.DUMMY_GET_CLIENTS)
  } else {
    response = await axiosInstance.get(resource)
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
