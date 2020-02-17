const { readFile } = require('fs').promises
const { createReadStream } = require('fs')
const byline = require('byline')
const csvParser = require('csv-parse')

const csvPath = 'sample-data/reports/csv/client-by-floor.csv'

/**
 * Returns an array with contents of a csv file.
 * @param  {Buffer} csv CSV file as buffer
 * @return {Array} Client count per location.
 */
module.exports = async (csvStream) => {

}

async function dummy () {
  const csvFile = readFile(csvPath)
  return csvFile
}

/**
 * Returns a promise with client count for each location.
 * @param  {Array} titles CSV file as buffer
 * @return {Array} Client count per location.
 */
async function extractCsvTableByTitle (titles, csv) {
  if (!titles || !Array.isArray(titles)) throw Error('Required argument "titles" <Array> is missing')
  if (!csv) throw Error('Required argument "csv" <Buffer> is missing')

  const lines = csv.toString('utf-8').split('\n')
  const extractedCsvs = []
  const whitespaceOrBlank = /^\s*$|^$/m

  const loopVars = {
    inCsv: false,
    tempCsvStorage: []
  }
  lines.forEach(line => {
    if (titles.includes(line)) loopVars.inCsv = true
    else if (loopVars.inCsv) loopVars.tempCsvStorage.push(line)
    else if (loopVars.inCsv && line.match(whitespaceOrBlank)) {
      loopVars.inCsv = false
      extractedCsvs.push(Buffer.from(loopVars.tempCsvStorage))
      loopVars.tempCsvStorage = []
    }
  })
  return extractedCsvs
};

async function extractCsvTableByTitleStream (titles, path) {
  if (!titles || !Array.isArray(titles)) throw Error('Required argument "titles" <Array> is missing')
  if (!path) throw Error('Required argument "path" <String> is missing')

  const csvStream = byline(createReadStream(path), { keepEmptyLines: true })
  const extractedCsvs = []
  const whitespaceOrBlank = /^\s*$|^$/m

  const loopVars = {
    inCsv: false,
    tempCsvStorage: []
  }
  csvStream.on('data', line => {
    
  })
  csvStream.on('data', line => {
    console.log(line.toString())
  })
  /*
  lines.forEach(line => {
    if (titles.includes(line)) loopVars.inCsv = true
    else if (loopVars.inCsv) loopVars.tempCsvStorage.push(line)
    else if (loopVars.inCsv && line.match(whitespaceOrBlank)) {
      loopVars.inCsv = false
      extractedCsvs.push(Buffer.from(loopVars.tempCsvStorage))
      loopVars.tempCsvStorage = []
    }
  })
  */
  return extractedCsvs
};

(async () => {
  const csvs = await extractCsvTableByTitle(['Client Count', 'Total Client Count'], await dummy())
  const csvsStream = await extractCsvTableByTitleStream(['Client Count', 'Total Client Count'], csvPath)
  console.log(csvsStream)
})()
