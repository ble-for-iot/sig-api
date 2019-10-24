#!/bin/bash
# ble-iot-gwy api test
# first tested 19-sep-29
# this test script created 19-oct-04
SERVER=big:3000
curl -s http://$SERVER/gap/nodes?passive=1
curl -s http://$SERVER/gap/nodes?active=1
curl -s http://$SERVER/gap/nodes?enable=1
curl -s http://$SERVER/gap/nodes/n1
curl -s http://$SERVER/gap/nodes/n1?name=1
curl -s -T - http://$SERVER/gap/nodes/n1?connect=1&interval=iiii&latency=llll&enable=1 <<< "data"
curl -s -T - http://$SERVER/gap/nodes/n1?enable=0 <<< "data"
curl -s http://$SERVER/gatt/nodes
curl -s http://$SERVER/gatt/nodes/n1
curl -s http://$SERVER/gatt/nodes/n1/services
curl -s http://$SERVER/gatt/nodes/n1/services?primary=1
curl -s http://$SERVER/gatt/nodes/n1/services?primary=1&uuid=uuuu
curl -s http://$SERVER/gatt/nodes/n1/services/s1
curl -s http://$SERVER/gatt/nodes/n1/services/s1/characteristics
curl -s http://$SERVER/gatt/nodes/n1/characteristics?uuid=uuuu
curl -s http://$SERVER/gatt/nodes/n1/characteristics/c1
curl -s -T - http://$SERVER/gatt/nodes/n1/characteristics/c1?indicate=1 <<< "data"
curl -s -T - http://$SERVER/gatt/nodes/n1/characteristics/c1?indicate=0 <<< "data"
curl -s -T - http://$SERVER/gatt/nodes/n1/characteristics/c1?notify=1 <<< "data"
curl -s -T - http://$SERVER/gatt/nodes/n1/characteristics/c1?notify=0 <<< "data"
curl -s http://$SERVER/gatt/nodes/n1/characteristics/c1/value
curl -s http://$SERVER/gatt/nodes/n1/characteristics/value?uuid=uuuu&start=h1&end=h2
curl -s http://$SERVER/gatt/nodes/n1/characteristics/c1/value?long=1
curl -s http://$SERVER/gatt/nodes/n1/characteristics/value?multiple=1
curl -s http://$SERVER/gatt/nodes/n1/characteristics/c1/value?indicate=1
curl -s http://$SERVER/gatt/nodes/n1/characteristics/c1/value?notify=1
curl -s http://$SERVER/gatt/nodes/n1/characteristics/c1/value?indicate=1&event=1
curl -s http://$SERVER/gatt/nodes/n1/characteristics/c1/value?notify=1&event=1
curl -s -T - http://$SERVER/gatt/nodes/n1/characteristics/c1/value/v1 <<< "data"
curl -s -T - http://$SERVER/gatt/nodes/n1/characteristics/c1/value/v1?long=1 <<< "data"
curl -s -T - http://$SERVER/gatt/nodes/n1/characteristics/c1/value/v1?noresponse=1 <<< "data"
curl -s -T - http://$SERVER/gatt/nodes/n1/characteristics/value?reliable=1 <<< "data"
curl -s http://$SERVER/gatt/nodes/n1/characteristics/c1/descriptors
curl -s http://$SERVER/gatt/nodes/n1/descriptors/d1
curl -s http://$SERVER/gatt/nodes/n1/descriptors/d1/value
curl -s -T - http://$SERVER/gatt/nodes/n1/descriptors/d1/value/v1 <<< "data"
curl -s -T - http://$SERVER/gatt/nodes/n1/descriptors/d1/value/v1?long=1 <<< "data"
