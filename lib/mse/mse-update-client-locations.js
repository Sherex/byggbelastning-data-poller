const mseClientToLocation = require('./mse-client-to-location')
const dummy = require('../dummy')

const isValidMapHierarchy = string => string.match(/^\w+>\w+>\w+$/) !== null

module.exports = async (axiosInstance, mapHierarchies) => {
  if (mapHierarchies) mapHierarchies = Array.isArray(mapHierarchies) ? mapHierarchies : [mapHierarchies]
  if (mapHierarchies && mapHierarchies.map(isValidMapHierarchy).includes(false)) {
    throw Error('Parameter \'mapHierarchies\' contains an invalid mapHierarchy string!')
  }

  if (!mapHierarchies) {
    // const { data: maps } = await axiosInstance.get('api/contextaware/v1/maps')
    const maps = await dummy.load('./sample-data/mse-data/maps-random.json')
    mapHierarchies = getMapHierarchies(maps)
  }

  console.log(mapHierarchies)

  await Promise.all(mapHierarchies.map(async mapHierarchy => {
    const { data } = await axiosInstance.get(`api/contextaware/v1/location/history/clients?mapHierarchy=${mapHierarchy}`)
    // TODO: Will not work, need schema or dataset to format correctly
    mseClientToLocation.push(data)
  }))
}

function getMapHierarchies (maps) {
  const mapHierarchies = []
  maps.campuses.forEach(campus => {
    if (!campus.buildingList) return
    campus.buildingList.forEach(building => {
      if (!building.floorList) return
      building.floorList.forEach(floor => {
        mapHierarchies.push(`${campus.name}>${building.name}>${floor.name}`)
      })
    })
  })
  return mapHierarchies
}
