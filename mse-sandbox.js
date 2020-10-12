const { logger } = require('@vtfk/logger')
const createMse = require('./lib/mse')
const db = require('./lib/db/timescaledb-interaction')
const format = require('pg-format')

const mse = createMse({
  baseUrl: process.env.MSE_API_URL,
  username: process.env.MSE_USERNAME,
  password: process.env.MSE_PASSWORD
})

;(async () => {
  logger('debug', ['mse-sandbox', 'getting existing clients from DB'])
  const oldClients = await db.query('SELECT COUNT(cid) FROM client_coordinate')
  logger('debug', ['mse-sandbox', 'updating client locations'])
  const { stats } = await mse.updateClientLocations()
  logger('debug', ['mse-sandbox', 'success', 'total clients', stats.totalClients, 'successful', stats.success, 'failed', stats.failed])
  logger('debug', ['mse-sandbox', 'getting total clients from DB'])
  const clients = await db.query('SELECT COUNT(cid) FROM client_coordinate')
  logger('debug', ['mse-sandbox', 'old clients in db', oldClients.rows[0].count, 'total clients', clients.rows[0].count])
  await db.close({ immediate: true })
})().catch(error => {
  console.error(error)
})

// ;(async () => {
//   const floors = await mse.getFloors()

//   logger('debug', ['mse-sandbox', 'inserting locations to DB'])
//   await db.insertLocation(floors).then(console.log)
//   logger('debug', ['mse-sandbox', 'inserting buildings to DB'])
//   await db.insertBuilding(floors)
//   logger('debug', ['mse-sandbox', 'inserting floors to DB', 'total floors', floors.length])
//   await db.insertFloor(floors)
//   await db.close({ immediate: true })
// })()
