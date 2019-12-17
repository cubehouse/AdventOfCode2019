const { performance } = require('perf_hooks');
const terminalkit = require('terminal-kit');

const Vector2D = require('./vector2d');

const term = terminalkit.terminal;

class Screen {
    constructor({fps = 30}) {
        // tick manager
        this.ticks = [];
        this.lastFrameTime = 0;
        this.fps = fps;
        this.shutdown = false;

        // setup screen
        term.fullscreen(true);

        // start ticks!
        setTimeout(this.Tick.bind(this), 0);
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
        fps: 15,
    });

    setTimeout(() => {
        S.Stop();
    }, 3000);
}