const events = {};

const state = {
    "CREATE": "0",
    "UNTIL_INITIATE": "1",
    "INITIATE": "2",
    "UNTIL_START": "3",
    "START": "4",
    "END": "5"
};

const Socket = function (url) {
    this._socket = new WebSocket(url);
    this._first = true;
    this.id = null;

    initiate.call(this);
}


Socket.prototype.emit = function (event, data) {
    send.call(this, ({
        event,
        data
    }));
}

Socket.prototype.send =
Socket.prototype.write = function (data) {
    send.call(this, ({
        event: "data",
        data
    }));
}

Socket.prototype.on = function (event, callback) {
    events[event] = callback;
}

Socket.prototype.close = function (errCode) {
    const id = setInterval(() => {
        if (event.currentTarget.bufferedAmount === 0) {
            console.log("Closing connection", event.currentTarget);
            this._socket.close();
            clearInterval(id);
            return;
        }
    }, 1000);
}


function initiate() {
    const self = this;
    this._socket.onopen = function (event) {
        if (events["open"])
            events["open"](event);
        onOpen.call(self);
    };
}


function send(obj) {
    obj.id = this.id;
    // console.log("Object Send: ", obj);
    data = JSON.stringify(obj);
    this._socket.send(data);
}


function onOpen() {
    const self = this;

    this._socket.onmessage = function (event) {
        const obj = JSON.parse(event.data);
        onMessage.call(self, obj);
    }

    this._socket.onclose = function (event) {
        console.log("Connection lost...");
        console.info("Socket closing", event.code, event.reason);
        if (events["close"])
            events["close"]({
                code: event.code,
                reason: event.reason
            });
    }

    this._socket.onerror = function (event) {
        console.error("Error occured", event);
        if (events["error"])
            events["error"](event);
    }
}


function onMessage(obj) {

    /*
    * This code is to confirm the id received by sending it back.
    * Only after it is verified by server, you will connect.
    * 
    * This can be further used when a client reconnects and gets assigned a new id
    * but wants to join in with its old id.
    }
    */
    if (this._first) {
        this._first = false;
        if (obj.assignedId) {
            console.log("ID received::", obj);
            this.id = obj.assignedId;
            // this._socket.send({});
            return;
        }
        console.log("Closing connection.....");
        this.socket.close(1000, "ClientID not received / Incorrect clientID");
        return;
    }

    // if(obj.assignedId) {
    //     this.id = obj.id;
    //     console.log(obj.id);
    // //    console.log("ID:", this);
    //    return;
    // }

    if (events[obj.event])
        events[obj.event](obj.data);
    // console.log(obj.data);
}