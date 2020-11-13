const { logger } = require('@vtfk/logger')
const createMse = require('./lib/mse')
const db = require('./lib/db/timescaledb-interaction')
const format = require('pg-format')

const mse = createMse({
  baseUrl: process.env.MSE_API_URL,
  username: process.env.MSE_USERNAME,
  password: process.env.MSE_PASSWORD
})

// Update floors
;(async () => {
  logger('debug', ['mse-sandbox', 'updating floors'])
  const floors = await mse.getFloors()
  await db.updateFloor(floors)
  logger('debug', ['mse-sandbox', 'success!'])
  await db.close({ immediate: true })
})().catch(error => {
  console.error(error)
})

// ;(async () => {
//   logger('debug', ['mse-sandbox', 'getting existing clients from DB'])
//   const oldClients = await db.query('SELECT COUNT(cid) FROM client_coordinate')
//   logger('debug', ['mse-sandbox', 'updating client locations'])
//   const { stats } = await mse.updateClientLocations()
//   logger('debug', ['mse-sandbox', 'success', 'total clients', stats.totalClients, 'successful', stats.success, 'failed', stats.failed])
//   logger('debug', ['mse-sandbox', 'getting total clients from DB'])
//   const clients = await db.query('SELECT COUNT(cid) FROM client_coordinate')
//   logger('debug', ['mse-sandbox', 'old clients in db', oldClients.rows[0].count, 'total clients', clients.rows[0].count])
//   await db.close({ immediate: true })
// })().catch(error => {
//   console.error(error)
// })

// Insert floors
// ;(async () => {
//   const floors = await mse.getFloors()

//   logger('debug', ['mse-sandbox', 'inserting locations to DB'])
//   await db.insertLocation(floors).then(console.log)
//   logger('debug', ['mse-sandbox', 'inserting buildings to DB'])
//   await db.insertBuilding(floors)
//   logger('debug', ['mse-sandbox', 'inserting floors to DB', 'total floors', floors.length])
//   await db.insertFloor(floors)
//   await db.query('REFRESH MATERIALIZED VIEW location_view;')
//   await db.close({ immediate: true })
// })()

// Check for new floors
// ;(async () => {
//   const floors = await mse.getFloors()
//   const values = floors.map(floor => [floor.locationType, floor.location, floor.building, floor.floor, floor.mseFloorId])

//   const newFloors = (await db.query(format(
//     `
//     WITH ins (location_type, location, building, floor, mse_floor_id) AS (
//       VALUES %L
//     )
//     SELECT
//       ins.location_type AS "locationType",
//       ins.location,
//       ins.building,
//       ins.floor,
//       ins.mse_floor_id AS "mseFloorId"
//     FROM location_view lv
//     RIGHT JOIN ins
//       ON lv.mse_floor_id = ins.mse_floor_id
//     WHERE lv.mse_floor_id IS NULL`
//     , values))).rows

//   // eslint-disable-next-line
//   if (true) {
//     logger('debug', ['mse-sandbox', 'inserting locations to DB'])
//     const locationResult = await db.insertLocation(newFloors)
//     logger('debug', ['mse-sandbox', 'inserting buildings to DB'])
//     const buildingResult = await db.insertBuilding(newFloors)
//     logger('debug', ['mse-sandbox', 'inserting floors to DB', 'total floors', newFloors.length])
//     const floorResult = await db.insertFloor(newFloors)
//     await db.query('REFRESH MATERIALIZED VIEW location_view;')
//     logger('debug', ['mse-sandbox', 'inserted locations', locationResult.rowCount, 'buildings', buildingResult.rowCount, 'floors', floorResult.rowCount])
//   }

//   await db.close({ immediate: true })
// })()

// Check for removed floors
// ;(async () => {
//   const floors = await mse.getFloors()

//   const values = floors.map(floor => [floor.location, floor.building, floor.floor, floor.mseFloorId])

//   console.log((await db.query(format(
//     `
//     WITH ins (location, building, floor, mse_floor_id) AS (
//       VALUES %L
//     )
//     SELECT
//       f.name,
//       f.mse_floor_id
//     FROM floor f
//     LEFT JOIN ins
//       ON f.mse_floor_id = ins.mse_floor_id
//     WHERE ins.mse_floor_id IS NULL`
//     , values))).rows)
//   await db.close({ immediate: true })
// })()

// Get floors for SQL query
// ;(async () => {
//   const floors = await mse.getFloors()

//   const values = floors.map(floor => [floor.locationType, floor.location, floor.building, floor.floor, floor.mseFloorId])

//   console.log(format('%L', values))
// })()
