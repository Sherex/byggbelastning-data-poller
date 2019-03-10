// Import env from .env
require('dotenv').config()
const axios = require("axios");
const fs = require('fs')



let basicAuth = Buffer.from(process.env.USERNAME + ":" + process.env.PASSWORD, "utf-8").toString("base64");

let apiUrl = "https://***REMOVED***/webacs/api/v3/data/";

let headers = {
  headers: {
    Authorization: "Basic " + basicAuth
  }
};

function getClientIds(apiUrl, headers) {
  return new Promise(async function(fulfill, reject) {
    let resource = "Clients.json?"
    let query = [
      ".firstResult=0",
      ".maxResults=20",
      "vlanId=in(208,%20104)",
      "securityPolicyStatus=%22PASSED%22"
    ].join("&");

    axios.get(apiUrl + resource + query, headers)
    .then(response => {
      let userList = response.data.queryResponse.entityId
      fulfill(userList.map(user => user.$))
    })
    .catch(err => {
      reject(err)
    })
  })
}

function getClientById(apiUrl, clientId) {
  return new Promise(async function(fulfill, reject) {
    let resource = "Clients/" + clientId + ".json?"

    axios.get(apiUrl + resource, headers)
    .then(response => {
      let userList = response.data.queryResponse.entityId
      fulfill(userList.map(user => user.$))
    })
    .catch(err => {
      reject(err)
    })

  })
}






async function getUsers(fullQuery, headers) {
  return new Promise(async function(fulfill, reject) {
    let userList = await Promise.resolve(
      axios.get(fullQuery, headers)
    ).catch(err => {
      reject(err)
    });


    fs.writeFile("./sample-data/user-list.json", JSON.stringify(userList.data.queryResponse), (err => {reject(err)}))
    let requests = []

    userList = userList.data.queryResponse.entityId


    userList.forEach(await async function (user) {
      let userUrl = user['@url']
      await axios.get(userUrl, headers)
      .then(userInfo => {
        userInfo = userInfo.data.queryResponse
        fs.writeFile("./sample-data/clients/" + user.$ + ".json", JSON.stringify(userInfo), (err => {reject(err)}))
        console.log(user.$)
      })
      .catch(err => {reject(err)});
    });
    fulfill(true)

  });
}

getUsers(api + resource + query, headers)
.then(users => {console.log(users)})
.catch(err => {console.error(err)})