const { logger } = require('@vtfk/logger')
const db = require('../db/timescaledb-interaction')
const { writeFile } = require('fs').promises

;(async () => {
  const table = process.argv[2]

  let { rows: tables } = await db.query('SELECT * FROM information_schema.tables WHERE table_schema = \'public\'')
  tables = tables.map(table => table.table_name)
  if (!tables.includes(table)) {
    logger('error', ['export-to-csv', 'invalid table name'])
    console.log('Please use on of these tables as the first argument:')
    console.log(`Example: "npm run db:export -- ${tables[0]}"`)
    console.log(`-----\n${tables.join('\n')}\n-----`)
    process.exit(0)
  }

  let data
  try {
    const response = await db.query(`SELECT * FROM ${table}`)
    await db.close({ immediate: true })
    data = response.rows
  } catch (error) {
    logger('error', ['export-to-csv', 'invalid query', 'error', error])
    process.exit(0)
  }

  if (data.length <= 0) {
    logger('warn', ['export-to-csv', 'no data in table', 'exiting...'])
    process.exit(0)
  }

  logger('debug', ['mse-sandbox', 'exporting to csv', 'rows', data.length])
  const csvClients = [Object.keys(data[0])]

  data.forEach(client => csvClients.push(getValues(client)))
  const csv = csvClients.map(client => client.join(',')).join('\n')
  writeFile(`./${table}.csv`, csv, 'utf8')
})().catch(error => {
  logger('error', ['export-to-csv', 'error', error])
})

function getValues (object) {
  const keys = Object.keys(object)
  return keys.map(key => key === 'time' ? object[key].toISOString() : object[key])
}
