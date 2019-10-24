/**
 * ble-iot-gateway on nodejs
 * experimental and partial implementation of web api interace
 * based on GAP/GATT REST api design proposed by Bluetooth SIG white papers
 * Author: abun, kobucom
 * License: GPL
 * 
 *  Copyright (C) 2019  Kobu.Com
 *
 *  This program is free software; you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation; either version 2 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 */

// 2019-sep-23 experiment with http and url package
// 2019-sep-23 scratch with express routing
// 2019-sep-24 gap/gatt api skeltons 
// 2019-sep-29 api skelton tested 
// 2019-oct-04 replaceable ble-side code: ble-impl.js
// 2019-oct-04 api test code written and tested
// 2019-oct-05 noble version (windows) started
// 2019-oct-09 done

// express routing
const express = require('express')
const app = express()
const port = 3000

// url handling
const url = require('url');

// inclulde api implementation code
// function naming convension: METHOD gap/gatt Verb...
// example: getGapNodes(), getGattNodes(), putGattNodeCharacteristic()
const api = require('./api-impl')
api.init();

// call api-impl side functions
function handle(req, res, func) {
  let reqUrl = url.parse(req.url, true);
  console.log("REQ: " + req.method + " " + reqUrl.pathname + " : " + JSON.stringify(req.params) + " ? " + JSON.stringify(reqUrl.query));
  func(req.params, reqUrl.query, function(json) {
    // res.contentType('application/json');
    res.json(json);
    console.log("RES: " + JSON.stringify(json));
  })
}

// GAP REST API
// https://www.bluetooth.com/bluetooth-resources/gap-rest-api-white-paper/
// GAP-REST-API_WP_V10r01-1.pdf
//
// 2.3.2 Nodes
// Requests (discover nodes and list enabled nodes):
// GET http://<gateway>/gap/nodes?passive=1
// The gateway will perform passive scan for nodes. Used scan parameters are decided by the
// gateway.
//
// GET http://<gateway>/gap/nodes?active=1
// The gateway will perform active scan for nodes. Used scan parameters are decided by the
// gateway.
//
// GET http://<gateway>/gap/nodes?enable=1
// The gateway will return a list of enabled devices (devices that are either connected or will be
// connected when available and at gateway power-up).
//
// Response (as described in the white paper)
// {
//   "nodes" : [ 
//       { 
//     "self" : { "href" = "http://<gateway>/gap/nodes/<node1>" }, 
//     "handle" :  "<node1>",  //Handle for the device  
//     "bdaddr" : "<bdaddr1>", //Bluetooth address of the node 
//     "AD"     : [ 
//               { 
//                   "ADType " : <type1>,   // See reference [1] 
//                   "ADValue" : "<value1>" // Value as HEX string 
//               }, 
//               { 
//         "ADType" : <type2>, 
//                   "ADValue" : "<value2>"  
//               },
//       { 
//                   … 
//               }
//     ] 
//       }, 
//       { 
//           "self"   : { "href" = "http://<gateway>/gap/nodes/<node2>" }, 
//           "handle" : "<node2>", 
//           "bdaddr" : "<bdaddr2>" 
//           "AD"     : [ … ] 
//       }, 
//       { 
//     … 
//       } 
//   ] 
// }
//
// This experimental implementation does not follow response formats
// described in the white paper. More simple formats used instead.
//
app.get('/gap/nodes', (req, res) => {
  handle(req, res, api.getGapNodes);
})

// (page 6)
// GET http://<gateway>/gap/nodes/<node>
// The gateway will return data for an enabled node identified by the handle <node>.
//
// Requests (name discovery)
// (page 8)
// GET http://<gateway>/gap/nodes/<node>?name=1
// Perform a name discovery of the node identified by handle <node>.
app.get('/gap/nodes/:node', (req, res) => {
  handle(req, res, api.getGapNode);
})

// Requests (enabling and disabling of nodes)
// PUT http://<gateway>/gap/nodes/<node>?connect=1(&interval=<interval>&latency=<latency>&enable=1)
// Enable and connect to the node identified by <node>. The gateway will try to use the connection
// interval <interval> and the connection latency <latency>. If left out, default values will be used.
// The gateway will try to reconnect to the device if the connection is lost or at gateway power-up.
// PUT http://<gateway>/gap/nodes/<node>?enable=0
// Remove the node <node> from the list of enabled nodes.
app.put('/gap/nodes/:node', (req, res) => {
  handle(req, res, api.putGapNode);
})

// GATT REST API
// https://www.bluetooth.com/bluetooth-resources/gatt-rest-api/
// GATT-REST-API_WP_V10r01.pdf
//
// 2.3.2 Nodes
// Requests:
// GET http://<gateway>/gatt/nodes
// Available nodes
app.get('/gatt/nodes', (req, res) => {
  handle(req, res, api.getGattNodes);
})

// GET http://<gateway>/gatt/nodes/<node>
// Read data for a specific node identified by the handle <node>
app.get('/gatt/nodes/:node', (req, res) => {
  handle(req, res, api.getGattNode);
})

// 2.3.3 Services
// Requests:
// GET http://<gateway>/gatt/nodes/<node>/services
// Discover all services in the node identified by <node>.
// GET http://<gateway>/gatt/nodes/<node>/services?primary=1
// Discover all primary services in the node identified by <node>.
// GET http://<gateway>/gatt/nodes/<node>/services?primary=1&uuid=<uuid>
// Discover primary services by UUID in the node identified by <node>.
app.get('/gatt/nodes/:node/services', (req, res) => {
  handle(req, res, api.getGattNodeServices);
})

// GET http://<gateway>/gatt/nodes/<node>/services/<service>
// Read data for a service in the node <node> identified by the handle <service> (discovered by
// one of the methods/URIs defined earlier in this section).
app.get('/gatt/nodes/:node/services/:service', (req, res) => {
  handle(req, res, api.getGattNodeService);
})

// 2.3.4 Characteristics
// Requests (discovery):
// GET http://<gateway>/gatt/nodes/<node>/services/<service>/characteristics
// Discover all characteristics of the service <service> in the node identified by <node>.
app.get('/gatt/nodes/:node/services/:service/characteristics', (req, res) => {
  handle(req, res, api.getGattNodeServiceCharacteristics);
})

// GET http://<gateway>/gatt/nodes/<node>/characteristics?uuid=<uuid>
// Discover characteristics by UUID in the node identified by <node>.
app.get('/gatt/nodes/:node/characteristics', (req, res) => {
  handle(req, res, api.getGattNodeCharacteristics);
})

// GET http://<gateway>/gatt/nodes/<node>/characteristics/<characteristic>
// Get data for the characteristic identified by <characteristics> in the node identified <node>
// (discovered by one of the methods/URIs defined earlier in this section). 
app.get('/gatt/nodes/:node/characteristics/:characteristic', (req, res) => {
  handle(req, res, api.getGattNodeCharacteristic);
})

// Requests (enabling and disabling of Indications and Notifications)
// PUT http://<gateway>/gatt/nodes/<node>/characteristics/<characteristic>?indicate=1
// Enable indication for the characteristic <characteristic> in the node identified by <node>.
// PUT http://<gateway>/gatt/nodes/<node>/characteristics/<characteristic>?indicate=0
// Disable indication for the characteristic <characteristic> in the node identified by <node>.
// PUT http://<gateway>/gatt/nodes/<node>/characteristics/<characteristic>?notify=1
// Enable notification for the characteristic <characteristic> in the node identified by <node>.
// PUT http://<gateway>/gatt/nodes/<node>/characteristics/<characteristic>?notify=0
// Disable notification for the characteristic <characteristic> in the node identified by <node>.
app.put('/gatt/nodes/:node/characteristics/:characteristic', (req, res) => {
  handle(req, res, api.putGattNodeCharacteristic);
})

// 2.3.5 Characteristic Value
// Requests (reading of characteristic values):
// (1) GET http://<gateway>/gatt/nodes/<node>/characteristics/<characteristic>/value
// Read the value of the characteristic <characteristic> in the node identified by <node>.
// (2) GET http://<gateway>/gatt/nodes/<node>/characteristics/value?uuid=<uuid>&start=<handle>&end=<handle>
// Read the value of a characteristic by UUID. First found is returned.
// (3) GET http://<gateway>/gatt/nodes/<node>/characteristics/<characteristic>/value?long=1
// Read the long value of the characteristic <characteristic> in the node identified by <node>.
// Requests (reading of multiple characteristic values):
// (4) GET http://<gateway>/gatt/nodes/<node>/characteristics/value?multiple=1
// Read the value of multiple characteristics identified by the handles in the body in the node
// identified by <node>.
//
// Requests (reading of cached indicated or notified value):
// (5) GET http://<gateway>/gatt/nodes/<node>/characteristics/<characteristic>/value?indicate=1
// Read the latest cached indicated value of the characteristic <characteristic> in the node
// identified by <node>. Only valid if the characteristic has indication enabled.
// (6) GET http://<gateway>/gatt/nodes/<node>/characteristics/<characteristic>/value?notify=1
// Read the latest cached notified value of the characteristic <characteristic> in the node identified
// by <node>. Only valid if the characteristic has notification enabled.
//
// Use Server Side Events to subscribe to indications or notifications
// URI for the Server Side Events:
// (7) GET http://<gateway>/gatt/nodes/<node>/characteristics/<characteristic>/value?indicate=1&event=1
//                                                                             ------------------------  
//                                                                             event?indicate=1
// This URI is used to trigger a subscription of indicated values for the characteristic
// <characteristic> in the node identified by <node>. Only valid if the characteristic has indication
// enabled.
// (8) GET http://<gateway>/gatt/nodes/<node>/characteristics/<characteristic>/value?notify=1&event=1
//                                                                             ----------------------  
//                                                                             event?[notify=1]
// This URI is used to trigger a subscription of notified values for the characteristic <characteristic>
// in the node identified by <node>. Only valid if the characteristic has notification enabled.
//
// [Discrepancy to white paper] For (7) and (8) SSE session, different URL is used ('value' changed to 'event')
// in order to use a separate app.get() for easy handling. Also, indicate/notify query string is optional.
// It is just a hint even if exists. See ble-impl's setupEventStream() for detail.

app.get('/gatt/nodes/:node/characteristics/:characteristic/value', (req, res) => { // (1), (3), (5), (6)
  handle(req, res, api.getGattNodeCharacteristicValue);
})

app.get('/gatt/nodes/:node/characteristics/value', (req, res) => { // (2) and (4)
  handle(req, res, api.getGattNodeCharacteristicsValue);
})

app.get('/gatt/nodes/:node/characteristics/:characteristic/event', (req, res) => { // (7) and (8)
  // Simple Way to Implement Server Sent Events in Node.js?
  // https://stackoverflow.com/questions/36249684/simple-way-to-implement-server-sent-events-in-node-js
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });
  let reqUrl = url.parse(req.url, true);
  api.setupEventStream(req.params, reqUrl.query, function (err, data) {
    if (err) res.end("data: " + err.toString() + "\n\n"); // show error and close
    else if (!data) res.end(); // no data means end of stream
    else res.write("data: " + JSON.stringify(data) + "\n\n"); // 'data' is string but use stringify() for safety
  });
})

// Requests (writing of characteristic values):
// (1) PUT http://<gateway>/gatt/nodes/<node>/characteristics/<characteristic>/value/<value>
// Write of the value <value> to the characteristic <characteristic> in the node identified by
// <node>.
// (2) PUT http://<gateway>/gatt/nodes/<node>/characteristics/<characteristic>/value/<value>?long=1
// Write of the long value <value> to the characteristic <characteristic> in the node identified by
// <node>.
// (3) PUT http://<gateway>/gatt/nodes/<node>/characteristics/<characteristic>/value/<value>?noresponse=1
// A write without response of the value <value> to the characteristic <characteristic> in the node
// identified by <node>.
app.put('/gatt/nodes/:node/characteristics/:characteristic/value/:value', (req, res) => {
  handle(req, res, api.putGattNodeCharacteristicValue);
})

// Requests (reliable writes):
// PUT http://<gateway>/gatt/nodes/<node>/characteristics/value?reliable=1
//  body data: [ { handle: xxx, value: yyy }, ... ]
// Perform a reliable write of the characteristics defined in the body and in the node identified by <node>.
app.put('/gatt/nodes/:node/characteristics/value', (req, res) => {
  handle(req, res, api.putGattNodeCharacteristicsValue);
})

// 2.3.6 Characteristic Descriptors
// Requests (discovery):
// (1) GET http://<gateway>/gatt/nodes/<node>/characteristics/<characteristic>/descriptors
// Discover all descriptors of the characteristic <characteristic> in the node identified by <node>.
// (2) GET http://<gateway>/gatt/nodes/<node>/descriptors/<descriptor>
// Read data for the descriptor identified by the handle <descriptor> (discovered by the
// methods/URIs defined earlier in this section). 

app.get('/gatt/nodes/:node/characteristics/:characteristic/descriptors', (req, res) => { // (1)
  handle(req, res, api.getGattNodeCharacteristicDescriptors);
})

app.get('/gatt/nodes/:node/descriptors/:descriptor', (req, res) => { // (2)
  handle(req, res, api.getGattNodeDescriptor);
})

// 2.3.7 Characteristic Descriptor Value
// Requests (reading of descriptor values):
// GET http://<gateway>/gatt/nodes/<node>/descriptors/<descriptor>/value
// Read the value of the descriptor <descriptor> in the node identified by <node>.
app.get('/gatt/nodes/:node/descriptors/:descriptor/value', (req, res) => {
  handle(req, res, api.getGattNodeDescriptorValue);
})

// Requests (writing of descriptor values):
// PUT http://<gateway>/gatt/nodes/<node>/descriptors/<descriptor>/value/<value>
// Write of the value <value> to the descriptor <descriptor> in the node identified by <node>.
// PUT http://<gateway>/gatt/nodes/<node>/descriptors/<descriptor>/value/<value>?long=1
// Write the long value <value> to the descriptor <descriptor> in the node identified by <node>
app.put('/gatt/nodes/:node/descriptors/:descriptor/value/:value', (req, res) => {
  handle(req, res, api.putNodeDescriptorValue);
})

// start server
app.listen(port, () => console.log(`ble-iot-gwy listening on port ${port}`))
