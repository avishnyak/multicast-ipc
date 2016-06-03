# IPC Promise

[![NPM version](http://img.shields.io/npm/v/koa-router.svg?style=flat)](https://npmjs.org/package/koa-router) [![NPM Downloads](https://img.shields.io/npm/dm/koa-router.svg?style=flat)](https://npmjs.org/package/koa-router) [![Node.js Version](https://img.shields.io/node/v/koa-router.svg?style=flat)](http://nodejs.org/download/) [![Build Status](http://img.shields.io/travis/alexmingoia/koa-router.svg?style=flat)](http://travis-ci.org/alexmingoia/koa-router) [![Tips](https://img.shields.io/gratipay/alexmingoia.svg?style=flat)](https://www.gratipay.com/alexmingoia/) [![Gitter Chat](https://img.shields.io/badge/gitter-join%20chat-1dce73.svg?style=flat)](https://gitter.im/alexmingoia/koa-router/)

> Router middleware for [koa](https://github.com/koajs/koa)

* Express-style routing using `app.get`, `app.put`, `app.post`, etc.
* Named URL parameters.
* Named routes with URL generation.
* Responds to `OPTIONS` requests with allowed methods.
* Support for `405 Method Not Allowed` and `501 Not Implemented`.
* Multiple route middleware.
* Multiple routers.
* Nestable routers.
* ES7 async/await support.

## Installation

Install using [npm](https://www.npmjs.org/):

```sh
npm install koa-router
```

## API Reference
    <a name="module_multicast-ipc.withSocket"></a>

### multicast-ipc.withSocket([port], [multicastAddress], callback) ⇒ <code>Promise</code>
Initialize a socket.  Listens to messages, allows sending messages and automatically cleans up after itself.The callback function will be invoked after the socket is successfully set up.  An `api` object will be passedto the callback which has utility functions that help in creating the application-layer communication protocol.

**Kind**: static method of <code>[multicast-ipc](#module_multicast-ipc)</code>  
**Fulfill**: <code>\*</code> Result of the last item returned from the callback  
**Reject**: <code>Error</code> Error from binding the socket  

| Param | Type | Description |
| --- | --- | --- |
| [port] | <code>number</code> | Datagram port to listen on (Default: 61088) |
| [multicastAddress] | <code>string</code> | Multicast address to group senders/listeners |
| callback | <code>function</code> | Function that will be called with the communication api object |

**Example**  
```jsvar ipc = require('multicast-ipc');ipc.withSocket(function (api) {  // The API object contains helper methods for implementing your own IPC protocol    return api.broadcast('This is a message')            .then(api.unbind);  // This is optional (the library automatically handles resources});```
## Contributing

Please submit all issues and pull requests to the [alexmingoia/koa-router](http://github.com/alexmingoia/koa-router) repository!

## Tests

Run tests using `npm test`.

## Support

If you have any problem or suggestion please open an issue [here](https://github.com/alexmingoia/koa-router/issues).