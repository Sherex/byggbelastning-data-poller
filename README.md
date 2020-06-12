# Cisco-prime-client-info
Azure function app to gather wireless device locations to a DB.

## Development
```js
// Clone the repo and enter it's directory, then:
npm i

// If you have Docker installed you can start a dev DB with:
npm run start-db
// Stop DB
npm run stop-db
// Flush DB
npm run flush-db
```

## API Docs
### Prime
 - {PRIME_URL}/webacs/api/v4/
 - https://www.cisco.com/c/en/us/support/cloud-systems-management/prime-infrastructure/products-programming-reference-guides-list.html

### MSE
 - https://developer.cisco.com/docs/mse-api-documentation/
 - https://www.cisco.com/c/en/us/td/docs/wireless/mse/8-0/MSE_REST_API/Guide/Cisco_MSE_REST_API_Guide.html

### Solarwinds
 - https://github.com/solarwinds/OrionSDK/wiki/REST
 - https://github.com/solarwinds/OrionSDK/releases/latest