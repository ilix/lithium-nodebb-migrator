# lithium-nodebb-migrator
A program for migrating data from a Lithium community to NodeBB

## running

1. start nodebb + mongo
2. ensure nodebb-plugin-write-api is installed
3. run init script to enable the plugin and set whatever API_TOKEN you have in .env (see config section below)
4. run desired import scripts

```
node index.js init
# restart nodebb

node index.js jsonUsers
node index.js nodes
```

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

API_HOST=nodebb.local
API_TOKEN=27bc47fa-1ad6-4f8a-a41c-5ae0984abf45
```

## misc

mysql docs: https://www.npmjs.com/package/mysql
