# Cisco-prime-client-info
Azure function app to gather wireless device locations to a DB.

## Development
### Cloning
```sh
# Clone the repo and enter it's directory, then:
$ npm i
# Rename dev.env to .env then edit it
$ mv dev.env .env
```
### Docker scripts
```sh
# If you have Docker installed you can start a dev DB with:
$ npm run docker:start
# Stop DB container 
$ npm run docker:stop
# Stop DB container, delete the DB directory, then start the DB container
$ npm run docker:clean_db
```
### Database scripts
```sh
# Creates all tables
$ npm run db:setup
# Drops specified tables, or all if '*' is used
# Prints all available tables if none are specified
$ npm run db:drop_tables -- {table_name} {another_table_name}
# Exports all columns from specified table
# Prints all available tables if none are specified
$ npm run db:export -- {table_name}
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