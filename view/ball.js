function Ball(width, height) {
    this.x = null;
    this.y = null;
    this.radius = null;
    this.width = width;
    this.height = height;
    this.xVel = null;
    this.yVel = null;
    this.xDir = null;
    this.yDir = null;
    this.move = false;
    this.graphics = new PIXI.Graphics();
}


Ball.prototype.draw = function () {
    this.graphics.clear();
    this.graphics.beginFill(0xe8e8e8);
    this.graphics.drawCircle(
        this.width * this.x,
        this.height * this.y,
        this.radius * this.width
    );
    this.graphics.endFill();
}


Ball.prototype.update = function (state) {
    this.x = state.x || this.x;
    this.y = state.y || this.y;
    this.radius = state.radius || this.radius;
    this.xVel = state.xVel || this.xVel;
    this.yVel = state.yVel || this.yVel;
    this.xDir = state.xDir || this.xDir;
    this.yDir = state.yDir || this.yDir;
    this.draw();
}


Ball.prototype.moving = function () {
    if(this.move) {
        this.x += 0.003*this.xDir*this.xVel;
        this.y += 0.003*this.yDir*this.yVel;
        this.draw();
    }
}


Ball.prototype.attributes = function () {
    return {
        left: this.x - this.radius,
        right: this.x + this.radius,
        top: this.y - this.radius,
        bottom: this.y + this.radius,
        center: this.y
    }
}