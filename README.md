# Multicast IPC

Dealing with sockets, events and state machines is hard.  Communicating between your processes should be fun not hard.
This module aims to make that happen by abstracting away some of the complexity and using promises to chain together
communication states.

## Example
```js
var ipc = require('multicast-ipc');

ipc.withSocket(function (api) {
  // API is a handy class that has lots of helper functions on it

  return api.broadcast('I am online!')
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

## API Documentation

    
* [CommApi](#CommApi)
    * [new CommApi(socket)](#new_CommApi_new)
    * [.broadcast(message)](#CommApi+broadcast) ⇒ <code>promise</code>
    * [.repeatFor(count, fn)](#CommApi+repeatFor) ⇒ <code>Promise</code>
    * [.repeatWhile](#CommApi+repeatWhile) ⇒ <code>Promise</code>
    * [.send(message, port, ipAddress)](#CommApi+send) ⇒ <code>Promise</code>
    * [.unbind()](#CommApi+unbind) ⇒ <code>Promise</code>
    * [.waitForMessage([filter])](#CommApi+waitForMessage) ⇒ <code>Promise</code>

    
* [multicastIpc](#multicastIpc)
    * [..apiCallback](#multicastIpc.apiCallback) : <code>function</code>
    * [..withSocket([port], [multicastAddress], callback)](#multicastIpc.withSocket) ⇒ <code>Promise</code>


-----

## Classes

<dl>
<dt><a href="#CommApi">CommApi</a></dt>
<dd></dd>
<dt><a href="#multicastIpc">multicastIpc</a></dt>
<dd></dd>
</dl>

<a name="CommApi"></a>

## CommApi
<a name="new_CommApi_new"></a>

### new CommApi(socket)
API Helper Object has convenience functions for implementing your custom communications protocol.


| Param |
| --- |
| socket | 

<a name="CommApi+broadcast"></a>

### *commApi*.broadcast(message) ⇒ <code>promise</code>
Broadcast a message to all listeners.

Listeners will need to connect to the same port and multicastAddress as the sender to receive messages.

**Fulfil**: No value.  The buffer is safe to reuse now.  
**Reject**: <code>Error</code> err - Error returned from socket  
**Since**: 1.0.0  

| Param | Type | Description |
| --- | --- | --- |
| message | <code>Buffer</code> &#124; <code>string</code> | Message to send |

<a name="CommApi+repeatFor"></a>

### *commApi*.repeatFor(count, fn) ⇒ <code>Promise</code>
Repeat a set of commands for a specific number of times

**Fulfil**: <code>number</code> lastValue - The last value of the for..loop (always 0)  
**Reject**: <code>Error</code> err - Error thrown from the ```fn``` function  
**Since**: 1.0.0  

| Param | Type | Description |
| --- | --- | --- |
| count | <code>number</code> | The number of times that ```fn``` should be called |
| fn | <code>function</code> | The function that should be repeated |

<a name="CommApi+repeatWhile"></a>

### *commApi*.repeatWhile ⇒ <code>Promise</code>
Repeat a certain chain of commands until the specified condition is met.  This is the equivalent of a while loop.

The ```condition``` function is used to decide whether to continue looping or stop.  It receives the last value from
the action function as input and should return ```true``` to continue the loop or false to ```stop```.

The ```action``` function contains the body of the loop.  This is typically an entire back and forth interaction of the
protocol using [broadcast](#CommApi+broadcast), [send](#CommApi+send) and
[waitForMessage](#CommApi+waitForMessage) functions.  The end result should be a
promise that resolves to a value which will be passed into the ```condition``` function.

**Fulfil**: <code>\*</code> The latest lastValue  
**Reject**: <code>Error</code> err - Error thrown by either the condition function or the action function  
**Since**: 1.0.0  

| Param | Type | Description |
| --- | --- | --- |
| condition | <code>function</code> | A callback function that receives the "lastValue" and returns true to continue repeating |
| action | <code>function</code> | A callback function that must return a promise |
| lastValue | <code>\*</code> | This is the first "lastValue" that will be passed to the condition function |

<a name="CommApi+send"></a>

### *commApi*.send(message, port, ipAddress) ⇒ <code>Promise</code>
Send a message directly to a port/ip address.

This function can be used for 1:1 communication as well as for group messaging if the IP address happens to be
one that is in the multicast range.

If the value of address is a host name, DNS will be used to resolve the address of the host which will incur at least
one processTick delay. If the address is an empty string, '127.0.0.1' or '::1' will be used instead.

**Fulfil**: No value  
**Reject**: <code>Error</code> err - Error from sending the command  
**Since**: 1.0.0  

| Param | Type | Description |
| --- | --- | --- |
| message | <code>Buffer</code> &#124; <code>string</code> | The message to send |
| port | <code>number</code> | UDP port to send data to |
| ipAddress | <code>string</code> | Destination hostname or IP address |

<a name="CommApi+unbind"></a>

### *commApi*.unbind() ⇒ <code>Promise</code>
Unbind socket.  No more communication can be done through this promise chain after this.

**Fulfil**: Socket closed successfully  
**Reject**: <code>Error</code> err - Socket could not be closed  
**Since**: 1.0.0  
<a name="CommApi+waitForMessage"></a>

### *commApi*.waitForMessage([filter]) ⇒ <code>Promise</code>
Wait for a specific message.  The optional filter function is called for every message that is received.  If the filter
function returns true, the promise is resolved with that value.

**Fulfil**: <code>\*</code> message - The message that was received  
**Reject**: <code>Error</code> err - Error thrown from the filter function  
**Since**: 1.0.0  

| Param | Type | Description |
| --- | --- | --- |
| [filter] | <code>function</code> | Each received message is passed into the filter function. |

<a name="multicastIpc"></a>

## multicastIpc
<a name="multicastIpc.apiCallback"></a>

### *multicastIpc*..apiCallback : <code>function</code>
This API callback is where you would implement your custom communication protocol.

**Since**: 1.0.0  

| Param | Type | Description |
| --- | --- | --- |
| api | <code>[CommApi](#CommApi)</code> | API Helper Object |

<a name="multicastIpc.withSocket"></a>

### *multicastIpc*..withSocket([port], [multicastAddress], callback) ⇒ <code>Promise</code>
Initialize a socket.  Listens to messages, allows sending messages and automatically cleans up after itself.

The callback function will be invoked after the socket is successfully set up.  An `api` object will be passed
to the callback which has utility functions that help in creating the application-layer communication protocol.

**Fulfil**: <code>\*</code> Result of the last item returned from the callback  
**Reject**: <code>Error</code> Error from binding the socket  
**Since**: 1.0.0  

| Param | Type | Description |
| --- | --- | --- |
| [port] | <code>number</code> | Datagram port to listen on (Default: 61088) |
| [multicastAddress] | <code>string</code> | Multicast address to group senders/listeners |
| callback | <code>apiCallback</code> | Function that will be called with the communication api object |

**Example**  
```js
var ipc = require('multicast-ipc');

ipc.withSocket(function (api) {
  // The API object contains helper methods for implementing your own IPC protocol
  
  return api.broadcast('node:online')
            .then(api.unbind);  // This is optional (the library automatically handles resources
});
```

## Contributing

Please submit all issues and pull requests to the [avishnyak/multicast-ipc](http://github.com/avishnyak/multicast-ipc) repository!

## Tests

Run tests using `npm test` (coming soon).

## Support

If you have any problem or suggestion please open an issue [here](https://github.com/avishnyak/multicast-ipc/issues).