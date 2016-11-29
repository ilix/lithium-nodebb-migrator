#!/bin/bash

# Wait for the mysql container
echo "Waiting a moment to give mysql time to come online..."
sleep 20

# Create database and set max_allowed_packet
echo "CREATE DATABASE IF NOT EXISTS $MYSQL_DATABASE DEFAULT CHARACTER SET = 'utf8mb4' DEFAULT COLLATE 'utf8mb4_swedish_ci';" > /init.sql
echo "SET GLOBAL max_allowed_packet=1073741824;" >> /init.sql
mysql --host=lnm-mysql --user=root --password=$MYSQL_ROOT_PASSWORD --default-character-set=utf8mb4 < /init.sql 

# Run through the scripts
for file in /data/*.sql
do
  echo "Run $file"
  mysql --host=lnm-mysql --user=root --password=$MYSQL_ROOT_PASSWORD --default-character-set=utf8mb4 --database=$MYSQL_DATABASE < "$file"
done

# All done
echo
echo "Lithium data import complete. Container will stop."
