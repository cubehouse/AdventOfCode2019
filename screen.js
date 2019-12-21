
const { performance } = require('perf_hooks');
const EventEmitter = require('events');
const blessed = require('blessed');
const path = require('path');
const util = require('util');

class Screen extends EventEmitter {
    constructor({fps} = {}) {
        super();

        this.Grid = {};

        this.draws = [];

        this.minX = null;
        this.minY = null;
        this.maxX = null;
        this.maxY = null;

        this.log = [];
        this.logWidth = 80;
        this.logRedraw = false;

        this.screen = blessed.screen({
            smartCSR: true,
        });
        this.logBox = blessed.text({
            top: 0,
            right: 0,
            width: this.logWidth || 80,
            height: '100%',
            border: {
                type: 'line'
            },
            style: {
                fg: 'white',
                bg: 'black',
                border: {
                    fg: '#ffa500'
                },
            },
        });
        this.screen.append(this.logBox);
        
        console.log = (...args) => {
            //console.error.apply(this, args);
            if (args.length > 0) {
                this.logBox.unshiftLine(args.map(util.inspect).join(' '));
                this.logRedraw = true;
                this.Draw();
            }
        };

        this.mapBox = blessed.box({
            top: 0,
            right: this.logWidth,
            width: "100%",
            scrollable: true,
        });
        this.screen.append(this.mapBox);
        this.mapLines = {};
        
        this.fps = fps || 60;
        this.lastFrameTime = performance.now();
        this.ticks = [];

        process.stdout.on('resize', this.OnResize.bind(this));
        this.OnResize();

        this.screen.key(['escape', 'q', 'C-c'], () => {
            process.exit(0);
        });
        
        // start ticking
        setTimeout(this.Tick.bind(this), 0);

        this.screen.render();
    }

    Clear() {
        Object.keys(this.Grid).forEach((k) => {
            delete this.Grid[k];
        });
        Object.keys(this.mapLines).forEach((k) => {
            delete this.mapLines[k];
        });
        this.draws.splice(0, this.draws.length);
        this.minX = null;
        this.minY = null;
        this.maxX = null;
        this.maxY = null;

        this.mapBox.setContent('');
    }

    Redraw() {
        this.draws.splice(0, this.draws.length);
        for(let y=this.minY; y<=this.maxY; y++) {
            this.draws.push(y);
        }
    }

    OnResize() {
        this.width = process.stdout.columns;
        this.frameWidth = this.width - this.logWidth;
        this.height = process.stdout.rows;
        this.Redraw();

        this.emit('resize', this.width, this.height);
    }

    GetKey(x, y, key) {
        const cell = this.Get(x, y);
        if (cell === undefined) return undefined;
        return cell[key];
    }

    Get(x, y) {
        return this.Grid[`${x}_${y}`];
    }

    Set(x, y, char) {
        return this.SetKey(x, y, 'val', char);
    }

    SetKey(x, y, key, val) {
        const gridKey = `${x}_${y}`;

        if (this.Grid[gridKey] === undefined) {
            this.Grid[gridKey] = {
                x,
                y,
            };
        }

        this.Grid[gridKey][key] = val;

        if (key === 'val') {
            if (this.mapLines[y] === undefined) {
                this.mapLines[y] = '';
            }
            if (this.mapLines[y].length < x) {
                this.mapLines[y] = this.mapLines[y] + ' '.repeat(x - this.mapLines[y].length);
            }
            this.mapLines[y] = this.mapLines[y].substr(0, x) + val + this.mapLines[y].substr(x + 1);

            if (this.minX === null || this.minX > x || this.minY > y || this.maxX < x || this.maxY < y) {
                this.minX = Math.min(x, this.minX);
                this.minY = Math.min(y, this.minY);
                this.maxX = Math.max(x, this.maxX);
                this.maxY = Math.max(y, this.maxY);

                this.Redraw();
            } else {
                this.draws.push(y);
            }
        }
    }

    Draw() {
        if (this.draws.length === 0 && !this.logRedraw) return;

        const boxWidth = this.screen.width - this.logWidth;
        this.draws.forEach((y) => {
            const frameY = y - this.minY;
            if (this.mapLines[y]) {
                this.mapBox.setBaseLine(frameY, this.mapLines[y].substr(0, boxWidth));
            } else {
                this.mapBox.setBaseLine(frameY, '');
            }
        });

        // clear our draw list
        this.draws.splice(0, this.draws.length);

        this.screen.render();
        
        this.logRedraw = false;
    }

    Tick() {
        // generate rough time delta
        const now = performance.now();
        const timeDelta = now - this.lastFrameTime;
        this.lastFrameTime = now;
        
        // tick all registered ticks
        this.ticks.forEach((tick) => {
            tick(timeDelta);
        });
        
        this.emit('tick', timeDelta);

        this.Draw();
        
        // schedule next frame to try and roughly maintain target FPS
        const nextFrame = Math.max(0, (1000 / this.fps) - (performance.now() - now));
        setTimeout(this.Tick.bind(this), nextFrame);
    }
}

module.exports = Screen;