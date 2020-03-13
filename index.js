require('dotenv').config()
const db = require('./lib/db/timescaledb-interaction')
const getClientsPerLocation = require('./lib/get-clients-per-location')
const getClients = require('./lib/get-clients-v2')
const errorHandler = require('./lib/error-handler')
const macVendorStats = require('./lib/stats/macVendorStats')

// DEBUG
const perLocation = true
const writeToDb = true

// Environment variables
const basicAuth = Buffer.from(process.env.USERNAME + ':' + process.env.PASSWORD, 'utf-8').toString('base64')
const apiUrl = process.env.PRIME_API_URL
const primeReportNamePerFloor = process.env.PRIME_REPORT_NAME_CLIENT_PER_FLOOR
const primeReportNameClients = process.env.PRIME_REPORT_NAME_CLIENTS

const headers = {
  headers: {
    Authorization: 'Basic ' + basicAuth
  }
}

;(async () => {
  if (perLocation) {
    console.log(await getClientsPerLocation(apiUrl, headers, primeReportNamePerFloor))
  } else {
    const clients = await getClients(apiUrl, headers, primeReportNameClients)
    // console.log(clients)
    // Get number of devices by vendor
    console.log(macVendorStats(clients))
  }
})()
// */

if (perLocation && writeToDb) {
  getClientsPerLocation(apiUrl, headers, primeReportNamePerFloor)
    .then(async data => {
      await db.createDb()
      await db.insertClientLocations(data)
    })
    .catch(err => { errorHandler(err) })
} else if (!perLocation && writeToDb) {
  getClients(apiUrl, headers, primeReportNameClients)
    .then(async data => {
      await db.createDb()
      await db.writeToDb(data)
    })
    .catch(err => { errorHandler(err) })
}
// */
