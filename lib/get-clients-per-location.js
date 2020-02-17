const axios = require('axios')
const errorHandler = require('./error-handler')
const primeDataParser = require('./prime-data-parser')

// DEBUG: Dummy data for offline use
const dummyData = require('../sample-data/dummy')

/**
 * Returns a promise with client count for each location.
 * @param  {String} apiUrl URL to the API including path.
 * @param  {Object} headers Headers to include in the request.
 * @param  {String} headers.Authorization A basic auth string.
 * @return {Promise<array>} Client count per location.
 */
module.exports = async (apiUrl, headers, reportName) => {
  const resource = 'op/reportService/report.json?reportTitle=' + reportName
  console.log(resource)
  let response = await axios.get(apiUrl + resource, headers)
  // let response = await dummyData.load('./sample-data/reports/test-clientcount-per-floor-2d.json')

  if (response.data) { response = response.data }

  // DEBUG: Save this report for offline use
  try {
    dummyData.save(reportName, response)
  } catch (error) {
    errorHandler(error)
  }
  // DEBUG END

  // const timeData = response.mgmtResponse.reportDataDTO[0].dataRows.dataRow
  const timeData = response.mgmtResponse.reportDataDTO[0].childReports.childReport[0].dataRows.dataRow

  const dataInfo = []
  // Loop through each timeset and format the content to one object
  timeData.forEach(location => {
    location = location.entries.entry
    const loc = {}
    // Loop through [location, time, assoCount, authCount] for each timeset
    location.forEach(entry => {
      loc[entry.attributeName] = primeDataParser(entry.dataValue, entry.attributeName)
    })
    dataInfo.push(loc)
  })
  return dataInfo
}
