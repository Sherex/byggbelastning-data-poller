const date = require('date-and-time')
const errorHandler = require('./error-handler')

/**
 * Parses data returned from Prime.
 * dataAttribute === 'eventTime' -> unixTime.
 * dataAttribute === 'key' -> locationObject.
 * dataAttribute === 'assoCount' or 'authCount' -> Int.
 * @param  {String} dataString URL to the API including path.
 * @param  {String} dataAttribute Headers to include in the request.
 * @return Formatted value, depending on dataAttribute.
 */
module.exports = (dataString, dataAttribute) => {
  if (dataAttribute === 'eventTime') {
    try {
      let dateTime = dataString.split(' ')

      // 'Sat Mar 09 12:29:48 CET 2019'
      // Remove '{day}' and 'CET' from string.
      // Always at the same place
      dateTime.splice(0, 1)
      dateTime.splice(3, 1)
      dateTime = dateTime.join(' ')

      // Parse and convert to unixTime.
      dateTime = date.parse(dateTime, 'MMM DD HH:mm:ss YYYY').getTime()

      return isNaN(dateTime) ? dataString : dateTime
    } catch (error) {
      errorHandler(error)
      return dataString
    }
  } else if (dataAttribute === 'key') {
    let formattedLocation = {}
    dataString = dataString.split(' > ')

    if (dataString[0] === 'Lokasjoner') {
      formattedLocation.location = dataString[1]
      formattedLocation.building = dataString[1]
      formattedLocation.floor = dataString[2]
    } else {
      formattedLocation.location = dataString[0]
      formattedLocation.building = dataString[1]
      formattedLocation.floor = dataString[2]
    }

    return formattedLocation
  } else if (dataAttribute === 'assoCount' || dataAttribute === 'authCount') {
    return Number(dataString)
  } else {
    return dataString
  }
}
