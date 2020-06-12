const { Readable } = require('stream')
const db = require('./db/timescaledb-interaction')

function parseMseLocationData (client) {
  const mapInfo = client.WirelessClientLocation.MapInfo
  const clientCoord = client.WirelessClientLocation.MapCoordinate
  const timeLocated = client.WirelessClientLocation.Statistics.lastLocatedTime

  if (clientCoord.unit === 'FEET') {
    clientCoord.x = feetToMeters(clientCoord.x)
    clientCoord.y = feetToMeters(clientCoord.y)
    clientCoord.unit = 'METERS'
  } else if (clientCoord.unit !== 'METERS') {
    throw Error('Unexpected client coordinates unit')
  }
  return {
    eventTime: new Date(timeLocated),
    mac: client.WirelessClientLocation.macAddress,
    x: clientCoord.x,
    y: clientCoord.y,
    floorRefId: mapInfo.floorRefId
  }
}

function feetToMeters (feet) {
  return feet / 3.28
}

const readableStream = new Readable({
  objectMode: true,
  read () {}
})

readableStream.on('data', async responseData => {
  console.log(parseMseLocationData(responseData))
  const parsedData = parseMseLocationData(responseData)
  await db.setupDB()
  await db.insertClientCoords(parsedData)
})

readableStream.on('end', async () => {
  await db.close()
})

readableStream.on('error', async error => {
  console.error(error)
  await db.close()
})

/**
 * Resolves a promise containing client info from MSE
 */
module.exports = {
  push: (data) => {
    readableStream.push(data)
  }
}
