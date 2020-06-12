const createMse = require('./lib/mse')

const { updateClientLocations } = createMse({
  baseUrl: process.env.PRIME_API_URL,
  username: process.env.PRIME_USERNAME,
  password: process.env.PRIME_PASSWORD
})

;(async () => {
  await updateClientLocations()
})()
