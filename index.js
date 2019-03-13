require('dotenv').config()
const db = require('./lib/influxdb-interaction')
const getClientsPerLocation = require('./lib/get-clients-per-location')
const errorHandler = require('./lib/error-handler')

// DEBUG: Dummy data for offline use
const dummyData = require('./sample-data/dummy')

// Environment variables
const basicAuth = Buffer.from(process.env.USERNAME + ':' + process.env.PASSWORD, 'utf-8').toString('base64')
const apiUrl = process.env.PRIME_API_URL
const primeReportName = process.env.PRIME_REPORT_NAME

const headers = {
  headers: {
    Authorization: 'Basic ' + basicAuth
  }
}

getClientsPerLocation(apiUrl, headers, primeReportName)
  .then(async data => {
    await db.createDb()
    await db.writeToDb(data)
  })
  .catch(err => { errorHandler(err) })
