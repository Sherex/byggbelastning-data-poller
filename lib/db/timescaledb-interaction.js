require('dotenv').config()
const { Pool } = require('pg')

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
module.exports.createDb = async () => {
  createConnection()
  // await pool.query('DROP TABLE clients_coordinates')
  console.log((await pool.query('SELECT * FROM clients_coordinates')).rows)
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
      time        TIMESTAMPTZ    NOT NULL,
      floorRefId  TEXT           NOT NULL,
      x           NUMERIC(10, 4) NOT NULL,
      y           NUMERIC(10, 4) NOT NULL
    );
  `
  await pool.query(createClientsCoordinatesTable)
  await pool.query('SELECT create_hypertable(\'clients_coordinates\', \'time\', if_not_exists => TRUE);')
}

/**
 * Writes number of associated and autheticated clients per location.
 * @param data Either array of parsed objects or one object.
 */
module.exports.insertClientLocations = async (data) => {
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
  const query = 'INSERT INTO clients_coordinates(time, floorRefId, x, y) VALUES($1, $2, $3, $4)'
  const values = [new Date(data.eventTime), data.floorRefId, data.x, data.y]
  const response = pool.query(query, values)
  this.close()
  return response
}

let connectionCloseTimer
/**
 * Close connection to the DB
 */
module.exports.close = () => {
  if (connectionCloseTimer) {
    console.log('Clearing timer')
    clearTimeout(connectionCloseTimer)
  }
  console.log('Setting timer')
  connectionCloseTimer = setTimeout(() => {
    console.log('Closing connection')
    pool.end()
    pool = undefined
  }, 2000)
}
