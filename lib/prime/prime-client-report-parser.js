const date2 = require('normalize-date')

/**
 * Parses data returned from Prime Report.
 * dataAttribute === 'sessionStartTime' -> unixTime.
 * @param  {String} dataString URL to the API including path.
 * @param  {String} dataAttribute Headers to include in the request.
 * @return Formatted value, depending on dataAttribute.
 */
module.exports = (dataString, dataAttribute) => {
  if (dataAttribute === 'sessionStartTime' || dataAttribute === 'updateTime') {
    return parseTime(dataString)
  } else if (dataAttribute === 'heirarchyname') {
    return parseLocation(dataString)
  }
  return dataString
}

function parseTime (timeString) {
  // Move timezone to first element for the parser
  let dateTime = timeString.split(' ')
  const timezone = dateTime.splice(4, 1)
  dateTime.unshift(timezone)
  dateTime = dateTime.join(' ')
  dateTime = date2(dateTime).getTime()

  if (isNaN(dateTime)) {
    throw Error('Dateparser returned Invalid Date')
  }
  return dateTime
}

function parseLocation (locationString) {
  const formattedLocation = {}
  locationString = locationString.split(' > ')

  if (locationString[0] === 'Lokasjoner') {
    formattedLocation.location = locationString[1]
    formattedLocation.building = locationString[1]
    formattedLocation.floor = locationString[2]
  } else {
    formattedLocation.location = locationString[0]
    formattedLocation.building = locationString[1]
    formattedLocation.floor = locationString[2]
  }

  return formattedLocation
}
