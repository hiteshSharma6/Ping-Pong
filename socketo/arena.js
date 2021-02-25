const util = require('util');
const EventEmitter = require('events');


module.exports = exports = Arena;


function Arena(client, state) {
    EventEmitter.call(this);

    this.client = client;
    this.state = state;
    this.layouts = {};
}
util.inherits(Arena, EventEmitter);


Arena.prototype.emitState = function (state, room, sockets) {
    // layout = this.newLayout(room);

    this.emit(state, room, sockets);
}


Arena.prototype.newLayout = function (id) {
    const layout = {
        get id() {
            return id;
        },
        name: '',
        // players: {},
    };
    this.layouts[id] = layout;
    console.log(` --- New layout [${id}] created`);
    return layout;
}


Arena.prototype.layout = function (id) {
    return this.layouts[id];
}


Arena.prototype.for = function (id) {
    const self = this;
    return {broadcast: function(event, data) {
        self.client.sendToAll(id, event, data);
    }};
}


Arena.prototype.end = function (id) {
    this.client.endArena(id);
}


// Arena.prototype.remove = function (socket, id) {
//     if (socket.id) {
//         id = id || socket.room;
//         if (id) {
//             if(this.layouts[id]) {
//                 delete this.layouts[id].players[socket.id];
//                 console.log(`Socket [${socket.id}] removed from layout [${id}]`);
//                 if(JSON.stringify(this.layouts[id].players) === JSON.stringify({}))
//                     this.destroy(id);
//                 return true;
//             }
//         }
//         console.log("Cannot remove socket from layout. No such layout exists");
//         return false;
//     }
//     console.log("Cannot remove socket from layout. No such socket exists");
//     return false;
// }

Arena.prototype.remove = function (id) {
    if(this.layouts[id]) {
        delete this.layouts[id];
        console.log(`Layout [${id}] is deleted`);
        return id;    
    }
    console.log(`Layout [${id}] cannot be deleted. No such layout exists`);
}