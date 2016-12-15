#!/bin/bash

mkdir tmp
echo "[]" > tmp/userMapping.json

echo
echo "1) Re-create nodebb containers"

cd ../nodebb-docker
git checkout develop
docker-compose down
docker-compose up -d
cd ../lithium-nodebb-migrator

echo "   > Wait for nodebb to come online..."
sleep 20

echo
echo "2) Enable nodebb-plugin-write-api"
node index.js init

echo "   > Restart nodebb"
cd ../nodebb-docker
docker-compose stop
docker-compose up -d
cd ../lithium-nodebb-migrator

echo "   > Wait for nodebb to come online..."
sleep 20

echo
echo "3) Clean out old categories"
node index.js clean

echo
echo "4) Import new categories (lithium: node)"
node index.js initCategories
node index.js nodes

echo
echo "5) Import users"
node index.js jsonUsers

echo
echo "6) Import topics (lithium: message2)"
node index.js topics

echo
echo "7) Import topic replies (lithium: message2)"
node index.js replies
