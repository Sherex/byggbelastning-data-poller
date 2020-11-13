const { createReadStream } = require('fs')
const byline = require('byline')
const csvParser = require('csv-parser')
const { Transform } = require('stream')

const csvPath = 'sample-data/reports/csv/client-by-floor.csv'

/** Extracts content in a stream between a specified title and blank line or whitespace. */
class ExtractCsv extends Transform {
  /**
   * @param {String} title Defines the title to extract
   */
  constructor (title) {
    super()
    this.title = title
    this.inCsv = false
  }

  _transform (line, encoding, done) {
    line = line.toString('utf-8')
    const whitespaceOrBlank = /^\s*$|^$/m
    if (line.match(`^${this.title}$`)) {
      this.inCsv = true
    } else if (line.match(whitespaceOrBlank) && this.inCsv) {
      this.inCsv = false
    } else if (this.inCsv) {
      this.push(Buffer.from(line + '\n'))
    }
    done()
  }
}

/**
 * Returns an array with contents of a csv file.
 * @param  {Buffer} csv CSV file as buffer
 * @return {Promise<Array>} Client count per location.
 */
// module.exports = (pathToCsv, titleToExtract) => {
async function convertCiscoPrimeCsv (pathToCsv, titleToExtract) {
  if (!titleToExtract) throw Error('Required argument "titleToExtract" <String> is missing')
  if (!pathToCsv) throw Error('Required argument "pathToCsv" <String> is missing')

  const extractedCsv = []

  await new Promise(function (resolve, reject) {
    byline(createReadStream(pathToCsv), { keepEmptyLines: true })
      .on('error', error => reject(error))
      .pipe(new ExtractCsv(titleToExtract))
      .on('error', error => reject(error))
      .pipe(csvParser())
      .on('error', error => reject(error))
      .on('data', data => extractedCsv.push(data))
      .on('end', () => resolve(extractedCsv))
  })

  return extractedCsv
};

(async () => {
  console.log(await convertCiscoPrimeCsv(csvPath, 'Client Count'))
})()
