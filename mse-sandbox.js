const { logger } = require('@vtfk/logger')
const createMse = require('./lib/mse')
const db = require('./lib/db/timescaledb-interaction')

const { updateClientLocations } = createMse({
  baseUrl: process.env.MSE_API_URL,
  username: process.env.MSE_USERNAME,
  password: process.env.MSE_PASSWORD
})

;(async () => {
  const oldClients = await db.getClientCoords()
  await updateClientLocations()
  const clients = await db.getClientCoords()
  logger('debug', ['mse-sandbox', 'old clients in db', oldClients.length, 'total clients', clients.length])
  await db.close({ immediate: true })
})().catch(error => {
  console.error(error)
})
