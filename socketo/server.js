const util = require('util');
const EventEmitter = require('events');
const frame = require('./frame');
const hash = require('./hash');
const Client = require('./client');
const Arena = require('./arena');


module.exports = exports = Socketo;

exports.Arena = Arena;


const handshake = (socket, key) => {
	const secAccKey = hash.getSHA1Hex(key, "258EAFA5-E914-47DA-95CA-C5AB0DC85B11");
	socket.write('HTTP/1.1 101 Switching Protocols\r\n' +
		'Upgrade: websocket\r\n' +
		'Connection: Upgrade\r\n' +
		'Sec-WebSocket-Accept: ' + secAccKey + '\r\n' +
		// 'Sec-WebSocket-Extensions: \r\n' +
		// 'Sec-WebSocket-Protocol: soap\r\n' +
		'\r\n');
}


const initialize = function (req, socket) {

	socket.address = socket.remoteAddress;
	socket.port = socket.remotePort;

	handshake(socket, req.headers["sec-websocket-key"]);

	client.newConnection(socket);


	/**
	 * Sending id as object.
	 * When authenticating the Socket, there is a need to handle it.
	 * Also there willbe further changes if Socket reconnects - {id, oldId}
	 */

}


const onStart = (server) => {
	client = new Client(server, server.config);
	client.initialize();
	console.log("WEBSOCKET SERVER INITIALIZED");
}


const append = (myConfig, config) => {
	for (key in config) {
		if (myConfig.hasOwnProperty(key)) {
			myConfig[key] = config[key];
		}
	}
}


function Socketo(server, config) {
	EventEmitter.call(this);

	let self = this;
	// this.state = null;

	this.config = {

		// if true, sockets join a room automatically
		auto_join: true,

		// if true, the rooms are created and deleted automatically acc. to its content
		// not recommended -- management of rooms will be difficult, resulting in memory issues for bigger spaces
		// not stable for now
		create_room_auto: true,

		// the minimum number of players required to go to the next state (INITIATE) of the room.
		min_players: 1,

		// the maximun number of players that can join a room.
		max_players: 1,

		// if room needs to be created beforehand to be assigned
		// if create_room_auto is false, then room has to be created by you
		// if room is not required beforehand and create_room_auto is false, even then you can assign your own room
		room_required: true,

		// shows the internal logs when true
		showLogs: true,

		// the number of seconds after which the state and content of the room cannot change.
		starts_in: 5,

		// Use the default internal room states to manage the rooms.
		// In case it is false, then their will no check of states and you have emit state changes on your own.
		// Ex. if your room state changes from 'Initiate' to 'Start' after some time, then you need to implement it on your own.
		// Not recommended
		// use_default_states: true

		// Sets the client to be removed from server after specified timeout(in seconds) of inactivity.after the START state.
		// If the value id zero, then timeout is a long one as per the http server.
		timeout: 0

	}

	append(this.config, config);
	onStart(this);

	server.on('upgrade', (req, socket, head) => {

		initialize.call(self, req, socket);

		socket.on('data', (buffer) => {

			const data = frame.extractData(buffer);

			if (data) {
				console.log(`/* DATA RECEIVED - ${data} */`);
				const obj = JSON.parse(data);
				client.emitEvent(obj);
			} else {
				buffer[0] = 129;
				console.log(buffer);
				const data = frame.extractData(buffer);
				code = parseInt(
					parseInt((buffer[2] ^ buffer[6]), 10).toString(16) +
					parseInt((buffer[3] ^ buffer[7]), 10).toString(16), 16);
				socket.destroy({
					code,
					reason: data.substring(2)
				});
			}

		});

		socket.on("timeout", () => {
			console.log("----------TIMEOUT----------")
			socket.destroy({
				code: 1000,
				reason: "Socket Timeout"
			});
		})

		socket.on("error", (error) => {
			console.error("\tError Code:", error.code, error.reason);
		});

		socket.on("close", (hadError) => {
			console.log("\n----------\nClosing Connection to Socket\n----------");
			client.remove(socket);
			if (hadError)
				console.info(`SOCKET [${socket.address}:${socket.port}] CLOSED because of error...`);
			console.log("----------\n");
		});

	});

}
util.inherits(Socketo, EventEmitter);


Socketo.prototype.broadcast = function (event, data) {
	client.sendToAll("/", event, data);
}


Socketo.prototype.getArena = function () {
	return client.getArena();
}