# lithium-nodebb-migrator
A program for migrating data from a Lithium community to NodeBB

## config

You will need to configure this either by setting environment variables, or by having a .env file in the root dir.

```
LOG_LEVEL=debug

MONGODB=mongodb://localhost:27017/nodebb
ORACLE_USER=my-oracle-user
ORACLE_PASSWORD=i-has-a-sikrit
ORACLE_CLIENT=http://oracle.local:3000

SSO_NAME=my-nodebb
USER_COUNT=10

API_URL=http://nodebb.local/api/v1
```