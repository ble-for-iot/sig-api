#!/bin/bash
# ble-iot-gwy api test
# 19-sep-29 first skelton test manually on raspi
# 19-oct-04 test script created and skelton test done on raspi
# 19-oct-06 reduced to only supported apis
# 19-oct-08 tested noble version on windows
# 19-oct-09 sse tested too

#SERVER=big:3000
SERVER=localhost:3000
ADDR=c0:ab:2a:6a:1a:89
S_UUID=180f
C_UUID=2a19

# list of nodes, services and characteristics
#curl -s http://$SERVER/gatt/nodes
#curl -s http://$SERVER/gatt/nodes/$ADDR
#curl -s http://$SERVER/gatt/nodes/$ADDR/services
#curl -s http://$SERVER/gatt/nodes/$ADDR/services/$S_UUID/characteristics

# read characteristic
#curl -s http://$SERVER/gatt/nodes/$ADDR/characteristics/$C_UUID/value

# write  characteristic (query string version)
#curl -s -T - http://$SERVER/gatt/nodes/$ADDR/characteristics/$C_UUID/value/0300 <<< "dummy"
#curl -s -T - http://$SERVER/gatt/nodes/$ADDR/characteristics/$C_UUID/value/0300?noresponse=1 <<< "dummy"

# notify/indicate by server-sent events
curl -s http://$SERVER/gatt/nodes/$ADDR/characteristics/$C_UUID/event
#curl -s http://$SERVER/gatt/nodes/$ADDR/characteristics/$C_UUID/event?indicate=1
