const { logger } = require('@vtfk/logger')
const pLimit = require('p-limit')
const db = require('../db/timescaledb-interaction')
const dummy = require('../dummy')

module.exports = async (mse, mapHierarchies) => {
  if (mapHierarchies) mapHierarchies = Array.isArray(mapHierarchies) ? mapHierarchies : [mapHierarchies]
  if (mapHierarchies && mapHierarchies.map(isValidMapHierarchy).includes(false)) {
    const error = Error('Parameter \'mapHierarchies\' contains an invalid mapHierarchy string!')
    logger('error', ['mse-update-client-locations', 'invalid mapHierarchy string', 'error', error])
    throw error
  }
  if (mapHierarchies) mapHierarchies = mapHierarchies.map(normalizeMapHierarchyString)

  if (!mapHierarchies) {
    logger('debug', ['mse-update-locations', 'no mapHierachies passed', 'getting all mapHierachies'])

    // DEBUG: Save this report for offline use
    let maps
    if (process.env.DUMMY_MSE_UPDATE_LOCATIONS) {
      maps = await dummy.load('mse-maps')
    } else {
      const response = await mse.get('api/contextaware/v1/maps.json')
      maps = response.data
      await dummy.save('mse-maps', response.data)
    }
    // DEBUG END

    mapFloors = getMapFloors(maps)
    logger('debug', ['mse-update-locations', 'getting all mapHierachies', 'total maps', mapFloors.length])
  }
  const getMapImagesFunctions = mapFloors.map(map => async () => {
    logger('debug', ['mse-update-locations', 'getting image for location', map.mapHierarchyString])
    const [campus, building, floor] = map.mapHierarchyString.split(' > ')
    let imageBase64 = ''
    try {
      const { data: mapImage } = await mse.get(`api/contextaware/v1/maps/image/${campus}/${building}/${floor}`, { responseType: 'arraybuffer' })
      imageBase64 = mapImage.toString('base64')
    } catch (error) {
      logger('error', ['mse-update-locations', 'couldn\'t get image for location', map.mapHierarchyString, 'error', error.message])
    }
    return {
      ...map,
      campus,
      building,
      floor,
      imageBase64
    }
  })

  const limit = pLimit(3)
  const locationData = await Promise.all(getMapImagesFunctions.map(limit))

  logger('info', ['mse-update-locations', 'inserting location data to DB', 'total locations', locationData.length])
  await db.insertLocationMaps(locationData)
  logger('info', ['mse-update-locations', 'locations inserted'])
  return locationData
}

function getMapFloors (maps) {
  const mapFloors = []
  maps.Maps.Campus.forEach(campus => {
    if (!campus.Building) return
    campus.Building.forEach(building => {
      if (!building.Floor) return
      building.Floor.forEach(floor => {
        mapFloors.push({
          mapHierarchyString: `${campus.name} > ${building.name} > ${floor.name}`,
          imageLength: floor.Dimension.length,
          imageWidth: floor.Dimension.width,
          imageOffsetX: floor.Dimension.offsetX,
          imageOffsetY: floor.Dimension.offsetY
        })
      })
    })
  })
  return mapFloors
}

const isValidMapHierarchy = string => string.match(/^.+>.+>.+$/) !== null

function normalizeMapHierarchyString (string) {
  return string.split('>').map(s => s.trim()).join(' > ')
}
