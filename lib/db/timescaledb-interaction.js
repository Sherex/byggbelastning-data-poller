require('dotenv').config()
const { logger } = require('@vtfk/logger')
const { createHmac } = require('crypto')
const { Pool } = require('pg')
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
// TODO: Change DB columns to snake_case
/**
 * Creates a DB if it doesn't exist.
 */
module.exports.setupDB = async () => {
  createConnection()
  const createClientsLocationTable = `
    CREATE TABLE IF NOT EXISTS clients_location (
      time        TIMESTAMPTZ   NOT NULL,
      location    TEXT          NOT NULL,
      building    TEXT          NOT NULL,
      floor       TEXT          NOT NULL,
      authCount   INTEGER       NULL,
      assoCount   INTEGER       NULL
    );
  `
  await pool.query(createClientsLocationTable)
  await pool.query('SELECT create_hypertable(\'clients_location\', \'time\', if_not_exists => TRUE);')

  const createClientsCoordinatesTable = `
    CREATE TABLE IF NOT EXISTS clients_coordinates (
      time                 TIMESTAMPTZ    NOT NULL,
      uid                  TEXT           NOT NULL,
      mapHierarchyString   TEXT           NOT NULL,
      campus               TEXT           NOT NULL,
      building             TEXT           NOT NULL,
      floor                TEXT           NOT NULL,
      x                    NUMERIC(10, 4) NOT NULL,
      y                    NUMERIC(10, 4) NOT NULL
    );
  `
  await pool.query(createClientsCoordinatesTable)
  await pool.query('SELECT create_hypertable(\'clients_coordinates\', \'time\', if_not_exists => TRUE);')

  const createLocationsTable = `
    CREATE TABLE IF NOT EXISTS locations (
      mapHierarchyString   TEXT           NOT NULL,
      campus               TEXT           NOT NULL,
      building             TEXT           NOT NULL,
      floor                TEXT           NOT NULL,
      imageBase64          TEXT
    );
  `
  await pool.query(createLocationsTable)
}

/**
 * Writes number of associated and autheticated clients per location.
 * @param data Either array of parsed objects or one object.
 * @return {Promise<any[]>}
 */
module.exports.insertClientLocations = async (data) => {
  createConnection()
  data = Array.isArray(data) ? data : [data]
  const response = await Promise.all(data.map(dbData => {
    const query = 'INSERT INTO clients_location(time, location, building, floor, authCount, assoCount) VALUES($1, $2, $3, $4, $5, $6)'
    const values = [new Date(dbData.eventTime), dbData.key.location, dbData.key.building, dbData.key.floor, dbData.authCount, dbData.assoCount]
    pool.query(query, values)
  }))
  this.close()
  return response
}

/**
 * Adds a location node for a specific bulding floor map.
 * @param data TODO.
 */
module.exports.insertClientCoords = async (data) => {
  createConnection()
  data = Array.isArray(data) ? data : [data]
  const values = data.map(client => {
    const uid = createHmac('md5', process.env.MSE_MAC_HASH_KEY).update(client.mac).digest('hex')
    return [
      new Date(client.eventTime),
      uid,
      client.mapHierarchyString,
      client.campus,
      client.building,
      client.floor,
      client.x,
      client.y
    ]
  })

  try {
    const query = format('INSERT INTO clients_coordinates(time, uid, mapHierarchyString, campus, building, floor, x, y) VALUES %L', values)
    return pool.query(query)
  } catch (error) {
    logger('error', ['timescaledb-interaction', 'insertClientCoords', 'failed to insert coordinates', 'error', error.message])
    throw error
  } finally {
    this.close()
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
    client.imageBase64
  ])

  try {
    const query = format('INSERT INTO locations(mapHierarchyString, campus, building, floor, imageBase64) VALUES %L', values)
    return pool.query(query)
  } catch (error) {
    logger('error', ['timescaledb-interaction', 'insertClientCoords', 'failed to insert coordinates', 'error', error.message])
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
    logger('debug', ['timescaledb-interaction', 'connection close immediate', 'closing connection'])
    if (!pool) return
    pool.end()
    pool = undefined
  } else {
    logger('debug', ['timescaledb-interaction', 'setting connection close timeout'])
    connectionCloseTimer = setTimeout(() => {
      logger('debug', ['timescaledb-interaction', 'connection closing after timeout', 'closing connection'])
      if (!pool) return
      pool.end()
      pool = undefined
    }, 2000)
  }
}
