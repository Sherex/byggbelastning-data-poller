require('dotenv').config()
const { logger } = require('@vtfk/logger')
const { createHmac, createHash } = require('crypto')
const { Pool } = require('pg')
const { readFileSync } = require('fs')
const format = require('pg-format')

let pool

function createConnection () {
  if (pool) return
  pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT
  })
}

/**
 * Creates a DB if it doesn't exist.
 */
module.exports.setupDB = async () => {
  createConnection()
  const dbSchemaQuery = readFileSync('./lib/db/db-schema.sql', 'utf8')
  try {
    await pool.query(dbSchemaQuery)
    logger('info', ['timescaledb-interaction', 'setupDB', 'successfully created tables'])
  } catch (error) {
    if (/database.*does not exist/.test(error.message)) {
      logger('error', ['timescaledb-interaction', 'setupDB', 'database does not exist', 'db name', process.env.DB_NAME])
    }
    logger('error', ['timescaledb-interaction', 'setupDB', 'failed to setup database', 'throwing'])
    throw error
  }
}

module.exports.insertLocation = async (data) => {
  createConnection()
  const client = await pool.connect()
  const values = data.map(({ location }) => [location])

  try {
    const query = format(`
      WITH ins (location) AS (
        VALUES %L
      )
      INSERT INTO location (name)
        SELECT ins.location
          FROM ins
          GROUP BY (ins.location)
          ORDER BY (ins.location)
        ON CONFLICT DO NOTHING;
    `, values)
    await client.query(query)
  } catch (error) {
    logger('error', ['timescaledb-interaction', 'insertLocation', 'failed to insert location', 'error', error.message])
    throw error
  } finally {
    client.release()
  }
}

module.exports.insertBuilding = async (data) => {
  createConnection()
  const client = await pool.connect()
  const values = data.map(({ location, building }) => [location, building])

  try {
    const query = format(`
      WITH ins (location, building) AS (
        VALUES %L
      )
      INSERT INTO building (name, location_id)
        SELECT ins.building, l.id
          FROM ins
          INNER JOIN location l
            ON l.name = ins.location
          GROUP BY (l.id, ins.building)
          ORDER BY (l.id, ins.building)
        ON CONFLICT DO NOTHING;
    `, values)
    await client.query(query)
  } catch (error) {
    logger('error', ['timescaledb-interaction', 'insertBuilding', 'failed to insert building', 'error', error.message])
    throw error
  } finally {
    client.release()
  }
}

module.exports.insertFloor = async (data) => {
  createConnection()
  const client = await pool.connect()
  const values = data.map(({ location, building, floor }) => [location, building, floor])

  try {
    const query = format(`
      WITH ins (location, building, floor) AS (
        VALUES %L
      )
      INSERT INTO floor (name, building_id)
        SELECT ins.floor, b.id
          FROM ins
          INNER JOIN location l
            ON l.name = ins.location
          INNER JOIN building b
            ON
              b.location_id = l.id AND
              b.name = ins.building
          GROUP BY (l.id, b.id, ins.floor)
          ORDER BY (l.id, b.id, ins.floor)
        ON CONFLICT DO NOTHING;
    `, values)
    await client.query(query)
  } catch (error) {
    logger('error', ['timescaledb-interaction', 'insertFloor', 'failed to insert floor', 'error', error.message])
    throw error
  } finally {
    client.release()
  }
}

/**
 * Adds a location node for a specific bulding floor map.
 * @param {{eventTime: String, mac: String, location: String, building: String, floor: String, x: Number, y: Number}[]} data Data to insert
 */
module.exports.insertClientCoords = async (data) => {
  createConnection()
  data = Array.isArray(data) ? data : [data]
  const values = data.map(client => {
    const cid = createHmac('md5', process.env.MSE_MAC_HASH_KEY).update(client.mac).digest('hex')
    return [
      new Date(client.eventTime),
      cid,
      client.location,
      client.building,
      client.floor,
      client.x,
      client.y
    ]
  })

  try {
    const query = format(`
      WITH ins (time, cid, location, building, floor, x, y) AS (
        VALUES %L
      )
      INSERT INTO client_coordinate (time, floor_id, cid, x, y)
        SELECT
          ins.time,
          (get_id_from_names(ins.location, ins.building, ins.floor)).floor_id,
          ins.cid,
          ins.x,
          ins.y
          FROM ins
        ON CONFLICT DO NOTHING`,
    values
    )
    return pool.query(query)
  } catch (error) {
    logger('error', ['timescaledb-interaction', 'insertClientCoords', 'failed to insert coordinates', 'error', error.message])
    throw error
  } finally {
    this.close()
  }
}

/**
 * Writes number of associated and autheticated clients per location.
 * @param data Either array of parsed objects or one object.
 * @return {Promise<any[]>}
 */
module.exports.insertClientLocations = async (data) => {
  createConnection()
  data = Array.isArray(data) ? data : [data]

  logger('debug', ['timescaledb-interaction', 'insertClientLocations', 'start', 'format data for insert', 'data length', data.length])

  const values = data.map(client => {
    const time = new Date(client.eventTime)
    const stringConcat = `${time}-${client.key.location}>${client.key.building}>${client.key.floor}`
    const idHash = createHash('md5').update(stringConcat).digest('hex')
    return [
      time,
      idHash,
      client.key.location,
      client.key.building,
      client.key.floor,
      client.authCount,
      client.assoCount
    ]
  })

  logger('debug', ['timescaledb-interaction', 'insertClientLocations', 'filter out duplicates', 'data length', values.length])

  const newIds = [values.map(val => val[1])]
  let { rows: existingHashes } = await pool.query('SELECT id FROM clients_location WHERE id = ANY ($1)', newIds)
  existingHashes = existingHashes.map(row => row.id)

  const filteredValues = values.filter(row => !existingHashes.includes(row[1]))

  logger('info', ['timescaledb-interaction', 'insertClientLocations', 'data filtered', 'unique', filteredValues.length, 'duplicates', values.length - filteredValues.length])

  if (filteredValues.length >= 1) {
    try {
      logger('debug', ['timescaledb-interaction', 'insertClientLocations', 'inserting client counts per location', 'length', filteredValues.length])
      const query = format('INSERT INTO clients_location(time, id, location, building, floor, authCount, assoCount) VALUES %L', filteredValues)
      return pool.query(query)
    } catch (error) {
      logger('error', ['timescaledb-interaction', 'insertClientLocations', 'failed to insert location client counts', 'error', error.message])
      throw error
    } finally {
      this.close()
    }
  } else {
    logger('debug', ['timescaledb-interaction', 'insertClientLocations', 'no clients to insert'])
    return false
  }
}

module.exports.getClientCoords = async () => {
  createConnection()
  const query = 'SELECT * FROM clients_coordinates'
  const response = await pool.query(query)
  this.close()
  return response.rows
}

module.exports.insertLocationMaps = async (data) => {
  createConnection()
  data = Array.isArray(data) ? data : [data]
  const values = data.map(client => [
    client.mapHierarchyString,
    client.campus,
    client.building,
    client.floor,
    client.imageBase64,
    client.imageLength,
    client.imageWidth,
    client.imageOffsetX,
    client.imageOffsetY
  ])

  try {
    const query = format(`
      INSERT INTO locations (mapHierarchyString, campus, building, floor, imageBase64, imageLength, imageWidth, imageOffsetX, imageOffsetY)
        VALUES %L
        ON CONFLICT (mapHierarchyString) DO UPDATE SET imageBase64 = EXCLUDED.imageBase64;`,
    values
    )
    return pool.query(query)
  } catch (error) {
    logger('error', ['timescaledb-interaction', 'insertLocationMaps', 'failed to insert coordinates', 'error', error.message])
    throw error
  } finally {
    this.close()
  }
}

module.exports.query = async (query, values) => {
  if (typeof query !== 'string') throw Error('Required parameter \'query <String>\' is of wrong type.')
  createConnection()
  const response = await pool.query(query, values)
  this.close()
  return response
}

let connectionCloseTimer
/**
 * Close connection to the DB
 * @param {object} options Options for closing
 * @param {boolean} options.immediate Closes the connection immediately if true
 */
module.exports.close = (options) => {
  if (connectionCloseTimer) {
    clearTimeout(connectionCloseTimer)
  }
  if (options && options.immediate === true) {
    logger('silly', ['timescaledb-interaction', 'connection close immediate', 'closing connection'])
    if (!pool) return
    pool.end()
    pool = undefined
  } else {
    logger('silly', ['timescaledb-interaction', 'setting connection close timeout'])
    connectionCloseTimer = setTimeout(() => {
      logger('silly', ['timescaledb-interaction', 'connection closing after timeout', 'closing connection'])
      if (!pool) return
      pool.end()
      pool = undefined
    }, 2000)
  }
}
