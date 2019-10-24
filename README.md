# ble-for-iot/sig-api - Implementation of BLE IoT Gateway API proposed by Bluetooth SIG White Paper

A BLE IoT gateway (ble-iot-gwy) provides web access to nearby Bluetooth Low Energy (BLE) devices on the local LAN or remote BLE devices via Internet.

This is an experimental and partial implementation of web api interface based on GATT REST API design proposed by a Bluetooth SIG white paper.

>GATT REST API  
>[www.bluetooth.com/bluetooth-resources/gatt-rest-api](https://www.bluetooth.com/bluetooth-resources/gatt-rest-api/)  

This implementation runs on [nodejs](https://nodejs.org/en/) and uses the [express](http://expressjs.com/) module for building a web server, and the [noble](https://github.com/noble/noble) module for accessing a BLE device.

## Supported APIs

There are about twenty URLs defined in the white paper, of which seven APIs are implmennted, enough to read data from, write data to, and receive data change update from a BLE device.

A response to an API request is in JSON format except 'write characteristic' and 'subscribe to notification/indication'.

A summary of supported API functions follows.
See **test-revised.sh** for an example of actually-used URLs.

### GET http://*gateway*/gatt/nodes  

Get a list of devices (all or only connectable).

| Response | Remark |
|:---|:---|
| self | url to access the node |
| handle | handle of the node |
| bdaddr | bluetooth device address |
| AD | array of ADType-ADValue pair |

### GET http://*gateway*/gatt/nodes/*node*  

Get info about a specific device.

| Response | Remark|
|:---|:---|
| self | url to access the node |
| handle | handle of the node |

### GET http://*gateway*/gatt/nodes/*node*/services  

Get a list of services in a device.

| Response | Remark|
|:---|:---|
| self | url to access the service |
| handle | handle of the service |
| uuid | service UUID |
| primary | true or false |

### GET http://*gateway*/gatt/nodes/*node*/services/*service*/characteristics  

Get list of characteristics (data items) in a service.

| Response | Remark|
|:---|:---|
| self | URL to access the characteristic |
| handle | handle of the characteristic |
| uuid | characteristic UUID |
| properties | bit masks of permissions |

### GET http://*gateway*/gatt/nodes/*node*/characteristics/*characteristic*/value  

Get a value of a characteristic.

| Response | Remark|
|:---|:---|
| self | url to access the characteristic |
| handle | handle of the characteristic |
| value | hex string |

### GET http://*gateway*/gatt/nodes/*node*/characteristics/*characteristic*/event  

Subscribe to indication or notification (data change update) via server-sent events.

A web client will receive the following data through the event stream.

```
data: <event 1 data>         
data: <event 2 data> 
… 
data: <event n data> 
```

### PUT http://*gateway*/gatt/nodes/*node*/characteristics/*characteristic*/value/*value*  

Write data to a characteristic.

The response will be only a status code (200 if successful).

## Implementation

This implementation is tested under:

- DELL PC with Windows 10
- CSR Bluetooth 4.0 dongle (as a central)
- Nordic Semiconductor nRF51 dongle with nRF Connect (as a peripheral)

Dependencies are:

- [nodejs](https://nodejs.org/en/)
- [express](https://expressjs.com/)
- [noble](https://github.com/noble/noble)

**index.js** uses the express module to accept web requests and dispatches API service functions in **api-impl.js**. The functions in api-impl.js further calls ble device access functions in **ble-impl-noble.js**, an implementation using the noble module.

See **ev** folder for screen shots taken when running the gateway.

## Introducing alternative API design

See:
- [ALT API](http://www.kobu.com/ble-for-iot/alt-api.html)
- [Reference Implementation](https://github.com/ble-for-iot/alt-api)

The purpose of this experiment was to find a good api set for web developers unfamiliar with IoT edge devices like ones that uses BLE radio.

The Bluetooth-SIG proposed API is good for developers familiar with BLE technoloty or when porting an existing BLE-based application to a web-based application.

The SIG API is designed with one-to-one correspondence between the web API requests and functionalities provided by BLE protocols. The API requires a knowledge of BLE-specific data transactions.

Through this experiment, I chose to define an alternative gateway API for accessing a BLE device from web, rather than fully implementing the SIG API. The newly designed API provides an abstract and straight-forward interface for accessing data on a BLE device by hiding and automatically handling BLE-specific trivial details.

-----

Written 2019-Oct-10  
Last updated 2019-Oct-19
