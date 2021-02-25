const countNext = function (count) {
    if (count.length === 0)
        return;

    const container = new PIXI.Container();
    this._app.stage.addChild(container);

    const style = new PIXI.TextStyle({
        fontFamily: 'Arial',
        fontSize: 64,
        fontStyle: 'italic',
        fontWeight: 'bold',
        fill: '#4dc5dd',
        dropShadow: true,
        dropShadowColor: '#ffffff',
        dropShadowBlur: 5,
        dropShadowAngle: Math.PI / 6,
        dropShadowDistance: 0,
    });
    const text = new PIXI.Text(count[0], style);
    container.addChild(text);

    let check = true;
    const length = count[0].length;
    const div = (length === 1) ? 10 : 3;
    
    this._app.ticker.add(() => {
        container.x = (this.width/2 - length*this.width/100 - this.width/div*(1-container.alpha));
        container.y = (this.height/2 - this.height/10 - (1-container.alpha)*this.height/3);
        container.scale.x += (this.width-200)/10000;
        container.scale.y += (this.width-200)/10000;
        container.alpha -= 0.02;
        if (container.alpha < 0.4 && check) {
            check = false;
            countNext.call(this, count.slice(1));
        }
    });
}


function Arena(width, height) {
    this._id = null;
    this._socket = null;
    this._app = null;
    this.width = width;
    this.height = height;
    this.oneMoveHor = width / 100;
    this.oneMoveVer = height / 100;
    this.colors = {};
    this._players = {}; // {id: {}}
    this._ball = null;
    this._game = null;
    this._gameEnd = false;
    this._winnerDeclared = false;
    this._collisionDone = false;
}


Arena.prototype.initialize = function (id, socket) {
    this._app = new PIXI.Application({
        antialias: true,
        width: this.width,
        height: this.height,
        backgroundColor: 0x5e5e5e,
        tabindex: 0
    });
    document.body.appendChild(this._app.view);
    this._id = id;
    this._socket = socket;
    if (this._players[socket.id])
        this._players[socket.id].showBorder = true;
}


Arena.prototype.newBall = function () {
    this._ball = new Ball(this.width, this.height);
    this.finalize(this._ball);
    return this._ball;
}


Arena.prototype.newPlayer = function (id) {
    let showBorder = this._socket ? (this._socket.id === id ? true : false) : false;
    const player = new Player(id, this.width, this.height, showBorder);
    this._players[player.id] = player;
    return player;
}


Arena.prototype.onMove = function (dir, input) {
    const id = input.id || input;
    const player = this._players[id];
    switch (dir) {
        case "up":
            return player.moveUp();
        case "down":
            return player.moveDown();
    }
    return false;
}


Arena.prototype.updateBall = function (state) {
    this._ball.update(state);
    this._ball.move = true;
    this._collisionDone = true;
    console.log("123");
    setTimeout(() => {
        this._collisionDone = false;
    }, 500);
}


Arena.prototype.updatePlayer = function (player) {
    const updPlayer = this._players[player.id];
    updPlayer.update(player);
    this.finalize(updPlayer);
}


Arena.prototype.finalize = function (input) {
    this._app.stage.addChild(input.graphics);
}


Arena.prototype.startCountdown = function () {
    const count = ['3', '2', '1', 'start'];

    const container = new PIXI.Container();
    this._app.stage.addChild(container);

    countNext.call(this, count);
}


Arena.prototype.start = function () {
    const props = Object.getOwnPropertyNames(this._players);
    props.forEach(prop => {
        this._players[prop].move = true;
    });
    this._ball.move = true;
    setInterval(() => {
        this._ball.moving();
    }, 5);
    this._game = setInterval(() => {
        this.checkCollision(props);
    }, 5);
}


Arena.prototype.checkCollision = function (props) {
    const ball = this._ball.attributes();
    const p1 = this._players[props[0]].attributes();
    const p2 = this._players[props[1]].attributes();
    if (!this._collisionDone) {
        console.log("asdad");

        if (ball.left <= p1.right || ball.right >= p2.left) {
            console.log("abc");
            this._ball.move = false;
            this._collisionDone = true;
            player = (ball.left <= p1.right) ? p1 : p2;
            if (this._socket.id === player.id) {
                console.log("It's me..")
                this._socket.emit("collision", {
                    id: this._id,
                    ball: {
                        center: ball.center,
                        x: this._ball.x,
                        y: this._ball.y,
                        yDir: this._ball.yDir
                    },
                    player: {
                        id: player.id,
                        top: player.top,
                        bottom: player.bottom
                    }
                });
            }
        }
    }
    if (ball.top <= 0.01)
        this._ball.yDir = 1;
    else if (ball.bottom >= 0.99)
        this._ball.yDir = -1;
}


Arena.prototype.end = function (message) {
    if (!this._gameEnd) {
        this._gameEnd = true;
        this._ball.move = true;
        const props = Object.getOwnPropertyNames(this._players);
        props.forEach(prop => {
            this._players[prop].move = false;
        });
        clearInterval(this._game);
        if (message)
            setTimeout(() => {
                alert(message);
            }, 1000);
    }
}


Arena.prototype.declareWinner = function (id) {
    if (!this._winnerDeclared) {
        this._winnerDeclared = true;
        this._socket.emit("gameEnd", {
            id: this._id,
            winner: id
        });
    }
}