// For later use

/**
 * Returns a promise with IDs of clients
 * @param  {String} apiUrl URL to the API including path.
 * @param  {Object} headers Headers to include in the request.
 * @param  {String} headers.Authorization A basic auth string.
 * @return {Promise<array>} Client IDs.
 */
async function getClientIds (apiUrl, headers) {
  return new Promise(async function (resolve, reject) {
    let resource = 'data/Clients.json?'
    let query = [
      '.firstResult=0',
      '.maxResults=20',
      'vlanId=in(208, 104)',
      'securityPolicyStatus="PASSED"'
    ].join('&')

    // axios.get(apiUrl + resource + query, headers)
    dummyData('./sample-data/user-list.json')
      .then(response => {
        let userList = response.data.queryResponse.entityId
        resolve(userList.map(user => user.$))
      })
      .catch(err => {
        reject(err)
      })
  })
}

/**
 * Returns a promise with client infomation.
 * @param  {String} apiUrl URL to the API including path.
 * @param  {Object} headers Headers to include in the request.
 * @param  {String} headers.Authorization A basic auth string.
 * @param  {String} clientId
 * @return {Promise<array>} Client IDs.
 */
async function getClientById (apiUrl, headers, clientId) {
  return new Promise(async function (resolve, reject) {
    let resource = 'data/Clients/' + clientId + '.json?'

    let userList = {}

    axios.get(apiUrl + resource, headers)
    //dummyData('./sample-data/clients/' + clientId + '.json')
      .then(response => {
        resolve(response.data.queryResponse.entity[0].clientsDTO)
      })
      .catch(err => {
        reject(err)
      })
  })
}