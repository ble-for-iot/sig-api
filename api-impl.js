/**
 * api-impl.js - platform-free, framework-free api entry points
 *   that call a specific ble access implementation.
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

 // 19-oct-04 generic skelton written, tested

// reference to ble access implemetation
// parameters to ble-impl are: node address, service uuid, characteristic uuid
var ble = require('./ble-impl-noble');

// initialize this and ble-impl code
module.exports.init = function() {
    ble.init();
}

///// GAP /////

// GET http://<gateway>/gap/nodes?[passive=1/active=1/enable=1]
// params = not used
module.exports.getGapNodes = function(params, query, cb) {
    setImmediate( () => {
        cb("getGapNodes: not implemented");
    });
}

// GET http://<gateway>/gap/nodes/<node>?[name=1]
module.exports.getGapNode = function(params, query, cb) {
    setImmediate( () => {
        cb("getGapNode: not implemented");
    });
}

// PUT http://<gateway>/gap/nodes/<node>?[...]
module.exports.putGapNode = function(params, query, cb) {
    setImmediate( () => {
        cb("putGapNode: not implemented");
    });
}

///// GATT /////

// supported - get a list of devices (all or only connectable)
// GET http://<gateway>/gatt/nodes
// no params, no query
// discrepancy to white paper: support enable=1 (means connectable) as in /gap/nodes
module.exports.getGattNodes = function(params, query, cb) {
    console.log("getGattNodes: enable = " + query.enable);
    let connectable = query.enable === "1";
    setImmediate( () => {
        cb(ble.getNodes(connectable));
    });
}

// supported - get info about a specific device
// GET http://<gateway>/gatt/nodes/<node>
// no query string
module.exports.getGattNode = function(params, query, cb) {
    let address = params.node;
    console.log("getGattNode: node = " + address);
    setImmediate( () => {
        cb(ble.getNode(address));
    });
}

// supported - get a list of services in a device
// GET http://<gateway>/gatt/nodes/<node>/services?[primary=1/uuid=...]
// discrepancy to white paper: ignore query parameters: assume always 'primary=1' and returns all uuids
module.exports.getGattNodeServices = function(params, query, cb) {
    let address = params.node;
    console.log("getGattNodeServices: node = " + address);
    setImmediate( () => {
        cb(ble.getServices(address));
    });
}

// GET http://<gateway>/gatt/nodes/<node>/services/<service>
module.exports.getGattNodeService = function(params, query, cb) {
    setImmediate( () => {
        cb("getGattNodeService: not implemented");
    });
}

// supported - get list of characteristics in a service
// GET http://<gateway>/gatt/nodes/<node>/services/<service>/characteristics
// no query string
module.exports.getGattNodeServiceCharacteristics = function(params, query, cb) {
    let address = params.node;
    let serviceUuid = params.service;
    console.log("getGattNodeServiceCharacteristics: service = " + serviceUuid);
    setImmediate( () => {
        cb(ble.getCharacteristics(address, serviceUuid));
    });
}

// GET http://<gateway>/gatt/nodes/<node>/characteristics?uuid=<uuid>
module.exports.getGattNodeCharacteristics = function(params, query, cb) {
    setImmediate( () => {
        cb("getGattNodeCharacteristics: not implemented");
    });
}

// GET http://<gateway>/gatt/nodes/<node>/characteristics/<characteristic>
module.exports.getGattNodeCharacteristic = function(params, query, cb) {
    setImmediate( () => {
        cb("getGattNodeCharacteristic: not implemented");
    });
}

// PUT http://<gateway>/gatt/nodes/<node>/characteristics/<characteristic>?[indicate=[10]/notify=[10]]
module.exports.putGattNodeCharacteristic = function(params, query, cb) {
    setImmediate( () => {
        cb("putGattNodeCharacteristic: not implemented");
    });
}

// supported - get value of a characteristic (1)
// GET http://<gateway>/gatt/nodes/<node>/characteristics/<characteristic>/value
// X (1) no query string (read)
//   (3) uuid=<uuid>&start=<handle>&end=<handle> (multiple handles)
//   (5) indicate=1 (cached value)
//   (6) notify=1 (cached vale)
// discrepancy to white paper: query strings are all ignored, assume always (1) case
module.exports.getGattNodeCharacteristicValue = function(params, query, cb) {
    let address = params.node;
    let charaUuid = params.characteristic;
    console.log("getGattNodeCharacteristicValue: chara = " + charaUuid);
    setImmediate( () => {
        ble.readCharacteristic(address, charaUuid, cb);
    });
}

// GET http://<gateway>/gatt/nodes/<node>/characteristics/value?[...]
// (2) uuid=<uuid>&start=<handle>&end=<handle>
// (4) multiple=1
// Note: only difference to above is 's' in 'Characteristics'
module.exports.getGattNodeCharacteristicsValue = function(params, query, cb) {
    setImmediate( () => {
        cb("getGattNodeCharacteristicsValue: not implemented");
    });
}

// supported - subscribe to indication (7) or notification (8)
// GET http://<gateway>/gatt/nodes/<node>/characteristics/<characteristic>/value
// X (7) indicate=1&event=1 (sse)
// X (8) notify=1&event=1 (sse)
// [discrepancy to white paper]
//  URL changed to:
//   GET http://<gateway>/gatt/nodes/<node>/characteristics/<characteristic>/event (last word changed from 'value')
//   (7) indicate=1 (sse)
//   (8) [notify=1] (sse)
//  - with the changed last url part 'event', 'event=1' query string is no use any more and ignored
//  - provide event stream for indication if 'indicate=1' (7) or notification (8) otherwise
//  - CCCD is handled automatically by this side, extra PUT descriptor api not necessary of user side
//  * With noble, 'indicate/notify' is ignored; noble api does not provide such selection probably because
//    noble automatically selects an available one (I haven't checked it).
module.exports.setupEventStream = function (params, query, cb) {
    let address = params.node;
    let charaUuid = params.characteristic;
    let isIndication = query.indicate === "1";
    console.log("setupEventStream: " + address + ", chara = " + charaUuid + ", ind = " + isIndication);
    setImmediate( () => {
        ble.subscribe(address, charaUuid, cb);
    });
}

// supported - write inline data (not body data) to a characteristic - (1) and (2) are supported
// PUT http://<gateway>/gatt/nodes/<node>/characteristics/<characteristic>/value/<value>?[...]
// X (1) no query string
// X (2) noresponse=1
//   (3) long=1
module.exports.putGattNodeCharacteristicValue = function(params, query, cb) {
    let address = params.node;
    let charaUuid = params.characteristic;
    let value = params.value;
    let noAck = query.noresponse === "1";
    console.log("putGattNodeCharacteristicValue: " + charaUuid + " <= " + value + ", ack = " + !noAck);
    setImmediate( () => {
        ble.writeCharacteristic(address, charaUuid, value, noAck, cb);
    });
}

// PUT http://<gateway>/gatt/nodes/<node>/characteristics/value?reliable=1 <<< array of handle/value pairs 
module.exports.putGattNodeCharacteristicsValue = function(params, query, cb) {
    setImmediate( () => {
        cb("putGattNodeCharacteristicsValue: not implemented");
    });
}

// GET http://<gateway>/gatt/nodes/<node>/characteristics/<characteristic>/descriptors
module.exports.getGattNodeCharacteristicDescriptors = function(params, query, cb) {
    setImmediate( () => {
        cb("getGattNodeCharacteristicDescriptors: not implemented");
    });
}

// GET http://<gateway>/gatt/nodes/<node>/descriptors/<descriptor> <-- is this right ???
module.exports.getGattNodeDescriptor = function(params, query, cb) {
    setImmediate( () => {
        cb("getGattNodeDescriptor: not implemented");
    });
}

// GET http://<gateway>/gatt/nodes/<node>/descriptors/<descriptor>/value
module.exports.getGattNodeDescriptorValue = function(params, query, cb) {
    setImmediate( () => {
        cb("getGattNodeDescriptorValue: not implemented");
    });
}

// PUT http://<gateway>/gatt/nodes/<node>/descriptors/<descriptor>/value/<value>?[...]
module.exports.putNodeDescriptorValue = function(params, query, cb) {
    setImmediate( () => {
        cb("putNodeDescriptorValue: not implemented");
    });
}
