const util = require('util');
const EventEmitter = require('events');
const frame = require('./frame');


module.exports = exports = Socket;

const emit = EventEmitter.prototype.emit;


function Socket(id, socket, client) {
    EventEmitter.call(this);

    this.id = id;
    this.name = ""; // when player can save his profile.
    this.socket = socket;
    this.client = client;
    this.room = null;
}

util.inherits(Socket, EventEmitter);


/**
 * Binds the browser socket with the 'ID' send.
 * Function 'fn' contains code that executes only after id is bind to the socket.
 * // This will also contain the final authentixcation of the id.
 */
Socket.prototype.bind = function (fn) {
    if (this.id) {
        this.socket.write(frame.createBuffer({
            assignedId: this.id
        }));
        if (fn) fn();
    }
}


Socket.prototype.emitEvent = function (...args) {
    if (args[0])
        emit.apply(this, args);
}


Socket.prototype.join = function (room) {
    this.client.assignRoom(room, this);
}


Socket.prototype.joinRandom = function () {
    this.client.assignRoomTo(this);
}


Socket.prototype.broadcast = function (event, data) {
    this.client.sendToAllExcept(this, event, data);
}


Socket.prototype.sendAll = function (event, data) {
    this.client.sendToAll(this, event, data);
}


Socket.prototype.send =
Socket.prototype.write = function (buffer) {
    // console.log(`/* Socket [${this.id}] sending a buffer */`);
    this.socket.write(buffer);
};


Socket.prototype.emit = function (event, data) {
    // console.log(`/* Socket [${this.id}] emitting an event */`);
    this.socket.write(frame.createBuffer({
        event,
        data
    }));
}


Socket.prototype.close = function () {
    this.socket.destroy();
}