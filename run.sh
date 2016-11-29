#!/bin/bash

echo "Re-create nodebb containers"

cd ../nodebb-docker
docker-compose down
docker-compose up -d
cd ../lithium-nodebb-migrator

echo "Wait for nodebb to come online"
sleep 30

echo "Enable nodebb-plugin-write-api"
node index.js init

echo "Restart nodebb"
cd ../nodebb-docker
docker-compose stop
docker-compose up -d
cd ../lithium-nodebb-migrator

echo "Wait for nodebb to come online"
sleep 30

echo "Clean out old categories"
node index.js clean

echo "Insert new categories"
node index.js initCategories
node index.js nodes
