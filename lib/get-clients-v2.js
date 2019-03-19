const axios = require('axios')
const fs = require('fs')
const errorHandler = require('./error-handler')
const parseData = require('./prime-client-report-parser')

// DEBUG: Dummy data for offline use
const dummyData = require('../sample-data/dummy')


function unwrap(unwrap) {
  let clients = unwrap.mgmtResponse.reportDataDTO
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
// async function getClients(apiUrl, headers, reportName) {
  return new Promise(async function (resolve, reject) {
    let resource = 'op/reportService/report.json?reportTitle=' + reportName

    let response = await axios.get(apiUrl + resource, headers)
    // let response = await dummyData('./sample-data/reports/clients-report-auto.json')
    if (response.data) { response = response.data }

    // DEBUG: Save this report for offline use
    try {
      fs.writeFileSync('./sample-data/reports/clients-report-auto.json', JSON.stringify(response))
    } catch (error) {
      errorHandler(error)
    }
    // DEBUG END

    let clients = unwrap(response)

    let clientsParsed = []
    clients.forEach(client => {
      clientsParsed.push(parseClient(client))
    })
    resolve(clientsParsed)
  })
}


function parseClient(client) {
  client = client.entries.entry
  let parsedInfo = {}

  client.forEach(element => {
    let attribute = element.attributeName
    let value = element.dataValue
    value = parseData(value, attribute)

    parsedInfo[attribute] = value
  })
  return parsedInfo
}

/*
(async () => {
  console.log( await getClients() )
})()
*/
