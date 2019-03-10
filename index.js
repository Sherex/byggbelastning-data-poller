// Import env from .env
require('dotenv').config()
const axios = require("axios");
const fs = require('fs')



let basic = Buffer.from(process.env.USERNAME + ":" + process.env.PASSWORD, "utf-8").toString("base64");

let api = "https://***REMOVED***/webacs/api/v3/data/";
let resource = "Clients.json?";
let query = [
  ".firstResult=0",
  ".maxResults=20",
  "vlanId=in(208,%20104)",
  "securityPolicyStatus=%22PASSED%22"
].join("&");

let headers = {
  headers: {
    Authorization: "Basic " + basic
  }
};

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