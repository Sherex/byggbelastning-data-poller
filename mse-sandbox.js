const createMse = require('./lib/mse')
const db = require('./lib/db/timescaledb-interaction')

const { updateClientLocations } = createMse({
  baseUrl: process.env.MSE_API_URL,
  username: process.env.MSE_USERNAME,
  password: process.env.MSE_PASSWORD
})

;(async () => {
  // console.log(await db.getClientCoords())
  await updateClientLocations()
})()
