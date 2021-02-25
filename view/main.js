/**
 * Fixed socket methods - 
 * error, open, close
 */

const socket = new Socket('ws://192.168.0.95:8000');
const arena = new Arena(window.innerWidth - 100, window.innerWidth / 2.5);


socket.on(state.UNTIL_INITIATE, function (data) {
    console.log(data + " in the room");
    createLoader();
});

socket.on(state.INITIATE, function (players) {
    fadeOut("loader");
    setTimeout(() => {
        deleteElement("loader");
        p1 = arena.newPlayer(players[0]);
        p2 = arena.newPlayer(players[1]);
        createMatch(p1, p2, socket.id);
    }, 1000);
    console.log("INITIATE", players);
});


socket.on(state.START, function (layout) {
    fadeOut("match");
    setTimeout(() => {
        deleteElement("match");
        arena.initialize(layout.id, socket);
        const props = Object.getOwnPropertyNames(layout.players);
        const p1Rec = layout.players[props[0]];
        const p2Rec = layout.players[props[1]];
        // p1 = arena.newPlayer(p1Rec.id);
        // p2 = arena.newPlayer(p2Rec.id);
        arena.updatePlayer(p1Rec);
        arena.updatePlayer(p2Rec);
        arena.newBall();
        arena.updateBall(layout.ball);

        socket.emit("loaded", layout.id);
        // const time = arena.startCountdown();
        // setTimeout(()=>arena.start(), time);

        document.querySelector('canvas').setAttribute("tabindex", 1);
        document.querySelector('canvas').focus();

        document.querySelector("canvas").addEventListener("keypress", event => {
            let dir = "";
            switch (event.key) {
                case "w":
                case "W":
                    dir = "up";
                    break;
                case "s":
                case "S":
                    dir = "down";
                    break;
            }

            if (move = arena.onMove(dir, socket.id)) {
                socket.emit("move", {
                    id: layout.id,
                    player: move
                })
            }
        });

    }, 1000);


    socket.on("startCountdown", function () {
        arena.startCountdown();
    });

    socket.on("startGame", function () {
        arena.start();
    })

    socket.on("updatePlayer", function (player) {
        arena.updatePlayer(player);
    });

    socket.on("updateBall", function (ball) {
        console.log("ball update", ball);
        arena.updateBall(ball);
    });

    socket.on("playerLeft", player => {
        arena.end(`Your opponent [${player}] left... YOU WIN`);
        arena.declareWinner(socket.id);
    });

    socket.on("gameEnd", (data) => {
        console.log("game Ended:", data);
        arena.end(`Winner is ${data.winner}. ${data.message}`);
    });

});

socket.on("open", function () {
    console.log("Connection Opened");
});

socket.on("close", function (event) {
    console.log(event);
    arena.end("Connection Lost");
});