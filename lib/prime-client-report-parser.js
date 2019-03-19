const date = require('date-and-time')
const date2 = require('normalize-date')
const errorHandler = require('./error-handler')

/**
 * Parses data returned from Prime Report.
 * dataAttribute === 'sessionStartTime' -> unixTime.
 * @param  {String} dataString URL to the API including path.
 * @param  {String} dataAttribute Headers to include in the request.
 * @return Formatted value, depending on dataAttribute.
 */
module.exports = (dataString, dataAttribute) => {
  if (dataAttribute === 'sessionStartTime') {
    try {
      // Move timezone to first element
      let dateTime = dataString.split(' ')
      const timezone = dateTime.splice(4, 1)
      dateTime.unshift(timezone)
      dateTime = dateTime.join(' ')
      
      dateTime = date2(dateTime).getTime()

      if (dateTime === 'Invalid Date') {
        throw Error('Dateparser returned Invalid Date')
      }
      return dateTime
    } catch (error) {
      errorHandler(error)
      return dataString
    }
  }
  return dataString
}
