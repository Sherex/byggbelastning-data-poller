const Influx = require('influx')

const influx = new Influx.InfluxDB({
  host: 'localhost',
  database: 'prime_clients',
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

influx.getDatabaseNames()
  .then(names => {
    if (!names.includes('ocean_tides')) {
      return influx.createDatabase('ocean_tides');
    }
  })
  .then(() => {
    app.listen(app.get('port'), () => {
      console.log(`Listening on ${app.get('port')}.`);
    });
    writeDataToInflux(hanalei);
    writeDataToInflux(hilo);
    writeDataToInflux(honolulu);
    writeDataToInflux(kahului);
  })
  .catch(error => console.log({ error }));