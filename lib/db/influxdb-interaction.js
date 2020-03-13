require('dotenv').config()
const Influx = require('influx')
const errorHandler = require('../error-handler')

const influx = new Influx.InfluxDB({
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  schema: [
    {
      measurement: 'clients_location',
      fields: {
        authCount: Influx.FieldType.INTEGER,
        assoCount: Influx.FieldType.INTEGER
      },
      tags: ['location', 'building', 'floor']
    }
  ]
})

/**
 * Creates a DB if it doesn't exist.
 */
module.exports.createDb = async () => {
  // Create a db if it doesn't exist
  try {
    const names = await influx.getDatabaseNames()
    if (!names.includes(process.env.DB_NAME)) {
      return influx.createDatabase(process.env.DB_NAME)
    }
  } catch (error) {
    errorHandler(error)
  }
}

/**
 * Writes data to db.
 * @param  data Either array of parsed objects or one object.
 */
module.exports.insertClientLocations = (data) => {
  data = (Array.isArray(data) ? data : [data])

  const influxData = data.map(dbData => {
    return {
      measurement: 'clients_location',
      tags: {
        location: dbData.key.location,
        building: dbData.key.building,
        floor: dbData.key.floor
      },
      fields: {
        authCount: dbData.authCount,
        assoCount: dbData.assoCount
      },
      timestamp: dbData.eventTime
    }
  })

  addToDb(influxData)

  function addToDb (dbData) {
    influx.writePoints(
      dbData, {
        database: process.env.DB_NAME,
        precision: 'ms'
      }
    ).catch(error => {
      errorHandler(error)
    })
  }
}
