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
}

/**
 * Writes data to db.
 * @param  data Either array of parsed objects or one object.
 */
module.exports.insertClientLocations = async (data) => {
  data = Array.isArray(data) ? data : [data]
  const data = await Promise.all(data.map(dbData => {
    const query = `INSERT INTO clients_location(time, location, building, floor, authCount, assoCount) VALUES($1, $2, $3, $4, $5, $6)`
    const values = [new Date(dbData.eventTime), dbData.key.location, dbData.key.building, dbData.key.floor, dbData.authCount, dbData.assoCount]
    pool.query(query, values)
  }))
  this.close()
  return data
}

/**
 * Close connection to the DB
 */
module.exports.close = () => {
  return pool.end()
}