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
async function setupDB () {
  createConnection()
  const dbSchemaQuery = readFileSync('./src/lib/db/db-schema.sql', 'utf8')
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

async function insertLocation (data) {
  const typeCodes = data
    .map(({ locationType }) => locationType)
    .reduce((prev, type) => prev.includes(type) ? prev : [...prev, type], [])
    .filter(type => type)

  createConnection()
  const client = await pool.connect()
  if (typeCodes.length > 0) {
    let { rows: knownLocationTypes } = await client.query(format(`
      SELECT id, code
      FROM location_type
      WHERE code IN %L
    `, [typeCodes]))

    const unknownLocationTypes = typeCodes
      .filter(type => !knownLocationTypes.map(row => row.code).includes(type))
      .map(type => ({ code: type }))
    if (unknownLocationTypes.length > 0) {
      const insertedTypes = await insertLocationType(unknownLocationTypes)
      knownLocationTypes = [
        ...knownLocationTypes,
        ...insertedTypes.rows
      ]
    }
  }

  const values = data.map(({ location, locationType }) => [location, locationType])

  try {
    const query = format(`
      WITH ins (location, type) AS (
        VALUES %L
      )
      INSERT INTO location (name, type_id)
        SELECT ins.location, lt.id
        FROM ins
        INNER JOIN location_type lt
          ON ins.type = lt.code
        GROUP BY (ins.location, lt.id)
        ORDER BY (ins.location, lt.id)
      ON CONFLICT DO NOTHING;
    `, values)
    return await client.query(query)
  } catch (error) {
    logger('error', ['timescaledb-interaction', 'insertLocation', 'failed to insert location', 'error', error.message])
    throw error
  } finally {
    client.release()
  }
}

async function insertLocationType (data) {
  const values = data.map(({ code }) => [code])

  createConnection()
  const client = await pool.connect()

  try {
    logger('debug', ['timescaledb-interaction', 'insertLocationType', 'inserting types', 'count', data.length])
    const query = format(`
      INSERT INTO location_type (code)
      VALUES %L
      ON CONFLICT DO NOTHING
      RETURNING id, code;
    `, values)
    return await client.query(query)
  } catch (error) {
    logger('error', ['timescaledb-interaction', 'insertLocationType', 'failed to insert location type', 'error', error.message])
    throw error
  } finally {
    client.release()
  }
}

async function insertBuilding (data) {
  createConnection()
  const client = await pool.connect()
  const values = data.map(({ location, locationType, building }) => [location, locationType, building])

  try {
    const query = format(`
      WITH ins (location, type, building) AS (
        VALUES %L
      )
      INSERT INTO building (name, location_id)
        SELECT ins.building, l.id
          FROM ins
          INNER JOIN location_type lt
            ON lt.code = ins.type
          INNER JOIN location l
            ON  l.name = ins.location
            AND l.type_id = lt.id
          GROUP BY (l.id, ins.building)
          ORDER BY (l.id, ins.building)
      ON CONFLICT DO NOTHING;
    `, values)
    return await client.query(query)
  } catch (error) {
    logger('error', ['timescaledb-interaction', 'insertBuilding', 'failed to insert building', 'error', error.message])
    throw error
  } finally {
    client.release()
  }
}

async function insertFloor (data) {
  createConnection()
  const client = await pool.connect()
  const values = data.map(({ location, locationType, building, floor, mseFloorId }) => [location, locationType, building, floor, mseFloorId])

  try {
    const query = format(`
      WITH ins (location, type, building, floor, mse_floor_id) AS (
        VALUES %L
      )
      INSERT INTO floor (name, building_id, mse_floor_id)
        SELECT ins.floor, b.id, ins.mse_floor_id
          FROM ins
          INNER JOIN location_type lt
            ON lt.code = ins.type
          INNER JOIN location l
            ON  l.name = ins.location
            AND l.type_id = lt.id
          INNER JOIN building b
            ON  b.location_id = l.id
            AND b.name = ins.building
          GROUP BY (l.id, b.id, ins.floor, ins.mse_floor_id)
          ORDER BY (l.id, b.id, ins.floor, ins.mse_floor_id)
      ON CONFLICT DO NOTHING;
    `, values)
    return await client.query(query)
  } catch (error) {
    logger('error', ['timescaledb-interaction', 'insertFloor', 'failed to insert floor', 'error', error.message])
    throw error
  } finally {
    client.release()
  }
}

async function updateFloor (data) {
  createConnection()
  const client = await pool.connect()
  const queryRaw = readFileSync('./src/lib/db/update-floors.sql', 'utf8')
  const values = data.map(
    ({ locationType, location, building, floor, mseFloorId }) => [locationType, location, building, floor, mseFloorId]
  )

  try {
    const query = format(queryRaw, values)
    await client.query('REFRESH MATERIALIZED VIEW location_view;')
    const queryResult = await client.query(query)
    await client.query('REFRESH MATERIALIZED VIEW location_view;')
    let stats
    // Dumb check if query has changed
    if (queryResult.length === 8) {
      const [locChange, bldChange, flChange] = queryResult.filter(cmd => cmd.command === 'UPDATE').map(cmd => cmd.rowCount)
      stats = {
        locChange,
        bldChange,
        flChange
      }
    }
    logger('debug', ['timescaledb-interaction', 'updateFloor', 'success', 'updated', 'locations', stats.locChange, 'buildings', stats.bldChange, 'floors', stats.flChange])
    return stats
  } catch (error) {
    logger('error', ['timescaledb-interaction', 'updateFloor', 'failed to update floors', 'error', error.message])
    throw error
  } finally {
    client.release()
  }
}

// TODO: If mse_floor_id = null (new floor in prime) alert, skip and continue
const clientCoordsQueue = {
  count: 0,
  running: false,
  queue: []
}
/**
 * Adds a location node for a specific bulding floor map.
 * @param {{firstLocatedTime: String, lastLocatedTime: String, mac: String, location: String, building: String, floor: String, x: Number, y: Number}[]} data Data to insert
 */
async function insertClientCoords (data) {
  data = Array.isArray(data) ? data : [data]
  const valuesToQueue = data.map(client => {
    const cid = createHmac('md5', process.env.MSE_MAC_HASH_KEY).update(client.mac).digest('hex')
    return [
      new Date(client.firstLocatedTime),
      new Date(client.lastLocatedTime),
      cid,
      client.location,
      client.building,
      client.floor,
      client.mseFloorId,
      client.x,
      client.y
    ]
  })
  clientCoordsQueue.queue.push(...valuesToQueue)

  if (clientCoordsQueue.running) return
  clientCoordsQueue.running = true
  clientCoordsQueue.count++

  while (clientCoordsQueue.queue.length > 0) {
    logger('silly', ['timescaledb-interaction', 'insertClientCoords', 'loops runnning', clientCoordsQueue.count])
    createConnection()
    logger('debug', ['timescaledb-interaction', 'insertClientCoords', 'looping', 'clients left in queue', clientCoordsQueue.queue.length])
    const values = clientCoordsQueue.queue.splice(0, 5000)

    try {
      // TODO: Update last_located, x, y on conflict?
      // TODO: Figure out why there are duplicates and mismatches of the mse_floor_id
      const query = format(`
        WITH ins (first_located, last_located, cid, location, building, floor, mse_floor_id, x, y) AS (
          VALUES %L
        )
        INSERT INTO client_coordinate (first_located, last_located, floor_id, cid, x, y)
          SELECT
            ins.first_located::TIMESTAMPTZ,
            ins.last_located::TIMESTAMPTZ,
            lv.floor_id,
            ins.cid,
            ins.x::NUMERIC(10, 4),
            ins.y::NUMERIC(10, 4)
          FROM ins
          INNER JOIN location_view lv
            --ON ins.mse_floor_id = lv.mse_floor_id
            ON ins.location = lv.location_fullname AND
            ins.building = lv.building_name AND
            ins.floor = lv.floor_name
        ON CONFLICT DO NOTHING`,
      values
      )
      const queryResponse = await pool.query(query)
      logger('debug', ['timescaledb-interaction', 'insertClientCoords', 'success', 'rows changed', queryResponse.rowCount])
    } catch (error) {
      logger('error', ['timescaledb-interaction', 'insertClientCoords', 'failed to insert coordinates', 'error', error.message])
      throw error
    } finally {
      this.close()
    }
  }
  clientCoordsQueue.running = false
  clientCoordsQueue.count--
}

/**
 * Writes number of associated and autheticated clients per location.
 * @param data Either array of parsed objects or one object.
 * @return {Promise<any[]>}
 */
async function insertClientLocations (data) {
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

async function getClientCoords () {
  createConnection()
  const query = 'SELECT * FROM clients_coordinates'
  const response = await pool.query(query)
  this.close()
  return response.rows
}

async function insertLocationMaps (data) {
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

async function query (query, values) {
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
function close (options) {
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

module.exports = {
  setupDB,
  insertLocation,
  insertLocationType,
  insertBuilding,
  insertFloor,
  updateFloor,
  insertClientCoords,
  insertClientLocations,
  getClientCoords,
  insertLocationMaps,
  query,
  close
}
