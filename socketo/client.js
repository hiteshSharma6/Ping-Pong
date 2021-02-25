const frame = require('./frame');
const Socket = require('./socket');
const hash = require('./hash');
const Room = require('./room');
const Arena = require('./arena');


module.exports = exports = Client;


function Client(server, config) {

    this.server = server;
    this.config = config;
    this.clients = {}; // {id1: {}, id2: {}}
    this.room = null;
    this.arena = null;

}


/**
 * Initializes a Client object
 */
Client.prototype.initialize = function () {
    this.room = new Room(this.config);
    this.room.createNewRoom("/");

    this.arena = new Arena(this, Room.state);

    this.room.on(Room.state.CREATE, (room) => {
        console.log("\t --- Trigger STATE.CREATE");
        this.arena.emitState(Room.state.CREATE, room);
    });

    this.room.on(Room.state.UNTIL_INITIATE, (room) => {
        console.log("\t --- Trigger STATE.UNTIL_INITIATE");
        const socket = this.getLastSocketFromRoom(room);
        this.arena.emitState(Room.state.UNTIL_INITIATE, room, socket);
    });

    this.room.on(Room.state.INITIATE, (room) => {
        console.log("\t --- Trigger STATE.INITIATE");
        const sockets = this.getSocketsFromRoom(room);
        this.arena.emitState(Room.state.INITIATE, room, sockets);
    });

    this.room.on(Room.state.UNTIL_START, (room, count) => {
        console.log("\t --- Trigger STATE.UNTIL_START");
        const socket = this.getLastSocketFromRoom(room);
        this.arena.emitState(Room.state.UNTIL_START, room, socket, count);
    });

    this.room.on(Room.state.START, (room) => {
        console.log("\t --- Trigger STATE.START");
        const sockets = this.getSocketsFromRoom(room);
        console.log(this.config.timeout);
        sockets.forEach(socket => {
            socket.socket.setTimeout(this.config.timeout * 1000);
        });
        this.arena.emitState(Room.state.START, room, sockets);
    });

    this.room.on(Room.state.END, (room) => {
        console.log("\t --- Trigger STATE.END");
        const sockets = this.getSocketsFromRoom(room);
        this.arena.emitState(Room.state.END, room, sockets);
    });

}


Client.prototype.getArena = function () {
    return this.arena;
}


Client.prototype.getSocketsFromRoom = function (room) {
    const socketIds = this.room.getSockets(room);
    const sockets = [];
    socketIds.forEach((socketId) => {
        sockets.push(this.clients[socketId]);
    });
    return sockets;
}


Client.prototype.getLastSocketFromRoom = function (room) {
    const socketIds = this.room.getSockets(room);
    return this.clients[socketIds[socketIds.length - 1]];
}


Client.prototype.newConnection = function (socket) {
    const soc = this.createMySocket(socket);

    soc.bind(() => {
        console.log("\n----------\nCreating connection with new Socket\n----------");
        this.clients[soc.id] = soc;
        console.log(`Socket [${soc.id}] connection accepted`);
        this.assignDefaultRoom(soc);
        if (this.config.auto_join)
            this.assignRoomTo(soc);
        console.log(`Connection Established with Socket [${soc.socket.port}]`);
        console.log("----------\n");
        this.server.emit("connection", soc);
    });
}


Client.prototype.createMySocket = function (socket) {
    const id = hash.getSHA1Hex(socket.address + '', socket.port + '');
    const soc = new Socket(id, socket, this);
    return soc;
}


Client.prototype.assignDefaultRoom = function (socket) {
    this.room.assignRoom("/", socket);
}


Client.prototype.assignRoomTo = function (socket) {
    const roomAlloted = this.room.assignRoomTo(socket);
    if (!roomAlloted.id)
        console.log("==== ERROR CONNECTING SOCKET ====");
    console.log(" -- ", roomAlloted.reason);
}


Client.prototype.assignRoom = function (room, socket) {
    const roomAlloted = this.room.assignRoom(room, socket);
    if (roomAlloted.id)
        console.log("==== ERROR CONNECTING SOCKET ====");
    console.log(" -- ", roomAlloted.reason);
}


Client.prototype.emitEvent = function (data) {
    // console.log("RUN called");
    this.clients[data.id].emitEvent(data.event, data.data);
}


Client.prototype.sendToAllExcept = function (socket, event, data) {
    const socketIds = this.room.getSockets(socket);
    // console.log("Send all except: ", socketIds);
    if (socketIds) {
        const buffer = frame.createBuffer({
            event,
            data
        });
        socketIds.forEach((socketId) => {
            if (socketId !== socket.id)
                this.clients[socketId].send(buffer);
        });
    }
}


/**
 * The input can be a socket object or a room id.
 */
Client.prototype.sendToAll = function (input, event, data) {
    const socketIds = this.room.getSockets(input);
    if (socketIds) {
        const buffer = frame.createBuffer({
            event,
            data
        });
        socketIds.forEach((socketId) => {
            this.clients[socketId].send(buffer);
        });
    }
}


Client.prototype.clientCount = function () {
    return Object.keys(this.clients).length;
}


Client.prototype.endArena = function (id) {
    this.room.nextState(id, Room.state.END);
}


Client.prototype.remove = function (socket) {
    const id = hash.getSHA1Hex(socket.address + '', socket.port + '');
    if (this.clients[id]) {
        // this.arena.remove(this.clients[id]);
        this.room.remove(this.clients[id]);
        this.room.remove(this.clients[id], "/");
        this.clients[id].emitEvent("close", this.clients[id].room);
        delete this.clients[id];
        console.log(`Socket [${id}] finally deleted`);
    }
}


Client.prototype.destroyAll = function () {

}