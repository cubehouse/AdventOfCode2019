const { performance } = require('perf_hooks');
const terminalkit = require('terminal-kit');
const util = require('util');

const Vector2D = require('./vector2d');

const term = terminalkit.terminal;

class Screen {
    constructor({fps = 30}) {
        // tick manager
        this.ticks = [];
        this.lastFrameTime = 0;
        this.fps = fps;
        this.shutdown = false;

        term.on('resize', this.OnResize.bind(this));

        this.consoleWidth = 40;

        this.draws = [];
        this.requestRedraw = true;

        // setup screen
        term.fullscreen(true);

        // intercept console log
        this.console = [];
        this.screenBuffer = new terminalkit.ScreenBuffer({
            dst: term,
        });
        this.consoleBuffer = new terminalkit.TextBuffer({
            dst: this.screenBuffer,
        });
        this.consoleRedraw = true;
        console.log = (...args) => {
            this.console.push(util.inspect(...args));
            this.console.splice(0, this.console.length - term.height);
            this.consoleBuffer.setText(this.console.join('\n'));
            this.consoleRedraw = true;
        };

        // grid buffer
        this.grid = {};
        this.gridDraws = [];
        this.gridPanel = new terminalkit.ScreenBuffer({
            dst: term,
        });
        this.gridRedraw = true;

        // start ticks!
        setTimeout(this.Tick.bind(this), 0);
    }

    OnResize() {
        this.requestRedraw = true;
    }

    Set(x, y, char, attr) {
        const key = `${x}_${y}`;
        if (this.grid[key] === undefined) {
            this.grid[key] = {
                x: x,
                y: y,
                attr: {},
            };
        }
        const obj = this.grid[key];
        obj.char = char;
        if (attr) {
            Object.keys(attr).forEach((k) => {
                obj.attr[k] = attr[k];
            });
        }

        this.gridDraws.push(key);
        
        this.gridRedraw = true;
    }

    GenDrawsFrame() {
        // frame covers all by the right-most consoleWidth chars
        const frameWidth = term.width - this.consoleWidth;

        const draws = [];
        
        const horzBar = '═'.repeat(frameWidth - 2);
        draws.push({
            char: '╔' + horzBar + '╗',
            pos: new Vector2D(1, 1),
        });
        draws.push({
            char: '╚' + horzBar + '╝',
            pos: new Vector2D(1, term.height),
        });
        
        for(let y = 2; y < term.height; y++) {
            draws.push({
                char: '║',
                pos: new Vector2D(1, y),
            });
            draws.push({
                char: '║',
                pos: new Vector2D(frameWidth, y),
            });
        }
        return draws;
    }

    Draw() {
        if (this.requestRedraw) {
            term.clear();

            // generate all draw calls again when refresh needed
            this.draws.push(...this.GenDrawsFrame());
            
            // resize our console buffer
            this.screenBuffer.x = term.width - this.consoleWidth + 1;
            this.screenBuffer.y = 1;
            this.screenBuffer.width = this.consoleWidth;
            this.screenBuffer.height = term.height;
            this.consoleRedraw = true;
            this.console.splice(0, this.console.length - term.height);

            this.gridPanel.x = 2;
            this.gridPanel.y = 2;
            this.gridPanel.height = term.height - 2;
            this.gridPanel.width = term.width - this.consoleWidth - 2;
            this.gridPanel.clear();
            this.gridRedraw = true;

            this.requestRedraw = false;
        }

        this.draws.forEach((draw) => {
            term.moveTo(draw.pos.x, draw.pos.y, draw.char);
        });
        this.draws.splice(0, this.draws.length);

        if (this.gridRedraw) {
            this.gridDraws.forEach((drawKey) => {
                const draw = this.grid[drawKey];
                this.gridPanel.put({
                    x: draw.x,
                    y: draw.y,
                    attr: draw.attr,
                }, draw.char);
            });

            this.gridPanel.draw();
            this.gridRedraw = false;
        }

        if (this.consoleRedraw) {
            this.consoleBuffer.draw();
            this.screenBuffer.draw();
            this.consoleRedraw = false;
        }
    }

    AddTick(func) {
        this.ticks.push(func);
    }

    Tick() {
        if (this.shutdown) return;

        // generate rough time delta
        const now = performance.now();
        const timeDelta = now - this.lastFrameTime;
        this.lastFrameTime = now;
        
        // tick all registered ticks
        this.ticks.forEach((tick) => {
            tick(timeDelta);
        });

        this.Draw();
        
        // schedule next frame to try and roughly maintain target FPS
        const nextFrame = Math.max(0, (1000 / this.fps) - (performance.now() - now));
        setTimeout(this.Tick.bind(this), nextFrame);
    }

    Stop() {
        this.ticks = [];
        term.fullscreen(false);
        this.shutdown = true;
    }
}

module.exports = Screen;

if (!module.parent) {
    const S = new Screen({
        fps: 5,
    });
    S.Set(0, 0, 'X');
    S.Set(0, 1, '|');
    S.Set(0, 2, '|');
    S.Set(1, 2, '-');
    console.log('Test');
}
