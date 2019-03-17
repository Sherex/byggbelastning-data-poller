const axios = require('axios')
const fs = require('fs')
const errorHandler = require('./error-handler')

// DEBUG: Dummy data for offline use
const dummyData = require('../sample-data/dummy')

/**
 * Returns a promise with client count for each location.
 * @param  {String} apiUrl URL to the API including path.
 * @param  {Object} headers Headers to include in the request.
 * @param  {String} headers.Authorization A basic auth string.
 * @return {Promise<array>} Client count per location.
 */
// module.exports = async (apiUrl, headers, reportName) => {
function getClients() {
  return new Promise(async function (resolve, reject) {
    // let resource = 'op/reportService/report.json?reportTitle=' + reportName

    // let response = await axios.get(apiUrl + resource, headers)
    let response = await dummyData('./sample-data/reports/clients-report.json')

    let clients = response.mgmtResponse.reportDataDTO.dataRows.dataRow

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

    parsedInfo[attribute] = value
  })
  return parsedInfo
}

(async () => {
  console.log( await getClients() )
})()
