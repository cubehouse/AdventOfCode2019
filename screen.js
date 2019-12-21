
const { performance } = require('perf_hooks');
const EventEmitter = require('events');
const blessed = require('blessed');
const path = require('path');
const util = require('util');

class Screen extends EventEmitter {
    constructor({fps, logWidth} = {}) {
        super();

        this.Grid = {};
        this.styles = [];

        this.draws = [];

        this.minX = null;
        this.minY = null;
        this.maxX = null;
        this.maxY = null;

        this.log = [];
        this.logWidth = logWidth || 80;
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
            tags: true,
        });
        this.screen.append(this.logBox);
        
        console.log = (...args) => {
            if (args.length > 0) {
                this.logBox.unshiftLine(args.map(util.inspect).join(' ') + '{/}');
                this.logRedraw = true;
                this.Draw();
            }
        };

        this.mapBox = blessed.text({
            top: 0,
            right: this.logWidth,
            width: "100%",
            scrollable: true,
            tags: true,
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

    AddStyle(search, style) {
        this.styles.push({
            search: search,
            style,
        });
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
        const cell = this.Grid[gridKey];

        cell[key] = val;

        const redrawCell = (key === 'val') || (key === 'style');

        if (redrawCell) {
            if (this.mapLines[y] === undefined) {
                this.mapLines[y] = [];
            }
            if (this.mapLines[y].length < x) {
                this.mapLines[y] = this.mapLines[y].concat(new Array(x - this.mapLines[y].length));
            }
            this.mapLines[y][x] = cell.val;//cell.style !== undefined ? `${cell.style}${cell.val}{/}` : cell.val;

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

    GenCellString(cell) {
        if (cell.val === undefined) return ' ';
        let val = cell.val;
        this.styles.forEach((s) => {
            // TODO - run each regex over original val, but transplant any results into the built-up result string manually
            if (cell.val.match(s.search)) {
                val = cell.val.replace(s.search, `${s.style}$1{/}`);
            }
        });
        if (cell.style !== undefined) {
            val = `${cell.style}${val}{/}`;
        }
        return val;
    }

    Draw() {
        if (this.draws.length === 0 && !this.logRedraw) return;

        const boxWidth = this.screen.width - this.logWidth;
        this.draws.filter((val, idx, arr) => arr.indexOf(val) === idx).forEach((y) => {
            const frameY = y - this.minY;

            this.mapBox.setBaseLine(frameY, Object.values(this.Grid).filter(x => x.y === y).map(cell => this.GenCellString(cell)).join(''));

            /*if (this.mapLines[y]) {
                let lineStr = this.mapLines[y].slice(0, boxWidth - 1).join('');
                this.styles.forEach((s) => {
                    lineStr = lineStr.replace(s.search, `${s.style}$1{/}`);
                });
                this.mapBox.setBaseLine(frameY, lineStr);
            } else {
                this.mapBox.setBaseLine(frameY, '');
            }*/
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