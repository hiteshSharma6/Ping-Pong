const util = require('util');
const EventEmitter = require('events');
const hash = require('./hash');


module.exports = exports = Room;

const state = {
    "CREATE": "0",
    "UNTIL_INITIATE": "1",
    "INITIATE": "2",
    "UNTIL_START": "3",
    "START": "4",
    "END": "5"
};
exports.state = state;


const doStateCheck = function (id) {

    let stateNow = null;

    if (id === "/")
        return stateNow;

    switch (this.rooms[id].state) {

        case state.CREATE:
            stateNow = "CREATE";
            console.log(`\t --- ROOM [${id}] STATE : CREATE ---`);

            // if (this.rooms[id].stable) {
            this.emit(state.CREATE, id);
            this.rooms[id].stable = false;
            // console.log(`\t --- Room [${id}] state changed to UNTIL_INITIATE`)
            obj = this.nextState(id);
            this.rooms[id].stable = true;
            // }
            break;

        case state.UNTIL_INITIATE:
            stateNow = "UNTIL_INITIATE";
            console.log(`\t --- ROOM [${id}] STATE : UNTIL_INITIATE ---`);
            if (this.rooms[id].stable)
                this.emit(state.UNTIL_INITIATE, id);
            if (this.rooms[id].sockets.length === this.config.min_players) {
                // console.log(`\t --- Room [${id}] state changed to INITIATE`)
                // this.rooms[id].stable = false;
                // id don't work properly, use setTimeout(()=>{},0)
                obj = this.nextState(id);
                // this.rooms[id].stable = true;
            }
            break;

        case state.INITIATE:
            stateNow = "INITIATE";
            console.log(`\t --- ROOM [${id}] STATE : INITIATE ---`);
            // if (this.rooms[id].stable) {
            this.emit(state.INITIATE, id);
            this.rooms[id].stable = false;
            // console.log(`\t --- Room [${id}] state changed to UNTIL_START`)
            obj = this.nextState(id);
            this.rooms[id].stable = true;
            // }
            break;

        case state.UNTIL_START:
            stateNow = "UNTIL_START";
            console.log(`\t --- ROOM [${id}] STATE : UNTIL_START ---`);
            let count = this.config.starts_in;
            if (this.rooms[id].stable) {
                // this.rooms[id].stable = false;
                this.emit(state.UNTIL_START, id, count);
            } else {
                const interval = setInterval(() => {
                    --count;
                }, 1000);
                setTimeout(() => {
                    // this.rooms[id].stable = true;
                    clearInterval(interval);
                    // console.log(`\t --- Room [${id}] state changed to START`)
                    obj = this.nextState(id);
                }, this.config.starts_in * 1000);
            }
            break;

        case state.START:
            stateNow = "START";
            console.log(`\t --- ROOM [${id}] STATE : START ---`);
            // if (this.rooms[id].stable) {
            this.emit(state.START, id);
            // }
            break;

        case state.END:
            stateNow = "END";
            console.log(`\t --- ROOM [${id}] STATE : END ---`);
            // if (this.rooms[id].stable) {
            this.emit(state.END, id);
            // }
            break;

        default:
            console.log("Unknown state", id);
            // this.emit("end", id, "terminate", "Unknown state --- terminating unnaturally");
            stateNow = undefined;
    }

    return stateNow;
}


function Room(config) {
    EventEmitter.call(this);
    this.config = config;
    this.rooms = {}; // {id1: {sockets:[], state: string}, id2: []}
}

util.inherits(Room, EventEmitter);


Room.prototype.initials = function (id) {
    return {
        sockets: [],
        state: state.CREATE,
        stable: true
    };
}


/**
 * Assigns the specified room if socket is not present in any room already.
 * @returns {{id, reason}} id: room id
 */
Room.prototype.assignRoom = function (id, socket) {
    const obj = {
        id: null,
        reason: null
    };

    if (typeof id === "string" && typeof socket === "object") {

        if (this.rooms[id] || !this.config.room_required) {
            if (!this.rooms[id])
                id = this.createNewRoom(id);
            if (this.rooms[id].sockets.length < this.config.max_players || id === "/") {
                if (this.rooms[id].state < 4) {
                    if (socket.id) {
                        if (!socket.room) {
                            this.rooms[id].sockets.push(socket.id);
                            obj.id = id;
                            obj.reason = "Socket assigned to the specified room";
                            if (id !== "/") {
                                socket.room = id;
                                console.log(`Room [${id}] assigned to socket`);
                                doStateCheck.call(this, id);
                            }
                            return obj;
                        }

                        obj.reason = "Socket was already assigned to a room. Cannot join multiple rooms";
                        return obj;
                    }

                    obj.reason = "Socket object is not correct. Id not found";
                    return obj;
                }

                obj.reason = " Socket cannot join the room. Room has started execution";
                return obj;
            }

            obj.reason = "Socket cannot join the room. Room is filled";
            return obj;
        }

        obj.reason = "Socket cannot join the room. No such room exist";
        return obj;

    } else if (typeof id === "object" && !socket) {
        return this.assignRoomTo(id);
    }

    obj.reason = "Invalid room id(should be string) or socket(should be socket object) received"
    return obj;
}


/**
 * Automatically assign an unfilled room. Else a new room is created and assigned.
 * Returns the obj{id, reason}
 */
Room.prototype.assignRoomTo = function (socket) {
    let obj = {
        id: null,
        reason: null
    };

    if (!socket.room) {

        // if (!this.config.auto_join) {
        //     obj = this.assignRoom("/", socket);
        //     obj.reason = "Socket has successfully joined";
        //     return obj;
        // }

        for (let id in this.rooms) {
            if (id === "/") continue;
            obj = this.assignRoom(id, socket);
            if (obj.id) {
                obj.reason = "Socket assigned to an old room";
                return obj;
            }
        }

        obj = this.assignNewRoom(socket);
        return obj;
    }

    obj.reason = "Socket was already assigned to a room. Cannot join multiple rooms";
    return obj;
}


/**
 * Assignes a new room to the socket forcefully.
 * If socket is already in another room, it leaves it.
 * @returns {string} room ID
 */
Room.prototype.assignNewRoom = function (id, socket) {
    let obj = {
        id: null,
        reason: null
    };

    if (typeof id === "object" && !socket) {
        socket = id;
        if (!this.config.create_room_auto) {
            obj.reason = "Socket cannot be assigned a new room. Room is not created automatically"
            return obj;
        }
        id = this.createNewRoom();
        obj.id = id;
        obj.reason = "Socket assigned to the newly created room";
    }

    if (socket.room)
        this.remove(socket);

    obj = obj.reason ? (this.assignRoom(id, socket), obj) : this.assignRoom(id, socket);
    return obj;
}


/**
 * @returns {string} room id of the created room
 */
Room.prototype.createNewRoom = function (id) {
    id = id || hash.randomHash();
    this.rooms[id] = this.initials();
    console.log(`New room [${id}] created`);
    doStateCheck.call(this, id);
    return id;
}


/**
 * The input can be a socket object or a room id.
 */
Room.prototype.getSockets = function (input) {
    // console.log(this.rooms);
    const id = input.room || input;
    if (id) // because socket may or may not be assigned any room.
        if(this.rooms[id])
            return this.rooms[id].sockets;
}


Room.prototype.nextState = function (id, newState) {
    if (!this.rooms[id]) return;
    if (newState)
        this.rooms[id].state = newState;
    else
        this.rooms[id].state = (++this.rooms[id].state).toString();
    return doStateCheck.call(this, id);
}


Room.prototype.remove = function (socket, id) {
    if (socket.id) {
        id = id || socket.room;
        if (id) {
            const index = this.rooms[id].sockets.indexOf(socket.id);
            if (index > -1) {
                this.rooms[id].sockets.splice(index, 1);
                console.log(`Socket [${socket.id}] removed from room [${id}]`);
                if (this.rooms[id].sockets.length === 0 && id !== "/")
                    this.destroy(id);
                return true;
            } else {
                console.log(`Socket not removed from room [${id}]. Socket not in room`);
                return false;
            }
        }
        console.log("Cannot remove socket from room. No such room exists");
        return false;
    }
    console.log("Cannot remove socket from room. No such socket exists");
    return false;
}


Room.prototype.destroy = function (id) {
    delete this.rooms[id];
    console.log(`Room [${id}] deleted forcefully or room is empty`);
    return id;
}