/**
 * ble-impl-noble.js - ble access implementation based on noble
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
 // 19-oct-05 noble version started on windows with csr dongle
 // 19-oct-05 scan device, service and characteristics; characteristic read/write ok
 // 19-oct-08 connection cache, disconnector, tested with test-revised.sh
 // 19-oct-09 event stream written, tested

 // published functions:
// module.exports.init = function() { ... }
// module.exports.readCharacteristic = function(address, charaUuid, cb) { ... }
// module.exports.writeCharacteristic = function(address, charaUuid, value, noAck, cb) { ... }
// module.exports.subscribe = function(address, charaUuid, cb) { ... }
// module.exports.getNodes = function(connectable) { ... }
// module.exports.getNode = function(address) { ... }
// module.exports.getServices = function (address) { ... }
// module.exports.getCharacteristics = function(address, serviceUuid) { ... }
    
// reference to noble module
var noble = require('noble');

// configuration - TODO: part of whole program?
// WEB_*     - index.js
// API_*     - api-impl.js
// BLE_*     - ble-impl general
// BLE_XXX_* - ble-impl-xxx.js specific
var config = {
    BLE_KEEP_INTERVAL: 3 * 60 * 1000,
    BLE_CHECK_INTERVAL: 60 * 1000
}

// list of noble 'peripherals' reported through 'discover' event.
// once entered, never deleted, entry updated if discovered again
// peripheral.address (eg. 'c0:ab:2a:6a:1a:89') is used as a key
// [ peripheral { address: <address>, ...}, ... ] 
var peripherals = [];

// connection cache - list of information about a connected peer
// once entered, never deleted, entry updated if referenced again
// a new entry is created if a connection to the peer is tried
// [ { address: <address>,
//     map: [ { service: <service>, characteristics: [ c1, c2, ... ]}, ... ],
//     timestamp: <timestamp> },
//   { ... }, ...
// ]
// keyed by 'address'. 'map' contains service-characteristics list data.
// 'timestamp' is unix time in milliseconds; represents the last accessed time
// while connected or zero if not connected
// see populateCharacteristics() and disconnector()
var connections = [];

// initialize - must be called before any call to ble-impl
module.exports.init = function() {
    noble.on('stateChange', function(state) {
        console.log("state = " + state);
        if (state === 'poweredOn') {
            console.log('starting scan ...');
            peripherals = []; // clear caches
            connections = [];
            noble.startScanning();
        }
        else if (state === 'poweredOff') {
            console.log('power off');
        }
    });

    noble.on('discover', function(peripheral) {
        console.log("discover: addr: " + peripheral.address + ', id: ' + peripheral.id);
        let index = peripherals.findIndex(p => p.address === peripheral.address);
        if (index === -1) {
            console.log(" add: " + peripheral.address);
            peripherals.push(peripheral);
            if (peripheral.connectable && peripheral.address === "c0:ab:2a:6a:1a:89") { // test
                setImmediate( () => {
                    getConnection(peripheral.address);
                });
            }
        }
        else {
            console.log(" update: " + peripheral.address);
            peripherals[index] = peripheral;
        }
    });

    noble.on('scanStop', function() {
        console.log('scan stopped');
    });

    // schedule disconnector
    // check connection cache periodically and disconnect a long-time-no-access peer
    setInterval(() => {
        console.log("disconnector: called");
        let now = Date.now();
        for (let i = 0; i < connections.length; i++) {
            let con = connections[i];
            if (con.timestamp !== 0 && con.timestamp + config.BLE_KEEP_INTERVAL < now) {
                let peripheral = peripherals.find(p => p.address === con.address);
                if (!peripheral) {
                    console.log("disconnector: no peripheral found for " + con.address);
                    continue;
                }
                console.log("disconnector: stale " + peripheral.address + " (" + peripheral.state + ")");
                con.timestamp = 0;
                if (peripheral.state === "connected") {
                    peripheral.disconnect((err) => {
                        console.log("disconnector: " + (err ? err.toString() : "done"));
                    });
                }
            }
        }
    }, config.BLE_CHECK_INTERVAL);
}

// this function is called if an access is required to any characteristic of a node
// before doing so, a connection should be made and list of characteristics should be obtained.
// cf. In BLE, service uuids are sometimes available through advertisement data before connection.
//  a list of characteristics are only available when a connection is made.
//
// getConnection() creates a connection cache entry (if not already made) and/or makes a connection (if not already connected).
// disconnector() periodically checks the entry and 'timestamp' is used to disconnect an connection unused long time.
// timestamp updated by each time a call is made to getConnection()
// disconnector() clears timestamp to zero but keeps the entry
// characteristics are populated for the first time a connection is made.
function getConnection(address) { // returns connection cache entry

    let peripheral = peripherals.find(p => p.address === address);
    if (!peripheral) { console.log("getConnection: no peripheral for " + address); return null; }

    console.log("getConnection: " + address + " (" + peripheral.state + ")");
 
    // get or allocate connection cache entry
    let con = connections.find(c => c.address === address);
    if (!con) {
        con = { address: address, map: null, timestamp: 0 };
        connections.push(con);
    }

    // update timestamp if already connected
    if (peripheral.state === "connected") {
        con.timestamp = Date.now();
        return con;
    }

    // connect to peer device and spawn some after-job
    peripheral.connect((err) => {
        if (err) { console.log("getConnection: connect: " + err); return; }
        con.timestamp = Date.now();
        if (con.map === null) {
            con.map = [];
            populateCharacteristics(peripheral, con);
        }
    });

    return con;
}

// this function iscalled within getConnection() when a connection is complete for the first time.
// populateCharacteristics() builds service-characteristics map on a connection cache entry.
function populateCharacteristics(peripheral, con) {

    // singel noble api for doing this is:
    //   peripheral.discoverAllServicesAndCharacteristics((error, services, characteristics) => {});
    //     services: [service, service, ...]
    //     characteristics: [ characteristic, characteristic, ...] each contains _serviceUuid up ling
    // but I chose the following two-phase apis to make linking between a service and the characteristics simple.

    // get all services and their subordinate characteristics
    // from sample code: .\noble\examples\pizza\central.js
    peripheral.discoverServices([], function (err, services) {
        services.forEach(function (service) {
            if (err) {
                console.log("discoverServices: " + err);
                return;
            }

            console.log(' found service: ', service.toString());

            service.discoverCharacteristics([], function (err, characteristics) {
                if (err) {
                    console.log("discoverCharacteristics: " + err);
                    return;
                }

                characteristics.forEach(function (characteristic) {
                    console.log(' found characteristic:', characteristic.toString());
                })

                // set characteristics per service
                con.map.push({ service: service, characteristics: characteristics });
            })
        })
    })
}

// search a connection cache entry and find a characteristic for a specified uuid.
function findCharacteristic(address, charaUuid) { // returns noble characteristic
    let con = getConnection(address);
    if (!con) { console.log("findCharacteristic: " + address + ": not found"); return null; }
    let chara = null;
    for (let i = 0; i < con.map.length; i++) {
        console.log("findCharacteristic: service = " + con.map[i].service.uuid);
        let charaList = con.map[i].characteristics;
        if (!charaList || charaList.length === 0) continue;
        console.log("findCharacteristic: chara =  " + charaList.map(c => c.uuid));
        chara = charaList.find(c => c.uuid === charaUuid);
        if (chara) break;
    }
    if (!chara) { console.log("findCharacteristic: " + charaUuid + ": not found"); return null; }
    return chara;
}

// read a characteristic value, convert to a string and pass it through callback 'cb'
module.exports.readCharacteristic = function(address, charaUuid, cb) {
    let chara = findCharacteristic(address, charaUuid);
    if (!chara) { cb("characteristic " + charaUuid + ": not found"); return; }
    chara.read((error, data) => {
        if (error) { cb(error.toString()); return; }
        let str = fromBuffer(data);
        cb(str);
    });
}

// write a caracteristic value; value must be hex string or tilda-prefixed string
// callback 'cb' used to pass error or 'OK' when successful
// Note that no error returned when noble writes to nRF51 dongle even if the characteristic is read-only
// noAck is for write-without-response otherwise reliable write
module.exports.writeCharacteristic = function(address, charaUuid, value, noAck, cb) {
    let chara = findCharacteristic(address, charaUuid);
    if (!chara) { cb("characteristic " + charaUuid + ": not found"); return; }
    let data = toBuffer(value);
    chara.write(data, noAck, (error) => {
        if (error) { cb(error.toString()); return; }
        cb("OK");
    });
}

// subscribe for indication or notification
// TODO: politely unsubscribe on disconnection and tell that fact to user?
module.exports.subscribe = function(address, charaUuid, cb) {
    let chara = findCharacteristic(address, charaUuid);
    if (!chara) { cb(charaUuid + ": not found"); return; }
    chara.subscribe((err) => {
        if (err) { cb(err.toString()); return; }
        chara.on('data', (data, isNotification) => {
            console.log("onData: " + charaUuid + " '" + JSON.stringify(data) + "' isNotify = " + isNotification);
            let str = fromBuffer(data);
            cb(str);
        });
    });
}

// list of nodes
// if 'connectable' is true, only connectable nodes are turned; otherwise all nodes are returned
module.exports.getNodes = function(connectable) {

    // all or only connectable list
    let periphs = connectable ? peripherals.filter(p => p.connectable) : peripherals;

    let nodes = [];
    for (let i = 0; i < periphs.length; i++) {
        let p = periphs[i];
        nodes.push(toNode(p));
    }
    return nodes;
}

// single node
module.exports.getNode = function(address) {
    let p = peripherals.find(p => p.address === address);
    return p !== undefined ? toNode(p) : {};
}

// build single json'able 'node' from noble 'peripheral'
function toNode(peripheral) {
    // [noble/lib/peripheral.js]
    // function Peripheral(noble, id, address, addressType, connectable, advertisement, rssi) {
    //     this._noble = noble;
    //     this.id = id;
    //     this.uuid = id; // for legacy
    //     this.address = address;
    //     this.addressType = addressType;
    //     this.connectable = connectable;
    //     this.advertisement = advertisement;
    //     this.rssi = rssi;
    //     this.services = null;
    //     this.state = 'disconnected';
    //   }
    return {
        // id: peripheral.id,
        address: peripheral.address,
        addressType: peripheral.addressType,
        connectable: peripheral.connectable,
        localName: peripheral.advertisement.localName,
        serviceUuids: peripheral.advertisement.serviceUuids,
        // serviceSolicitationUuid: peripheral.advertisement.serviceSolicitationUuid,
        // manufacturerData: peripheral.advertisement.manufacturerData,
        // txPowerLevel: peripheral.advertisement.txPowerLevel,
        rssi: peripheral.rssi
    }
}

// list of services in a node
module.exports.getServices = function (address) {
    // there are two ways to get a list of services:
    // 1) scan response which requires connection to the peer but always correct
    let con = getConnection(address);
    return con.map.map(x => toService(x.service));
    // 2) advertise data (available prior to connection but may not always be filled in)
    // let peripheral = peripherals.find(p => p.address === address);
    // let services = peripheral ? peripheral.advertisement.serviceUuids : [];
    // return services.map(s => { return { uuid: s }; });
}

// build json'able service data from noble 'service'
function toService(service) {
    return { uuid: service.uuid };
    // TODO: only uuid returned; name and type may be useful
}

// list of characteristics in a service in a node
module.exports.getCharacteristics = function(address, serviceUuid) {
    let con = getConnection(address);
    if (!con) {
        console.log(address + ": not found");
        return [];
    }
    let serv = con.map.find(s => s.service.uuid === serviceUuid);
    if (!serv) {
        console.log("service " + serviceUuid + ": not found");
        return [];
    }
    return serv.characteristics.map(c => toChara(c));
}

// build json'able characteristic data from noble 'characteristic'
function toChara(characteristic) {
    return { uuid: characteristic.uuid, properties: characteristic.properties };
    // TODO: name and type are sometimes useful
}

// convert string value passed from a web client to Buffer data that can be passed to characteristic.write()
// two formats are allowed:
// - hex characters: length auto-calculated and determines data size; eg. "0100" = two-byte value of 1 in little endian
// - string data prefixed with tilda '~': "~hello" -> five character string of 'hello'
function toBuffer(str) {
    if (str.charAt(0) === '~') { // string
        let buf = Buffer.alloc(str.length - 1);
        buf.write(str.substring(1));
        return buf;
    }
    return Buffer.from(str, 'hex'); // hex
}

// convert Buffer data read by characteristic.read() to hex string passed to a web client
function fromBuffer(data) {
    return data.toString('hex'); // byte array to hex string
}
