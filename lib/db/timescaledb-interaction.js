require('dotenv').config()
const { Pool } = require('pg')

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT
})

/**
 * Creates a DB if it doesn't exist.
 */
module.exports.createDb = async () => {
  const createTable = `
    CREATE TABLE IF NOT EXISTS clients_location (
      time        TIMESTAMPTZ   NOT NULL,
      location    TEXT          NOT NULL,
      building    TEXT          NOT NULL,
      floor       TEXT          NOT NULL,
      authCount   INTEGER       NULL,
      assoCount   INTEGER       NULL
    );
  `
  await pool.query(createTable)
  await pool.query('SELECT create_hypertable(\'clients_location\', \'time\', if_not_exists => TRUE);')
}

/**
 * Writes number of associated and autheticated clients per location.
 * @param data Either array of parsed objects or one object.
 */
module.exports.insertClientLocations = async (data) => {
  data = Array.isArray(data) ? data : [data]
  data = await Promise.all(data.map(dbData => {
    const query = 'INSERT INTO clients_location(time, location, building, floor, authCount, assoCount) VALUES($1, $2, $3, $4, $5, $6)'
    const values = [new Date(dbData.eventTime), dbData.key.location, dbData.key.building, dbData.key.floor, dbData.authCount, dbData.assoCount]
    pool.query(query, values)
  }))
  this.close()
  return data
}

/**
 * Adds a location node for a specific bulding floor map.
 * @param data TODO.
 */
module.exports.insertClientCoords = async (data) => {
  const query = 'INSERT INTO clients_coordinates(time, floorRefId, x, y) VALUES($1, $2, $3, $4)'
  const values = [new Date(data.eventTime), data.floorRefId, data.x, data.y]
  return pool.query(query, values)
}

/**
 * Close connection to the DB
 */
module.exports.close = () => {
  // TODO: Does not support calls after close
  return pool.end()
}
