var Game = {
    display: null,
    map: {},
    engine: null,
    player: null,
    ananas: null,

    init: function () {
        let options = {
            fontSize: 20,
            fontFamily: "metrickal, monospace"
        };

        this.display = new ROT.Display(options);
        document.body.appendChild(this.display.getContainer());

        let context = document.createElement("canvas").getContext("2d");
        context.font = "10px metrickal, monospace";

        this._generateMap();

        var scheduler = new ROT.Scheduler.Simple();
        scheduler.add(this.player, true);

        this.engine = new ROT.Engine(scheduler);
        this.engine.start();
    },

    _generateMap: function () {
        var digger = new ROT.Map.Digger();
        var freeCells = [];

        var digCallback = function (x, y, value) {
            if (value) { return; } /* do not store walls */

            var key = x + "," + y;
            freeCells.push(key);
            this.map[key] = ".";
        }
        digger.create(digCallback.bind(this));

        this._generateBoxes(freeCells);
        this._drawWholeMap();
        this._createPlayer(freeCells);
    },

    _drawWholeMap: function () {
        for (var key in this.map) {
            var parts = key.split(",");
            var x = parseInt(parts[0]);
            var y = parseInt(parts[1]);
            this.display.draw(x, y, this.map[key]);
        }
    },

    _generateBoxes: function (freeCells) {
        for (var i = 0; i < 10; i++) {
            var index = Math.floor(ROT.RNG.getUniform() * freeCells.length);
            var key = freeCells.splice(index, 1)[0];
            this.map[key] = "*";
            if (!i) {
                this.ananas = key;
            }
        }
    },

    _createPlayer: function (freeCells) {
        var index = Math.floor(ROT.RNG.getUniform() * freeCells.length);
        var key = freeCells.splice(index, 1)[0];
        var parts = key.split(",");
        var x = parseInt(parts[0]);
        var y = parseInt(parts[1]);
        this.player = new Player(x, y);
    }
}

var Player = function (x, y) {
    this._x = x;
    this._y = y;
    this._draw();
}

Player.prototype._draw = function () {
    Game.display.draw(this._x, this._y, "@", "#ff0");
}

Player.prototype.act = function () {
    Game.engine.lock();
    /* wait for user input; do stuff when user hits a key */
    window.addEventListener("keydown", this);
}

Player.prototype.handleEvent = function (e) {
    /* process user input */
    var keyMap = {};
    keyMap[38] = 0; // up arrow
    keyMap[33] = 1; // page up (up right)
    keyMap[39] = 2; // right arrow
    keyMap[34] = 3; // page down (down right)
    keyMap[40] = 4; // down arrow
    keyMap[35] = 5; // end (down left)
    keyMap[37] = 6; // left arrow
    keyMap[36] = 7; // home (up left)

    var code = e.keyCode;

    if (code == 13 || code == 32) { // 13 = Enter & 32 = Space
        this._checkBox();
        return;
    }

    if (!(code in keyMap)) { return; }

    var diff = ROT.DIRS[8][keyMap[code]];
    var newX = this._x + diff[0];
    var newY = this._y + diff[1];

    var newKey = newX + "," + newY;
    if (!(newKey in Game.map)) { return; } /* cannot move in this direction */

    Game.display.draw(this._x, this._y, Game.map[this._x + "," + this._y]);
    this._x = newX;
    this._y = newY;
    this._draw();
    window.removeEventListener("keydown", this);
    Game.engine.unlock();
}

Player.prototype._checkBox = function () {
    var key = this._x + "," + this._y;
    if (Game.map[key] != "*") {
        alert("There is no box here!");
    } else if (key == Game.ananas) {
        alert("Hooray! You found a pineapple and won this game.");
        Game.engine.lock();
        window.removeEventListener("keydown", this);
    } else {
        alert("This box is empty :-(");
    }
}