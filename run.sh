#!/bin/bash

cd ../nodebb-docker
docker-compose down
docker-compose up -d
cd ../lithium-nodebb-migrator

sleep 30
node index.js init

cd ../nodebb-docker
docker-compose stop
docker-compose up -d
cd ../lithium-nodebb-migrator

sleep 30
node index.js clean
node index.js nodes