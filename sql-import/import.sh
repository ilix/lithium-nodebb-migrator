#!/bin/bash

# Wait for the mysql container
echo "Waiting a moment to give mysql time to come online..."
sleep 15

# Create database and set max_allowed_packet
echo "CREATE DATABASE IF NOT EXISTS $MYSQL_DATABASE;" > /init.sql
echo "SET GLOBAL max_allowed_packet=1073741824;" >> /init.sql
mysql --host=lnm-mysql --user=root --password=$MYSQL_ROOT_PASSWORD < /init.sql 

# Run through the scripts
for file in /data/*.sql
do
  echo "Run $file"
  mysql --host=lnm-mysql --user=root --password=$MYSQL_ROOT_PASSWORD --database=$MYSQL_DATABASE < "$file"
done

# All done
echo
echo "Lithium data import complete. Container will stop."
