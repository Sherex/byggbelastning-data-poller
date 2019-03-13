// Import env from .env
require('dotenv').config()
const axios = require('axios')
const date = require('date-and-time')
const db = require('./lib/influxdb-interaction')
const errorHandler = require('./lib/errorHandler')

// TODO: Remove when done
const dummyData = require('./sample-data/dummy')

let basicAuth = Buffer.from(process.env.USERNAME + ':' + process.env.PASSWORD, 'utf-8').toString('base64')

let apiUrl = 'https://***REMOVED***/webacs/api/v3/'

let headers = {
  headers: {
    Authorization: 'Basic ' + basicAuth
  }
}

function parseIfDate (dateTimeString, dataAttribute) {
  // 'Sat Mar 09 12:29:48 CET 2019'
  if (dataAttribute === 'eventTime') {
    try {
      let dateTime = dateTimeString.split(' ')
      dateTime.splice(0, 1)
      dateTime.splice(3, 1)
      dateTime = dateTime.join(' ')
      dateTime = date.parse(dateTime, 'MMM DD HH:mm:ss YYYY')
      return isNaN(dateTime) ? dateTimeString : dateTime
    } catch (error) {
      errorHandler(error)
      return dateTimeString
    }
  } else {
    return dateTimeString
  }
}

/**
 * Returns a promise with IDs of clients
 * @param  {String} apiUrl URL to the API including path.
 * @param  {Object} headers Headers to include in the request.
 * @param  {String} headers.Authorization A basic auth string.
 * @return {Promise<array>} Client IDs.
 */
function getClientIds (apiUrl, headers) {
  return new Promise(async function (resolve, reject) {
    let resource = 'data/Clients.json?'
    let query = [
      '.firstResult=0',
      '.maxResults=20',
      'vlanId=in(208, 104)',
      'securityPolicyStatus="PASSED"'
    ].join('&')

    // axios.get(apiUrl + resource + query, headers)
    dummyData('./sample-data/user-list.json')
      .then(response => {
        let userList = response.data.queryResponse.entityId
        resolve(userList.map(user => user.$))
      })
      .catch(err => {
        reject(err)
      })
  })
}

/**
 * Returns a promise with IDs of clients
 * @param  {String} apiUrl URL to the API including path.
 * @param  {Object} headers Headers to include in the request.
 * @param  {String} headers.Authorization A basic auth string.
 * @param  {String} clientId
 * @return {Promise<array>} Client IDs.
 */
function getClientById (apiUrl, headers, clientId) {
  return new Promise(async function (resolve, reject) {
    let resource = 'data/Clients/' + clientId + '.json?'

    let userList = {}

    //axios.get(apiUrl + resource, headers)
    dummyData('./sample-data/clients/' + clientId + '.json')
      .then(response => {
        resolve(response.data.queryResponse.entity[0].clientsDTO)
      })
      .catch(err => {
        reject(err)
      })
  })
}

/**
 * Returns a promise with IDs of clients
 * @param  {String} apiUrl URL to the API including path.
 * @param  {Object} headers Headers to include in the request.
 * @param  {String} headers.Authorization A basic auth string.
 * @return {Promise<array>} Client IDs.
 */
function getClientsByLocation (apiUrl, headers) {
  return new Promise(async function (resolve, reject) {
    let reportName = 'reportTitle=test-clientcount-per-floor'
    let resource = 'op/reportService/report.json?' + reportName

    let clients = [
      {
        timestamp: 'Sat Mar 09 12:29:48 CET 2019',
        location: 'Porsgrunn',
        building: 'Bygg A',
        floor: '2 etg',
        assoCount: 300,
        authCount: 250
      }
    ]
    // dateTime | clients (field) | location (tag) | building (tag) | floor (tag)

    // TODO: Parse data, array per location
    // axios.get(apiUrl + resource, headers)
    dummyData('./sample-data/reports/report.json')
      .then(response => {
        let timeData = response.mgmtResponse.reportDataDTO.childReports.childReport[0].dataRows.dataRow
        let dataInfo = []

        // Loop through each timeset and format the content to one object
        timeData.forEach(location => {
          location = location.entries.entry
          let loc = {}
          // Loop through [location, time, assoCount, authCount] for each timeset
          location.forEach(entry => {
            loc[entry.attributeName] = parseIfDate(entry.dataValue, entry.attributeName)
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
/*
getClientIds(apiUrl, headers)
  .then(users => { console.log(users) })
  .catch(err => { errorHandler(err) })

getClientById(apiUrl, headers, 1034344839)
  .then(users => { console.log(users) })
  .catch(err => { errorHandler(err) })

*/
getClientsByLocation(apiUrl, headers)
  .then(users => { console.log(users) })
  .catch(err => { errorHandler(err) })
