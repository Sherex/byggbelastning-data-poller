const fs = require('fs')

module.exports = {
  load: async path => {
    return JSON.parse(fs.readFileSync(path))
  },
  save: async (name, data) => {
    const path = './sample-data/reports/auto/'
    const currentDate = new Date()
    if (!fs.existsSync(path + name)) {
      fs.mkdirSync(path + name)
    }
    fs.writeFileSync(`./sample-data/reports/auto/${name}/${currentDate.toISOString()}.json`, JSON.stringify(data, null, 2))
  }
}
