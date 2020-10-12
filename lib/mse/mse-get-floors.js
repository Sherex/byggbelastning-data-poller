const { logger } = require('@vtfk/logger')

async function getFloors (mse) {
  try {
    logger('debug', ['mse-get-floors', 'getting floors'])
    const response = await mse.get('api/contextaware/v1/maps.json')
    const { mapFloors, stats } = getMapFloors(response.data)
    logger('debug', ['mse-get-floors', 'successfully got floors', 'locations', stats.locations, 'buildings', stats.buildings, 'floors', stats.floors])
    return mapFloors
  } catch (error) {
    logger('error', ['mse-get-floors', 'failed to get floors', 'error', error.message])
    throw error
  }
}

function getMapFloors (maps) {
  const stats = {
    locations: 0,
    buildings: 0,
    floors: 0
  }
  const mapFloors = []
  maps.Maps.Campus.forEach(location => {
    stats.locations++
    const matchType = /^([A-Z]{1,10}) +/

    let type = location.name.match(matchType)
    if (type !== null) {
      type = type[1]
      location.name = location.name.replace(matchType, '').trim()
    }

    if (!location.Building) return
    location.Building.forEach(building => {
      stats.buildings++
      if (!building.Floor) return
      building.Floor.forEach(floor => {
        stats.floors++
        mapFloors.push({
          location: location.name,
          locationType: type,
          building: building.name,
          floor: floor.name,
          mseFloorId: floor.floorRefId,
          imageLength: floor.Dimension.length,
          imageWidth: floor.Dimension.width,
          imageOffsetX: floor.Dimension.offsetX,
          imageOffsetY: floor.Dimension.offsetY
        })
      })
    })
  })
  return {
    mapFloors,
    stats
  }
}

module.exports = {
  getFloors
}
