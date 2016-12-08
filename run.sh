#!/bin/bash

echo "Re-create nodebb containers"

cd ../nodebb-docker
git checkout develop
docker-compose down
docker-compose up -d
cd ../lithium-nodebb-migrator

echo "Wait for nodebb to come online"
sleep 20

echo "Enable nodebb-plugin-write-api"
node index.js init

echo "Restart nodebb"
cd ../nodebb-docker
docker-compose stop
docker-compose up -d
cd ../lithium-nodebb-migrator

echo "Wait for nodebb to come online"
sleep 20

echo "Clean out old categories"
node index.js clean

echo "Import new categories (lithium: node)"
node index.js initCategories
node index.js nodes

echo "Import users"
node index.js jsonUsers

echo "Import topics (lithium: message2)"
node index.js topics
node index.js replies
