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

        // start ticks!
        setTimeout(this.Tick.bind(this), 0);
    }

    OnResize() {
        this.requestRedraw = true;
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

            this.requestRedraw = false;
        }

        this.draws.forEach((draw) => {
            term.moveTo(draw.pos.x, draw.pos.y, draw.char);
        });
        this.draws.splice(0, this.draws.length);

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
}
