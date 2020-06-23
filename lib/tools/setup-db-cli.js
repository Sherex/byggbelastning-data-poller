const db = require('./timescaledb-interaction')

const action = process.argv[2]

const validArguments = {
  setup: async () => {
    await db.setupDB()
    let { rows: tables } = await db.query('SELECT * FROM information_schema.tables WHERE table_schema = \'public\'')
    tables = tables.map(table => table.table_name)
    console.log(`Created tables:\n-----\n${tables.join('\n')}\n-----`)
    await db.close({ immediate: true })
  },
  drop_all_tables: async () => {
    let { rows: tables } = await db.query('SELECT * FROM information_schema.tables WHERE table_schema = \'public\'')
    tables = tables.map(table => table.table_name)

    if (tables.length >= 1) {
      console.log(`Dropping tables:\n-----\n${tables.join('\n')}\n-----`)
      await Promise.all(tables.map(async table => db.query(`DROP TABLE ${table}`)))
    } else {
      console.log('No tables to drop!')
    }
    await db.close({ immediate: true })
  }
}

function showArguments () {
  console.log(`Valid arguments:\n${Object.keys(validArguments).join(' | ')}`)
}

if (!action) {
  console.log('Please pass an argument..')
  showArguments()
  process.exit(0)
}

if (!Object.keys(validArguments).includes(action)) {
  console.log(`Invalid argument '${action}'..`)
  showArguments()
  process.exit(0)
}

validArguments[action]()
  .then(() => {
    console.log(`Action '${action}' executed successfully!`)
  })
  .catch((error) => {
    console.log(`Action '${action}' failed with error!`)
    console.error(error)
  })
