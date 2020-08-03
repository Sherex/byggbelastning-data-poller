require('dotenv').config()
const db = require('./lib/db/timescaledb-interaction')
const createPrime = require('./lib/prime')
const errorHandler = require('./lib/error-handler')

// DEBUG
const perLocation = true
const writeToDb = true

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
    console.log((await db.query('SELECT COUNT(id) FROM clients_location')).rows[0].count)
    const data = await getClientsPerLocation(primeReportNamePerFloor)
    if (writeToDb) {
      await db.insertClientLocations(data)
    } else {
      console.log(data.length)
    }
    console.log((await db.query('SELECT COUNT(id) FROM clients_location')).rows[0].count)
  } else {
    const data = await getClients(primeReportNameClients)
    if (writeToDb) {
      await db.writeToDb(data)
    } else {
      console.log(data.length)
    }
  }
})().catch(errorHandler)
