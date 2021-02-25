const http = require('http');
const Socketo = require('./socketo/server');
const fs = require('fs');
const path = require('path');


const server = http.createServer((req, res) => {
	if (req.method.toLowerCase() === "get") {
		if (req.url === "/") {
			res.setHeader('Content-Type', 'text/html; charset=utf-8');
			filePath = path.join(__dirname + "/view/index.html");
			var readStream = fs.createReadStream(filePath);
			readStream.pipe(res);
		} else if (req.url.match(/css/)) {
			res.setHeader('Content-Type', 'text/css; charset=utf-8');
			filePath = path.join(__dirname + "/view" + req.url);
			var readStream = fs.createReadStream(filePath);
			readStream.pipe(res);
		} else if (req.url.match(/js/)) {
			res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
			filePath = path.join(__dirname + "/view" + req.url);
			var readStream = fs.createReadStream(filePath);
			readStream.pipe(res);
		} else {
			res.writeHead(404, {
				"Content-Type": "text/html"
			});
			res.end("No Page Found");
		}
	}
});


server.listen(8000, '0.0.0.0');

const io = new Socketo(server, {
	min_players: 2,
	max_players: 2,
	auto_join: true,
	create_room_auto: true,
	room_required: true,
	showLogs: true,
	starts_in: 0,
	timeout: 20
});


const arena = io.getArena();

arena.on(arena.state.UNTIL_INITIATE, function (id, player) {
	console.log(id, player.id);
	player.emit(arena.state.UNTIL_INITIATE, player.id);
});

arena.on(arena.state.INITIATE, function (id, players) {
	const ids = [];
	players.forEach(player => {
		ids.push(player.id);
	})
	arena.for(id).broadcast(arena.state.INITIATE, ids);
});


arena.on(arena.state.START, function (id, players) {
	const layout = arena.newLayout(id);
	console.log("Current layout:", layout.id);
	let i = 0;
	layout.players = {};
	players.forEach(player => {
		if (i == 0) {
			layout.players[player.id] = {
				id: player.id,
				x: i + 0.01,
				y: 0.5 - 0.1
			};
		} else if (i == 1) {
			layout.players[player.id] = {
				id: player.id,
				x: i - 0.02,
				y: 0.5 - 0.1
			};
		}
		++i;
	});
	layout.players["player.id"] = {
		id: "player.id",
		x: i - 0.02,
		y: 0.5 - 0.1
	};
	let xVel = Math.random();
	xVel = xVel > 0.6 ? 0.6 : xVel;
	// xVel = Math.random() < 0.75 ? -xVel : xVel;
	let yVel = Math.random();
	yVel = yVel > 0.6 ? 0.6 : yVel;
	// yVel = Math.random() < 0.75 ? -yVel : yVel;
	layout.ball = {
		x: 0.5,
		y: 0.5,
		radius: 0.01,
		xVel: 0.4,
		yVel: 0.6,
		xDir: Math.random() > 0.5 ? 1 : -1,
		yDir: Math.random() > 0.5 ? 1 : -1
	}

	setTimeout(() => {
		arena.for(id).broadcast(arena.state.START, layout);
	}, 2000);
});


arena.on(arena.state.END, function (id, players) {
	// console.log(arena.layout(id));
	const layout = arena.layout(id);
	// const props = Object.getOwnPropertyNames(layout.players);
	// props.forEach(prop => {
	players.forEach(player => {
		if (player.id !== layout.loser)
			layout.winner = player.id;
	})
	players.forEach(player => {
		if (player.id === layout.loser)
			player.emit("gameEnd", {
				winner: layout.winner,
				message: 'You lost'
			});
		else
			player.emit("gameEnd", {
				winner: layout.winner,
				message: 'You win'
			});
	})
	// })

	console.log("//////////////");
	console.log("This player won --");
	console.log(layout.winner);
	console.log("//////////////");
	// arena.for(id).broadcast("gameEnd", {
	// 	winner: players[0].id
	// });
});


// room1 = io.createRoom();
// console.log("ROMMMM: ", room1);


io.on("connection", (socket) => {
	// console.log(io.state);
	let i = 0;

	socket.on("data", function (data) {
		console.log("i ::", ++i);
		// console.log("SDAtdta-----------", data);
		// socket.broadcast("data", socket.id+" "+data);
		// let a = 10;
		// const obj = {
		//     get a() {
		//         return a;
		//     }
		// }
		// io.broadcast("message", {id: socket.id, data, obj});
	});
	// socket.on("message", function (data) {
	// 	console.log("===========MESSAGE=== JOPIn");
	// 	console.log("SDAtdta-----------", data);
	// 	socket.join("room1");
	// 	socket.join("room1");
	// 	socket.sendAll("data", socket.id + " " + data);
	// 	io.broadcast("data", socket.id + " " + data);
	// });

	socket.on("loaded", (id) => {
		const layout = arena.layout(id);
		if(layout.countdown)
			return;
		arena.for(id).broadcast("startCountdown");
		layout.countdown = true;
		console.log("HUrray");
		setTimeout(()=>arena.for(id).broadcast("startGame"), 2000);
	});

	socket.on("move", data => {
		// console.log(data);
		const layout = arena.layout(data.id);
		layout.players[data.player.id] = data.player;
		// console.log(layout);
		arena.for(layout.id).broadcast("updatePlayer", data.player);
	});

	socket.on("collision", data => {
		const layout = arena.layout(data.id);
		const player = data.player;
		const ball = data.ball;

		if (player.top < ball.center && ball.center < player.bottom) {
			layout.ball.xDir *= -1;
			if(layout.ball.xVel <= 1.2)
				layout.ball.xVel += 0.05;
			// layout.ball.yVel += 0.5 * (Math.random() > 0.5 ? 1 : -1);
			arena.for(layout.id).broadcast("updateBall", {
				x: data.ball.x,
				y: data.ball.y,
				xDir: layout.ball.xDir,
				xVel: layout.ball.xVel,
				// yVel: layout.ball.yVel
			});
			console.log("yooo")
			return;
		}
		corner = (ball.yDir === 1) ? Math.abs(player.top - ball.center) : Math.abs(player.bottom - ball.center);
		console.log(corner);
		if (corner <= 0.02) {
			layout.ball.xDir *= -1;
			layout.ball.xVel += 0.05;
			layout.ball.yDir = -ball.yDir;
			layout.ball.yVel -= 5 * (0.02-corner);
			arena.for(layout.id).broadcast("updateBall", {
				x: data.ball.x,
				y: data.ball.y,
				xDir: layout.ball.xDir,
				yDir: layout.ball.yDir,
				xVel: layout.ball.xVel,
				yVel: layout.ball.yVel
			});
			console.log("54yooo")
			return;
		}
		if (corner <= 0.035) {
			arena.for(layout.id).broadcast("updateBall", {
				yDir: -ball.yDir,
			});
		}
		layout.loser = data.player.id;
		arena.end(data.id);
	});

	socket.on("gameEnd", data => {
		console.log(data.id);
		console.log(data.winner);
		arena.end(data.id);
	});



	socket.on("close", function (id) {
		console.log("closing");
		const layout = arena.layout(id);
		if (layout) {
			delete layout.players[socket.id];
			socket.broadcast("playerLeft", socket.id);
		}
		// if(layout.playerslength === 1){
		// arena.for(id).broadcast("gameEnd", {
		// 	winner: layout.players[sockets[0].id]
		// });
		// console.log("We have a Winner")
		// arena.end(id);
		// }
	});

});