const { logger } = require('@vtfk/logger')
const mseClientToLocation = require('./mse-client-to-location')
const dummy = require('../dummy')

const isValidMapHierarchy = string => string.match(/^.+>.+>.+$/) !== null

// TODO: Filter out duplicate entries before insert
module.exports = async (mse, mapHierarchies) => {
  if (mapHierarchies) mapHierarchies = Array.isArray(mapHierarchies) ? mapHierarchies : [mapHierarchies]
  if (mapHierarchies && mapHierarchies.map(isValidMapHierarchy).includes(false)) {
    const error = Error('Parameter \'mapHierarchies\' contains an invalid mapHierarchy string!')
    logger('error', ['mse-update-client-locations', 'invalid mapHierarchy string', 'error', error])
    throw error
  }
  if (mapHierarchies) mapHierarchies = mapHierarchies.map(normalizeMapHierarchyString)

  logger('debug', ['mse-update-client-locations', 'getting clients', 'location/history/clients.json'])
  let { data: clients } = await mse.getPagination('location/history/clients.json')
  await dummy.save('mse-location-history', clients)
  // let clients = await dummy.load('mse-location-history')
  if (!(clients && clients.Locations && clients.Locations.entries)) throw Error('Response did not contain entries')

  clients = clients.Locations.entries
  logger('debug', ['mse-update-client-locations', 'got clients', 'amount', clients.length])

  const maps = []
  clients.forEach(client => {
    const mapString = client.MapInfo.mapHierarchyString
    if (!maps.includes(mapString)) maps.push(mapString)
  })
  logger('debug', ['mse-update-client-locations', 'got clients', 'floors amount', maps.length])

  if (mapHierarchies) {
    logger('debug', ['mse-update-client-locations', 'filtered to clients from', mapHierarchies.length, 'maps'])
    const clientsFiltered = clients.filter(client => mapHierarchies.includes(normalizeMapHierarchyString(client.MapInfo.mapHierarchyString)))
    logger('debug', ['mse-update-client-locations', 'filtered from', clients.length, 'to', clientsFiltered.length])
    clients = clientsFiltered
  }

  logger('debug', ['mse-update-client-locations', 'pushing clients to client-parser', clients.length])
  return mseClientToLocation.insertClients(clients)
  // if (!mapHierarchies) {
  //   logger('debug', ['mse-update-client-locations', 'no mapHierachies passed', 'getting all mapHierachies', axiosInstance.defaults.baseURL + 'maps'])
  //   // const { data: maps } = await mse.getPagination('maps.json')
  //   // await dummy.save('mse-maps', maps)
  //   const maps = await dummy.load('mse-maps')
  //   mapHierarchies = getMapHierarchies(maps)
  //   logger('debug', ['mse-update-client-locations', 'getting all mapHierachies', 'total gotten', mapHierarchies.length])
  // }

  // await Promise.all(mapHierarchies.map(async mapHierarchy => {
  //   logger('debug', ['mse-update-client-locations', 'getting clients at', mapHierarchy])

  //   const { data } = await mse.getPagination(`location/history/clients.json?mapHierarchy=${mapHierarchy}`)
  //   await dummy.save('mse-location-history', data)

  //   logger('debug', ['mse-update-client-locations', 'clients at', mapHierarchy, data])
  //   console.log(JSON.stringify(data, null, 2))
  //   // TODO: Will not work, need schema or dataset to format correctly
  //   // mseClientToLocation.push(data)
  // }))
}

function normalizeMapHierarchyString (string) {
  return string.split('>').map(s => s.trim()).join(' > ')
}
