require('dotenv').config()
const db = require('./lib/db/timescaledb-interaction')
const createPrime = require('./lib/prime')
const errorHandler = require('./lib/error-handler')

// TODO: Convert all functions into factory functions, one for MSE and one for Prime

// DEBUG
const perLocation = false
const writeToDb = false

// Environment variables
const primeReportNamePerFloor = process.env.PRIME_REPORT_NAME_CLIENT_PER_FLOOR
const primeReportNameClients = process.env.PRIME_REPORT_NAME_CLIENTS

const { getClientsPerLocation, getClients } = createPrime({
  baseUrl: process.env.PRIME_API_URL,
  username: process.env.PRIME_USERNAME,
  password: process.env.PRIME_PASSWORD
})

;(async () => {
  if (perLocation) {
    const data = await getClientsPerLocation(primeReportNamePerFloor)
    console.log(data.length)
    if (writeToDb) {
      await db.insertClientLocations(data)
    }
  } else {
    const data = await getClients(primeReportNameClients)
    console.log(data.length)
    if (writeToDb) {
      await db.writeToDb(data)
    }
  }
})().catch(errorHandler)
