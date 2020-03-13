const { Readable } = require('stream')
const db = require('./timescaledb-interaction')

function parseMseLocationData (client) {
  const mapInfo = client.WirelessClientLocation.mapInfo
  const clientCoord = client.WirelessClientLocation.MapCoordinate

  if (clientCoord.unit === 'FEET') {
    clientCoord.x = feetToMeters(clientCoord.x)
    clientCoord.y = feetToMeters(clientCoord.y)
    clientCoord.unit = 'METERS'
  } else if (clientCoord.unit !== 'METERS') {
    throw Error('Unexpected client coordinates unit')
  }
  return {
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

readableStream.on('data', async responsePromise => {
  const responseData = await responsePromise
  console.log(parseMseLocationData(responseData.data))
  const parsedData = parseMseLocationData(responseData.data)
  await db.createDb
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
module.exports = (response) => {
  readableStream.push(response)
}
