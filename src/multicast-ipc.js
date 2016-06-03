var promise = require('bluebird');
var dgram = require('dgram');

/**
 * @module multicast-ipc
 */

/**
 * Configure multicast socket and start listening for messages.
 *
 * @private
 * @param {number} port - Port to listen/send
 * @param {string} [multicastAddress] - A multicast address for the socket (Default: 224.0.2.1)
 *
 * @fulfill {socket}
 * @reject {Error}
 *
 * @returns {Promise}
 */
function getSocket(port, multicastAddress) {
    return new promise(function (resolve, reject) {
        try {
            var socket = dgram.createSocket({type: 'udp4', reuseAddr: true});

            socket._port = port;

            socket.once('listening', function () {
                socket._multicastAddress = multicastAddress || '224.0.2.1';

                socket.setBroadcast(true);
                socket.setMulticastLoopback(true);
                socket.setMulticastTTL(1);
                socket.addMembership(socket._multicastAddress);

                resolve(socket);
            });

            socket.bind(socket._port);
        } catch (ex) {
            reject(ex);
        }
    }).disposer(function (socket) {
        if (socket._handle) {
            socket.close();
        }
    });
}

/**
 * Initialize a socket.  Listens to messages, allows sending messages and automatically cleans up after itself.
 *
 * The callback function will be invoked after the socket is successfully set up.  An `api` object will be passed
 * to the callback which has utility functions that help in creating the application-layer communication protocol.
 *
 * @param {number} [port] - Datagram port to listen on (Default: 61088)
 * @param {string} [multicastAddress] - Multicast address to group senders/listeners
 * @param {function} callback - Function that will be called with the communication api object
 *
 * @fulfill {*} Result of the last item returned from the callback
 * @reject {Error} Error from binding the socket
 *
 * @returns {Promise}
 * 
 * @example
 * ```js
 * var ipc = require('multicast-ipc');
 * 
 * ipc.withSocket(function (api) {
 *   // The API object contains helper methods for implementing your own IPC protocol
 *   
 *   return api.broadcast('node:online')
 *             .then(api.unbind);  // This is optional (the library automatically handles resources
 * });
 * ```
 */
exports.withSocket = function bind(port, multicastAddress, callback) {
    var p = typeof port === 'number' ? port : 61088;
    var cb = typeof port === 'function' ? port : callback;

    return promise.using(getSocket(p, multicastAddress), function (socket) {
        var api = {
            broadcast: broadcast.bind(socket),
            send: send.bind(socket),
            waitForMessage: waitForMessage.bind(socket),
            repeatWhile: repeatWhile,
            repeatFor: repeatFor,
            unbind: unbind.bind(socket)
        };

        return promise.try(cb, api);
    });
};

function broadcast(message) {
    var socket = this;

    return send.bind(this, message, socket._port, socket._multicastAddress)();
}

function send(message, port, ipAddress) {
    var socket = this;
    var messageBuffer = new Buffer(message);

    return promise.fromCallback(function (callback) {
        socket.send(messageBuffer, 0, messageBuffer.length, port, ipAddress, callback);
    });
}

function unbind() {
    var socket = this;

    return promise.fromCallback(function (callback) {
        socket.close(callback);
    });
}

function waitForMessage(filter) {
    var socket = this;

    return repeatWhile(function (message) {
        return typeof message === 'undefined';
    }, function () {
        var fn;

        return new promise(function (resolve) {
            fn = processMessage;

            socket.once('message', fn);

            function processMessage(message, rinfo) {
                if (typeof filter !== 'function' || filter(message, rinfo)) {
                    resolve(message);
                } else {
                    resolve(undefined);
                }
            }
        }).error(function () { socket.removeListener('message', fn); });
    }, undefined);
}

var repeatWhile = promise.method(function(condition, action, lastValue) {
    if (!condition(lastValue)) return lastValue;

    return action(lastValue).then(repeatWhile.bind(null, condition, action));
});

function repeatFor(count, fn) {
    return repeatWhile(function (lastValue) { return lastValue > 0; }, function (lastValue) {
        return promise.try(fn).then(function () { return promise.resolve(--lastValue); });
    }, count);
}
