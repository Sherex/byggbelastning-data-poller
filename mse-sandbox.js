const { logger } = require('@vtfk/logger')
const createMse = require('./lib/mse')
const db = require('./lib/db/timescaledb-interaction')

const mse = createMse({
  baseUrl: process.env.MSE_API_URL,
  username: process.env.MSE_USERNAME,
  password: process.env.MSE_PASSWORD
})

;(async () => {
  const oldClients = await db.getClientCoords()
  await mse.updateClientLocations()
  const clients = await db.getClientCoords()
  logger('debug', ['mse-sandbox', 'old clients in db', oldClients.length, 'total clients', clients.length])
  await db.close({ immediate: true })
})().catch(error => {
  console.error(error)
})

// ;(async () => {
//   const locations = await mse.updateLocations()
//   // const { rows: locations } = await db.query('SELECT imageBase64,mapHierarchyString FROM locations')
//   const html = `<html><body>${locations.map(loc => `<h1>${loc.maphierarchystring}</h1><img src="data:image/jpeg;base64,${loc.imagebase64}" style="width: 50em;"><br>`)}</body></html>`
//   require('fs').writeFileSync('./test.html', html)
//   // console.log(locations.map(loc => ({
//   //   ...loc,
//   //   imageBase64: loc.imageBase64.substr(0, 20)
//   // })))
// })()
