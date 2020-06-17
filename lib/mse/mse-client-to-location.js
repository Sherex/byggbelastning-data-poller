const db = require('../db/timescaledb-interaction')

function parseMseLocationData (client) {
  const mapInfo = client.MapInfo
  const clientCoord = client.MapCoordinate
  const timeLocated = client.Statistics.lastLocatedTime

  if (clientCoord.unit === 'FEET') {
    clientCoord.x = feetToMeters(clientCoord.x)
    clientCoord.y = feetToMeters(clientCoord.y)
    clientCoord.unit = 'METER'
  } else if (clientCoord.unit !== 'METER') {
    throw Error('Unexpected client coordinates unit')
  }
  return {
    eventTime: new Date(timeLocated),
    mac: client.macAddress,
    x: clientCoord.x,
    y: clientCoord.y,
    floorRefId: mapInfo.floorRefId
  }
}

function feetToMeters (feet) {
  return feet / 3.28
}

async function insertClients (clients) {
  clients = clients.map(parseMseLocationData)
  return db.insertClientCoords(clients)
}

/**
 * Resolves a promise containing client info from MSE
 */
module.exports = {
  insertClients
}
