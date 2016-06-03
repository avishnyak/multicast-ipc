# Multicast IPC

Dealing with sockets, events and state machines is hard.  Communicating between your processes should be fun not hard.
This module aims to make that happen by abstracting away some of the complexity and using promises to chain together
communication states.

## Example
```js
var ipc = require('multicast-ipc');

ipc.withSocket(function (api) {
  // API is a handy class that has lots of helper functions on it

  api.broadcast('I am online!')
     .then(api.waitForMessage())
     .timeout(5000) // from Bluebird
     .then(function (message) {
         // message is a Buffer here
         var cmd = message.toString();

         if (cmd === 'ping') {
            return api.broadcast('pong');
         } else {
            return api.unbind();
         }
     });
});
```

__Note:__ This is still under active development and APIs may change.  Every effort will be made to maintain backwards
compatibility.

### Benefits

* A chainable promise-based api
* Abstracts all the socket work and resources via promises
* Allows a pub/sub inter-process communication
* Easily move communication from same machine to separate machines
* Compatible with Windows, Linux and OS X
* Requires a network to be present - don't rely on this IPC method for local-only programs



## Installation

Install using [npm](https://www.npmjs.org/):

```sh
npm install multicast-ipc
```

## API Reference
<a name="module_multicast-ipc"></a>

## multicast-ipc

* [multicast-ipc](#module_multicast-ipc)
    * _inner_
        * [~apiCallback](#module_multicast-ipc..apiCallback) : <code>function</code>
    * _static_
        * [.withSocket([port], [multicastAddress], callback)](#module_multicast-ipc.withSocket) ⇒ <code>Promise</code>

<a name="module_multicast-ipc..apiCallback"></a>

### multicast-ipc~apiCallback : <code>function</code>
This API callback is where you would implement your custom communication protocol.

**Kind**: inner typedef of <code>[multicast-ipc](#module_multicast-ipc)</code>  

| Param | Type | Description |
| --- | --- | --- |
| api | <code>CommApi</code> | API Helper Object |

<a name="module_multicast-ipc.withSocket"></a>

### multicast-ipc.withSocket([port], [multicastAddress], callback) ⇒ <code>Promise</code>
Initialize a socket.  Listens to messages, allows sending messages and automatically cleans up after itself.The callback function will be invoked after the socket is successfully set up.  An `api` object will be passedto the callback which has utility functions that help in creating the application-layer communication protocol.

**Kind**: static method of <code>[multicast-ipc](#module_multicast-ipc)</code>  
**Fulfil**: <code>\*</code> Result of the last item returned from the callback  
**Reject**: <code>Error</code> Error from binding the socket  

| Param | Type | Description |
| --- | --- | --- |
| [port] | <code>number</code> | Datagram port to listen on (Default: 61088) |
| [multicastAddress] | <code>string</code> | Multicast address to group senders/listeners |
| callback | <code>apiCallback</code> | Function that will be called with the communication api object |

**Example**  
```jsvar ipc = require('multicast-ipc');ipc.withSocket(function (api) {  // The API object contains helper methods for implementing your own IPC protocol    return api.broadcast('node:online')            .then(api.unbind);  // This is optional (the library automatically handles resources});```


<a name="module_comm-api..CommApi"></a>

## comm-api~CommApi
**Kind**: inner class of <code>[comm-api](#module_comm-api)</code>  

* [~CommApi](#module_comm-api..CommApi)
    * [new CommApi(socket)](#new_module_comm-api..CommApi_new)
    * [.broadcast(message)](#module_comm-api..CommApi+broadcast) ⇒ <code>promise</code>
    * [.repeatFor(count, fn)](#module_comm-api..CommApi+repeatFor) ⇒ <code>Promise</code>
    * [.repeatWhile](#module_comm-api..CommApi+repeatWhile) ⇒ <code>Promise</code>
    * [.send(message, port, ipAddress)](#module_comm-api..CommApi+send) ⇒ <code>Promise</code>
    * [.unbind()](#module_comm-api..CommApi+unbind) ⇒ <code>Promise</code>
    * [.waitForMessage([filter])](#module_comm-api..CommApi+waitForMessage) ⇒ <code>Promise</code>

<a name="new_module_comm-api..CommApi_new"></a>

### new CommApi(socket)
API Helper Object has convenience functions for implementing your custom communications protocol.


| Param |
| --- |
| socket | 

<a name="module_comm-api..CommApi+broadcast"></a>

### commApi.broadcast(message) ⇒ <code>promise</code>
Broadcast a message to all listeners.Listeners will need to connect to the same port and multicastAddress as the sender to receive messages.

**Kind**: instance method of <code>[CommApi](#module_comm-api..CommApi)</code>  
**Fulfil**: No value.  The buffer is safe to reuse now.  
**Reject**: <code>Error</code> err - Error returned from socket  

| Param | Type | Description |
| --- | --- | --- |
| message | <code>Buffer</code> &#124; <code>string</code> | Message to send |

<a name="module_comm-api..CommApi+repeatFor"></a>

### commApi.repeatFor(count, fn) ⇒ <code>Promise</code>
Repeat a set of commands for a specific number of times

**Kind**: instance method of <code>[CommApi](#module_comm-api..CommApi)</code>  
**Fulfil**: <code>number</code> lastValue - The last value of the for..loop (always 0)  
**Reject**: <code>Error</code> err - Error thrown from the ```fn``` function  

| Param | Type | Description |
| --- | --- | --- |
| count | <code>number</code> | The number of times that ```fn``` should be called |
| fn | <code>function</code> | The function that should be repeated |

<a name="module_comm-api..CommApi+repeatWhile"></a>

### commApi.repeatWhile ⇒ <code>Promise</code>
Repeat a certain chain of commands until the specified condition is met.  This is the equivalent of a while loop.The ```condition``` function is used to decide whether to continue looping or stop.  It receives the last value fromthe action function as input and should return ```true``` to continue the loop or false to ```stop```.The ```action``` function contains the body of the loop.  This is typically an entire back and forth interaction of theprotocol using [broadcast](broadcast), [send](send) and [waitForMessage](waitForMessage) functions.  The end result should be apromise that resolves to a value which will be passed into the ```condition``` function.

**Kind**: instance property of <code>[CommApi](#module_comm-api..CommApi)</code>  
**Fulfil**: <code>\*</code> The latest lastValue  
**Reject**: <code>Error</code> err - Error thrown by either the condition function or the action function  

| Param | Type | Description |
| --- | --- | --- |
| condition | <code>function</code> | A callback function that receives the "lastValue" and returns true to continue repeating |
| action | <code>function</code> | A callback function that must return a promise |
| lastValue | <code>\*</code> | This is the first "lastValue" that will be passed to the condition function |

<a name="module_comm-api..CommApi+send"></a>

### commApi.send(message, port, ipAddress) ⇒ <code>Promise</code>
Send a message directly to a port/ip address.This function can be used for 1:1 communication as well as for group messaging if the IP address happens to beone that is in the multicast range.If the value of address is a host name, DNS will be used to resolve the address of the host which will incur at leastone processTick delay. If the address is an empty string, '127.0.0.1' or '::1' will be used instead.

**Kind**: instance method of <code>[CommApi](#module_comm-api..CommApi)</code>  
**Fulfil**: No value  
**Reject**: <code>Error</code> err - Error from sending the command  

| Param | Type | Description |
| --- | --- | --- |
| message | <code>Buffer</code> &#124; <code>string</code> | The message to send |
| port | <code>number</code> | UDP port to send data to |
| ipAddress | <code>string</code> | Destination hostname or IP address |

<a name="module_comm-api..CommApi+unbind"></a>

### commApi.unbind() ⇒ <code>Promise</code>
Unbind socket.  No more communication can be done through this promise chain after this.

**Kind**: instance method of <code>[CommApi](#module_comm-api..CommApi)</code>  
**Fulfil**: Socket closed successfully  
**Reject**: <code>Error</code> err - Socket could not be closed  
<a name="module_comm-api..CommApi+waitForMessage"></a>

### commApi.waitForMessage([filter]) ⇒ <code>Promise</code>
Wait for a specific message.  The optional filter function is called for every message that is received.  If the filterfunction returns true, the promise is resolved with that value.

**Kind**: instance method of <code>[CommApi](#module_comm-api..CommApi)</code>  
**Fulfil**: <code>\*</code> message - The message that was received  
**Reject**: <code>Error</code> err - Error thrown from the filter function  

| Param | Type | Description |
| --- | --- | --- |
| [filter] | <code>function</code> | Each received message is passed into the filter function. |



## Contributing

Please submit all issues and pull requests to the [avishnyak/multicast-ipc](http://github.com/avishnyak/multicast-ipc) repository!

## Tests

Run tests using `npm test` (coming soon).

## Support

If you have any problem or suggestion please open an issue [here](https://github.com/avishnyak/multicast-ipc/issues).