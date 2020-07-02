const db = require('../db/timescaledb-interaction')

const action = process.argv[2]

const validArguments = {
  setup: async (args) => {
    await db.setupDB()
    let { rows: tables } = await db.query('SELECT * FROM information_schema.tables WHERE table_schema = \'public\'')
    tables = tables.map(table => table.table_name)
    console.log(`Created tables:\n-----\n${tables.join('\n')}\n-----`)
    await db.close({ immediate: true })
  },
  drop_tables: async (args) => {
    let tables = []
    if (args[0] === '*') {
      const { rows } = await db.query('SELECT * FROM information_schema.tables WHERE table_schema = \'public\'')
      tables = rows.map(table => table.table_name)
    } else if (args.length < 1) {
      const { rows } = await db.query('SELECT * FROM information_schema.tables WHERE table_schema = \'public\'')
      tables = rows.map(table => table.table_name)
      console.log('Please use at least one of these tables as an argument, or \'*\' for all tables:')
      console.log(`Example: "npm run db:drop_tables -- ${tables[0]}"`)
      console.log('Example: "npm run db:drop_tables -- *"')
      console.log(`-----\n${tables.join('\n')}\n-----`)
      process.exit(0)
    } else {
      tables = args
    }

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

const args = process.argv.slice(3)

validArguments[action](args)
  .then(() => {
    console.log(`Action '${action}' executed successfully!`)
  })
  .catch((error) => {
    console.log(`Action '${action}' failed with error!`)
    console.error(error)
  })
