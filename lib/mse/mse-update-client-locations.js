const { default: axios } = require('axios')
const mseClientToLocation = require('./mse-client-to-location')
const dummy = require('../dummy')
// api/contextaware/v1/maps
// api/contextaware/v1/location/history/clients?mapHierarchy=${mapHierarchy}

const isValidMapHierarchy = string => string.match(/^\w+>\w+>\w+$/) !== null

module.exports = async (apiUrl, headers, mapHierarchies) => {
  if (mapHierarchies) mapHierarchies = Array.isArray(mapHierarchies) ? mapHierarchies : [mapHierarchies]
  if (mapHierarchies && mapHierarchies.map(isValidMapHierarchy).includes(false)) {
    throw Error('Parameter \'mapHierarchies\' contains an invalid mapHierarchy string!')
  }

  if (!mapHierarchies) {
    // const { data: maps } = await axios.get(apiUrl + 'api/contextaware/v1/maps', headers)
    const maps = await dummy.load('./sample-data/mse-data/maps-random.json')
    mapHierarchies = getMapHierarchies(maps)
  }

  console.log(mapHierarchies)

  await Promise.all(mapHierarchies.map(async mapHierarchy => {
    const { data } = await axios.get(`${apiUrl}api/contextaware/v1/location/history/clients?mapHierarchy=${mapHierarchy}`, headers)
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
