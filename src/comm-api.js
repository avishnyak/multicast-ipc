var promise = require('bluebird');

/**
 * @module comm-api
 */

/**
 * API Helper Object has convenience functions for implementing your custom communications protocol.
 * @class CommApi
 * @param socket
 */
module.exports = function CommApi(socket) {
    this._socket = socket;
};


/**
 * Broadcast a message to all listeners.
 *
 * Listeners will need to connect to the same port and multicastAddress as the sender to receive messages.
 *
 * @param {Buffer|string} message - Message to send
 *
 * @fulfil No value.  The buffer is safe to reuse now.
 * @reject {Error} err - Error returned from socket
 *
 * @returns {promise}
 */
CommApi.prototype.broadcast = function (message) {
    var socket = this._socket;

    return send.bind(this, message, socket._port, socket._multicastAddress)();
};

/**
 * Send a message directly to a port/ip address.
 *
 * This function can be used for 1:1 communication as well as for group messaging if the IP address happens to be
 * one that is in the multicast range.
 *
 * If the value of address is a host name, DNS will be used to resolve the address of the host which will incur at least
 * one processTick delay. If the address is an empty string, '127.0.0.1' or '::1' will be used instead.
 *
 * @param {Buffer|string} message - The message to send
 * @param {number} port - UDP port to send data to
 * @param {string} ipAddress - Destination hostname or IP address
 *
 * @fulfil No value
 * @reject {Error} err - Error from sending the command
 *
 * @returns {Promise}
 */
CommApi.prototype.send = function send(message, port, ipAddress) {
    var socket = this._socket;
    var messageBuffer = new Buffer(message);

    return promise.fromCallback(function (callback) {
        socket.send(messageBuffer, 0, messageBuffer.length, port, ipAddress, callback);
    });
};

/**
 * Unbind socket.  No more communication can be done through this promise chain after this.
 *
 * @fulfil Socket closed successfully
 * @reject {Error} err - Socket could not be closed
 *
 * @returns {Promise}
 */
CommApi.prototype.unbind = function unbind() {
    var socket = this._socket;

    return promise.fromCallback(function (callback) {
        socket.close(callback);
    });
};

/**
 * Wait for a specific message.  The optional filter function is called for every message that is received.  If the filter
 * function returns true, the promise is resolved with that value.
 *
 * @param {function} [filter] - Each received message is passed into the filter function.
 *
 * @fulfil {*} message - The message that was received
 * @reject {Error} err - Error thrown from the filter function
 *
 * @returns {Promise}
 */
CommApi.prototype.waitForMessage = function waitForMessage(filter) {
    var socket = this._socket;

    return repeatWhile(function (message) {
        return typeof message === 'undefined';
    }, function () {
        var fn;

        return new promise(function (resolve) {
            fn = processMessage;

            socket.once('message', fn);

            function processMessage(message, rinfo) {
                if (typeof filter !== 'function' || filter(message, rinfo) === true) {
                    resolve(message);
                } else {
                    resolve(undefined);
                }
            }
        }).error(function () { socket.removeListener('message', fn); });
    }, undefined);
};

var repeatWhile = promise.method(function(condition, action, lastValue) {
    if (!condition(lastValue)) return lastValue;

    return action(lastValue).then(repeatWhile.bind(null, condition, action));
});

/**
 * Repeat a certain chain of commands until the specified condition is met.  This is the equivalent of a while loop.
 *
 * The ```condition``` function is used to decide whether to continue looping or stop.  It receives the last value from
 * the action function as input and should return ```true``` to continue the loop or false to ```stop```.
 *
 * The ```action``` function contains the body of the loop.  This is typically an entire back and forth interaction of the
 * protocol using {@link broadcast}, {@link send} and {@link waitForMessage} functions.  The end result should be a
 * promise that resolves to a value which will be passed into the ```condition``` function.
 *
 * @param {function} condition - A callback function that receives the "lastValue" and returns true to continue repeating
 * @param {function} action - A callback function that must return a promise
 * @param {*} lastValue - This is the first "lastValue" that will be passed to the condition function
 *
 * @fulfil {*} The latest lastValue
 * @reject {Error} err - Error thrown by either the condition function or the action function
 *
 * @returns {Promise}
 */
CommApi.prototype.repeatWhile = repeatWhile;

/**
 * Repeat a set of commands for a specific number of times
 *
 * @param {number} count - The number of times that ```fn``` should be called
 * @param {function} fn - The function that should be repeated
 *
 * @fulfil {number} lastValue - The last value of the for..loop (always 0)
 * @reject {Error} err - Error thrown from the ```fn``` function
 *
 * @returns {Promise}
 */
CommApi.prototype.repeatFor = function repeatFor(count, fn) {
    return repeatWhile(function (lastValue) { return lastValue > 0; }, function (lastValue) {
        return promise.try(fn).then(function () { return promise.resolve(--lastValue); });
    }, count);
};
