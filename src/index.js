const { logger } = require('@vtfk/logger')
const createMse = require('./lib/mse')
const createPrime = require('./lib/prime')
const db = require('./lib/db/timescaledb-interaction')

const mse = createMse({
  baseUrl: process.env.MSE_API_URL,
  username: process.env.MSE_USERNAME,
  password: process.env.MSE_PASSWORD
})

const { getClientsPerLocation } = createPrime({
  baseUrl: process.env.PRIME_API_URL,
  username: process.env.PRIME_USERNAME,
  password: process.env.PRIME_PASSWORD
})

;(async () => {
  logger('debug', ['index', 'getting existing clients from DB'])
  const oldClients = await db.query('SELECT COUNT(cid) FROM client_coordinate')
  logger('debug', ['index', 'updating location names'])
  const floors = await mse.getFloors()
  await db.updateFloor(floors)

  try {
    logger('debug', ['index', 'inserting client_count to DB...'])
    const data = await getClientsPerLocation(process.env.PRIME_REPORT_NAME_CLIENT_PER_FLOOR)
    const result = await db.insertClientCount(data)
    logger('info', ['inserted', result.rowCount, 'rows to client_count'])
  } catch (error) {
    logger('error', ['failed to insert count to client_count', 'ignoring', 'error', error.message])
  }

  logger('debug', ['index', 'updating client locations'])
  const { stats } = await mse.updateClientLocations()
  logger('info', ['index', 'success', 'total clients', stats.totalClients, 'successful', stats.success, 'failed', stats.failed])
  logger('debug', ['index', 'getting total clients from DB'])
  const clients = await db.query('SELECT COUNT(cid) FROM client_coordinate')
  logger('debug', ['index', 'old clients in db', oldClients.rows[0].count, 'total clients', clients.rows[0].count])
  await db.close({ immediate: true })
})().catch(error => {
  console.error(error)
})
