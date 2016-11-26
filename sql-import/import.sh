#!/bin/bash

echo "Waiting a moment to give mysql time to come online..."
sleep 15

echo "CREATE DATABASE IF NOT EXISTS lithium;" > /init.sql
echo "SET GLOBAL max_allowed_packet=1073741824;" >> /init.sql
mysql --host=lnm-mysql --user=root --password=meow < /init.sql 

for file in /data/*.sql
do
  echo "Run $file"
  mysql --host=lnm-mysql --user=root --password=meow --database=lithium < "$file"
done

echo "Lithium data import complete. Container will stop."
