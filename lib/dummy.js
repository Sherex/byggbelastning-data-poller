const fs = require('fs')

const autoPath = './sample-data/auto'

module.exports = {
  load: async name => {
    const path = getLatestFile(`${autoPath}/${name}`)
    return JSON.parse(fs.readFileSync(path))
  },
  save: async (name, data) => {
    const currentDate = new Date()
    if (!fs.existsSync(`${autoPath}/${name}`)) {
      fs.mkdirSync(`${autoPath}/${name}`)
    }
    fs.writeFileSync(`${autoPath}/${name}/${currentDate.toISOString()}.json`, JSON.stringify(data, null, 2))
  }
}

function getLatestFile (path) {
  if (!fs.existsSync(path)) throw Error(`Unknown directory '${path}'`)
  const files = fs.readdirSync(path)
  if (files.length < 1) throw Error(`No files in directory '${path}'`)

  let latestFile
  files.forEach(file => {
    file = file.replace('.json', '')
    latestFile = !latestFile ? file : latestFile
    if (new Date(latestFile) < new Date(file)) latestFile = file
  })
  return `${path}/${latestFile}.json`
}
