
const { performance } = require('perf_hooks');
const EventEmitter = require('events');
const blessed = require('blessed');
const program = blessed.program();

class Screen extends EventEmitter {
    constructor({fps} = {}) {
        super();

        this.Grid = {};

        this.draws = [];

        this.minX = null;
        this.minY = null;
        
        this.fps = fps || 30;
        this.lastFrameTime = performance.now();
        this.ticks = [];

        process.stdout.on('resize', this.OnResize.bind(this));
        this.OnResize();
        
        program.alternateBuffer();
        program.enableMouse();
        program.hideCursor();

        program.key(['q', 'C-c'], (ch, key) => {
            program.clear();
            program.disableMouse();
            program.showCursor();
            program.normalBuffer();
            process.exit(0);
        });
        program.on('mouse', (data) => {});
        
        // start ticking
        setTimeout(this.Tick.bind(this), 0);
    }

    Redraw() {
        program.clear();
        this.draws.splice(0, this.draws.length);
        this.draws.push(...Object.values(this.Grid));
    }

    OnResize() {
        this.width = process.stdout.columns;
        this.height = process.stdout.rows;
        this.Redraw();

        this.emit('resize', this.width, this.height);
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
            if (this.minX === null || this.minX > x || this.minY > y) {
                this.minX = Math.min(x, this.minX);
                this.minY = Math.min(y, this.minY);

                this.Redraw();
            } else {
                this.draws.push(this.Grid[gridKey]);
            }
        }
    }

    Draw() {
        if (this.draws.length === 0) return;

        // sort by Y and then X so our cursor move around in order
        this.draws.sort((a ,b) => {
            if (a.y === b.y) {
                return a.x - b.x;
            }
            return a.y - b.y;
        });

        // process all our draw calls
        this.draws.forEach((draw) => {
            program.move(draw.x - this.minX, draw.y - this.minY);
            program.write(draw.val);
        });

        // clear our draw list
        this.draws.splice(0, this.draws.length);
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