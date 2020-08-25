const fs = require('fs')
const { logger } = require('@vtfk/logger')

const autoPath = './sample-data/auto'

module.exports = {
  load: async name => {
    const path = getLatestFile(`${autoPath}/${name}`)
    return JSON.parse(fs.readFileSync(path))
  },
  save: async (name, data) => {
    try {
      const currentDate = new Date()
      if (!fs.existsSync(`${autoPath}/${name}`)) {
        fs.mkdirSync(`${autoPath}/${name}`)
      }
      const stringifiedData = JSON.stringify(data, null, 2)
      // fs.writeFileSync(`${autoPath}/${name}/${currentDate.toISOString()}.json`, JSON.stringify(data, null, 2))

      const stringMaxLength = 200000000
      Array.from(Array(Math.ceil(stringifiedData.length / stringMaxLength))).forEach((empty, i) => {
        const partIndex = i * stringMaxLength
        const part = stringifiedData.slice(partIndex, partIndex + stringMaxLength)
        fs.appendFileSync(`${autoPath}/${name}/${currentDate.toISOString()}.json`, part)
      })
    } catch (error) {
      logger('warn', ['dummy', 'save', 'failed to save data', 'error', error.message])
      console.error(error)
    }
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
