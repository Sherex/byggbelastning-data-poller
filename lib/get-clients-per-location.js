const axios = require('axios')
const fs = require('fs')
const errorHandler = require('./error-handler')
const primeDataParser = require('./prime-data-parser')

/**
 * Returns a promise with client count for each location.
 * @param  {String} apiUrl URL to the API including path.
 * @param  {Object} headers Headers to include in the request.
 * @param  {String} headers.Authorization A basic auth string.
 * @return {Promise<array>} Client count per location.
 */
module.exports.getClientsPerLocation = async (apiUrl, headers, reportName) => {
  return new Promise(async function (resolve, reject) {
    let resource = 'op/reportService/report.json?reportTitle=' + reportName

    axios.get(apiUrl + resource, headers)
    // dummyData('./sample-data/reports/report.2.json')
      .then(response => {
        if (response.data) { response = response.data }

        // DEBUG: Save this report for offline use
        try {
          fs.writeFileSync('./sample-data/reports/report.2.json', JSON.stringify(response))
        } catch (error) {
          errorHandler(error)
        }

        let timeData = response.mgmtResponse.reportDataDTO[0].childReports.childReport[0].dataRows.dataRow
        let dataInfo = []

        // Loop through each timeset and format the content to one object
        timeData.forEach(location => {
          location = location.entries.entry
          let loc = {}
          // Loop through [location, time, assoCount, authCount] for each timeset
          location.forEach(entry => {
            loc[entry.attributeName] = primeDataParser(entry.dataValue, entry.attributeName)
          })
          dataInfo.push(loc)
        })

        resolve(dataInfo)
      })
      .catch(err => {
        reject(err)
      })
  })
}
