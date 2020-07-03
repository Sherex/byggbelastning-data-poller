const primeDataParser = require('./report-parser-pr-location')
const { logger } = require('@vtfk/logger')

// DEBUG: Dummy data for offline use
const dummyData = require('../dummy')

/**
 * Returns a promise with client count for each location.
 * @param  {any} axiosInstance Instance of axios with baseUrl and auth set.
 * @param  {String} reportName Name of the report to get and parse.
 * @return {Promise<array>} Client count per location.
 */
module.exports = async (axiosInstance, reportName) => {
  logger('info', ['get-clients-per-location', 'start', 'getting data from report', 'report name', reportName])
  // DEBUG: Save this report for offline use
  let response
  if (process.env.DUMMY_PR_LOCATION) {
    response = await dummyData.load(reportName)
  } else {
    response = await axiosInstance.get('webacs/api/v3/op/reportService/getReport.json?reportTitle=' + reportName)
    if (response.data) { response = response.data }
    dummyData.save(reportName, response)
  }
  // DEBUG END

  // const timeData = response.mgmtResponse.reportDataDTO[0].dataRows.dataRow
  const timeData = response.mgmtResponse.reportDataDTO[0].childReports.childReport[0].dataRows.dataRow

  logger('info', ['get-clients-per-location', 'got data', 'length', timeData.length])

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

  logger('info', ['get-clients-per-location', 'formatted data', 'success'])

  return dataInfo
}
