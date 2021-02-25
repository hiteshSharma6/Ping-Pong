function Player(id, width, height, showBorder) {
    this.id = id;
    this.width = width;
    this.height = height;
    this.color = null;
    this.x = 0;
    this.y = 0;
    this.thick = 0.01;
    this.long = 0.2;
    this.move = false;
    this.graphics = new PIXI.Graphics();
    this.showBorder = showBorder;
}


Player.prototype.setPos = function (x, y) {
    this.x = x;
    this.y = y;
}


Player.prototype.setColor = function (color) {
    this.color = color;
}


Player.prototype.draw = function () {
    this.graphics.clear();
    if(this.showBorder)
        this.graphics.lineStyle(this.thick*this.width/10, 0xffffff, 1);
    this.graphics.beginFill(this.color, 0.7);
    this.graphics.drawRoundedRect(
        this.width * this.x,
        this.height * this.y,
        this.width * this.thick,
        this.height * this.long,
        this.width / 200
    );
    this.graphics.endFill();
}


Player.prototype.update = function (state) {
    this.setPos(state.x, state.y);
    this.draw();
}


Player.prototype.attributes = function () {
    return {
        id: this.id,
        left: this.x,
        right: this.x + this.thick,
        top: this.y,
        bottom: this.y + this.long
    }
}


Player.prototype.moveUp = function () {
    if (this.y <= 0.01 || !this.move)
        return false;
    return {
        id: this.id,
        x: this.x,
        y: this.y - 0.02
    }
}

Player.prototype.moveDown = function () {
    if (this.y >= 0.99 - this.long || !this.move)
        return false;
    return {
        id: this.id,
        x: this.x,
        y: this.y + 0.02
    }
}
