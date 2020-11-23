const { logger } = require('@vtfk/logger')
const db = require('../db/timescaledb-interaction')
const pLimit = require('p-limit')
const dummy = require('../dummy')

module.exports = async (mse) => {
  const stopAtTime = await getLastStoppingTime()
  const path = 'api/contextaware/v1/location/history/clients.json'
  const pageSize = process.env.MSE_PAGE_SIZE || 5000
  const pollerCount = process.env.MSE_POLLER_COUNT || 1

  logger('debug', ['mse-update-client-locations', 'GET path', path])
  let { data } = await mse.get(`${path}?page=1&pageSize=${pageSize}&sortBy=lastLocatedTime:desc`)

  logger('debug', ['mse-update-client-locations', 'got data'])
  if (!(data && data.Locations && data.Locations.entries)) {
    logger('error', ['mse-update-client-locations', 'first response did not contain any entries'])
    throw Error('First response did not contain any entries')
  }

  let clients = data.Locations.entries

  logger('silly', ['mse-update-client-locations', 'pushing clients to client-parser', clients.length])
  await insertClients(clients)

  const { totalPages } = data.Locations

  const stats = {
    success: 1,
    failed: 0,
    totalClients: clients.length
  }

  // Create array with all page numbers to get and removing first page as we already have it
  const pagesToGet = Array.from(Array(totalPages)).map((e, i) => i + 1).slice(1)
  const getPageFunctions = pagesToGet.map(page => async () => {
    try {
      ({ data } = await mse.get(`${path}?page=${page}&pageSize=${pageSize}&sortBy=lastLocatedTime:desc`))

      if (!(data && data.Locations && data.Locations.entries)) throw Error('page response did not contain any entries')
      clients = data.Locations.entries

      await insertClients(clients)
      stats.success++
      stats.totalClients += clients.length

      let lastClientTime = null
      try {
        lastClientTime = new Date(clients[clients.length - 1].Statistics.lastLocatedTime)

        if (!isNaN(lastClientTime) && stopAtTime !== null && lastClientTime < stopAtTime) {
          logger('info', ['mse-update-client-locations', 'reached last stopping point', 'clearing queue', 'page', page])
          limit.clearQueue()
          return
        }
      } catch (error) {
        logger('warn', ['mse-update-client-locations', 'couldn\'t get \'lastLocatedTime\' for page', page, 'error', error.message])
        lastClientTime = null
      }

      logger('debug', ['mse-update-client-locations', 'successfully got page', `${page}/${totalPages}`, 'last client time', lastClientTime])
    } catch (error) {
      logger('warn', ['mse-update-client-locations', 'failed to get page', `${page}/${totalPages}`, 'skipping page', 'error', error.message])
      stats.failed++
    }
  })

  const limit = pLimit(pollerCount)
  await Promise.all(getPageFunctions.map(limit))

  logger('info', ['mse-update-client-locations', 'all requests done', 'successful', stats.success, 'failed', stats.failed, 'total clients', stats.totalClients])

  return { stats }
}

// TODO: Select last time from earliest campus time (yay great explanation..)
async function getLastStoppingTime () {
  const data = await db.query('SELECT last_located FROM client_coordinate ORDER BY last_located DESC LIMIT 1')
  if (
    data &&
    data.rows &&
    data.rows.length > 0 &&
    data.rows[0].last_located &&
    !isNaN(data.rows[0].last_located)
  ) return data.rows[0].last_located
  logger('warn', ['mse-update-client-locations', 'getLastStoppingTime', 'couldn\'t find the last valid stopping time'])
  return null
}

function parseMseLocationData (client) {
  const mapInfo = client.MapInfo
  const clientCoord = client.MapCoordinate
  const firstLocatedTime = client.Statistics.firstLocatedTime
  const lastLocatedTime = client.Statistics.lastLocatedTime

  if (clientCoord.unit === 'FEET') {
    clientCoord.x = feetToMeters(clientCoord.x)
    clientCoord.y = feetToMeters(clientCoord.y)
    clientCoord.unit = 'METER'
  } else if (clientCoord.unit !== 'METER') {
    // TODO: Do not throw, skip if incorrect
    throw Error('Unexpected client coordinates unit')
  }
  return {
    firstLocatedTime: new Date(firstLocatedTime),
    lastLocatedTime: new Date(lastLocatedTime),
    mac: client.macAddress,
    x: clientCoord.x,
    y: clientCoord.y,
    mapHierarchyString: mapInfo.mapHierarchyString,
    location: mapInfo.mapHierarchyString.split('>')[0],
    building: mapInfo.mapHierarchyString.split('>')[1],
    floor: mapInfo.mapHierarchyString.split('>')[2],
    mseFloorId: mapInfo.floorRefId
  }
}

function feetToMeters (feet) {
  return feet / 3.28
}

async function insertClients (clients) {
  // dummy.save('client-coords-query', clients)
  clients = clients.map(parseMseLocationData)
  // dummy.save('client-coords-query-parsed', clients)
  return db.insertClientCoords(clients)
}
