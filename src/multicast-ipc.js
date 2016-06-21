var promise = require('bluebird');
var dgram = require('dgram');
var CommApi = require('./comm-api');

/**
 * @class multicastIpc
 */

/**
 * Configure multicast socket and start listening for messages.
 *
 * @private
 * @param {number} port - Port to listen/send
 * @param {string} multicastAddress - A multicast address for the socket (Default: 224.0.2.1)
 *
 * @fulfil {socket}
 * @reject {Error}
 *
 * @returns {Promise}
 */
function getSocket(port, multicastAddress) {
    return new promise(function (resolve, reject) {
        try {
            var socket = dgram.createSocket({type: 'udp4', reuseAddr: true});

            socket.once('listening', function () {
                socket._multicastAddress = multicastAddress;
                socket._port = port;
                socket.setBroadcast(true);

                socket.setMulticastLoopback(true);
                socket.setMulticastTTL(1);
                socket.addMembership(socket._multicastAddress);

                resolve(socket);
            });

            socket.bind(port);
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
 * The callback function will be invoked after the socket is successfully set up.  An {@link #CommApi api} object will be passed
 * to the callback which has utility functions that help in creating the application-layer communication protocol.
 *
 * @param {number} [port=61088] - Datagram port to listen on
 * @param {string} [multicastAddress=224.0.2.1] - Multicast address to group senders/listeners
 * @param {apiCallback} callback - Function that will be called with the communication api object
 *
 * @fulfil {*} Result of the last item returned from the callback
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
 *
 * @memberof! multicastIpc
 * @static
 * @alias multicastIpc.withSocket
 *
 * @since 1.0.0
 */
exports.withSocket = function bind(port, multicastAddress, callback) {
    var p = typeof port === 'number' ? port : 61088;
    var addr = typeof multicastAddress === 'string' ? multicastAddress : '224.0.2.1';
    var cb = typeof port === 'function' ? port : callback;

    return promise.using(getSocket(p, addr), function (socket) {
        return promise.try(cb, new CommApi(socket, port, multicastAddress));
    });
};

/**
 * This API callback is where you would implement your custom communication protocol.
 *
 * @callback apiCallback
 *
 * @param {CommApi} api - API Helper Object
 *
 * @memberof! multicastIpc
 * @since 1.0.0
 */

