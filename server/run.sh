#!/bin/bash
NEW=""
OLD=`stat -t run.js`
echo $OLD
while true
do
if [ "$NEW" != "$OLD" ]
then
  echo "Going down..."
  killall -9 node
  echo "Restarting.."
  node ./run.js  2>&1 &
  OLD=$NEW
fi
NEW=`stat -t run.js`
done
