// Import env from .env
require('dotenv').config()
const axios = require('axios')
const errorHandler = require('./lib/errorHandler')

let basicAuth = Buffer.from(process.env.USERNAME + ':' + process.env.PASSWORD, 'utf-8').toString('base64')

let apiUrl = 'https://***REMOVED***/webacs/api/v3/';

let headers = {
  headers: {
    Authorization: 'Basic ' + basicAuth
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
      'vlanId=in(208,%20104)',
      'securityPolicyStatus=%22PASSED%22'
    ].join('&')

    // ### SAMPLE ###
    /*

    let userList = require('./sample-data/user-list.json')
    userList = userList.data.queryResponse.entityId
    resolve(userList.map(user => user.$))

    // */
    // ### SAMPLE END ###

    axios.get(apiUrl + resource + query, headers)
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

    // ### SAMPLE ###
    /*
    try {
      userList = require('./sample-data/clients/' + clientId + '.json')
    } catch (error) {
      errorHandler(error)
      return 1
    }

    userList = userList.data.queryResponse.entityId
    resolve(userList.map(user => user.$))

    // */
    // ### SAMPLE END ###

    axios.get(apiUrl + resource, headers)
      .then(response => {
        userList = response.data.queryResponse.entityId
        resolve(userList.map(user => user.$))
      })
      .catch(err => {
        reject(err)
      })
  })
}

function getClientsByLocation(apiUrl, headers) {
  let reportName = 'reportTitle=test-clientcount-per-floor'
  let resource = 'op/reportService/report.json?' + reportName

  let clients = {
    locations = [
      {
        // TODO: Etasjer + rom
        location: "Porsgrunn",
        timestamps: [
          {
            time: "Sat Mar 09 12:29:48 CET 2019",
            clientCount: 300
          }
        ]
      }
    ]
  }

  // TODO: Parse data, array per location
  axios.get(apiUrl + resource, headers)
      .then(response => {
        userList = response.data.queryResponse.entityId
        resolve(userList.map(user => user.$))
      })
      .catch(err => {
        reject(err)
      })
}


getClientIds(apiUrl, headers)
  .then(users => { console.log(users) })
  .catch(err => { errorHandler(err) })
