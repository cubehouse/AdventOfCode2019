const term = require('terminal-kit').terminal;
const Advent = new (require('./index.js'))(13, 2019);
const Intcode = require('./intcode');


class Arcade {
    constructor(PC) {
        this.PC = PC;

        term.fullscreen(true);
        term.clear();
        this.maxY = 0;

        this.Grid = {};
    }

    DrawObj(obj) {
        term.defaultColor();
        switch(obj) {
            case 0:
                // empty
                term(' ');
                break;
            case 1:
                // wall
                term.red('#');
                break;
            case 2:
                // block
                term.blue('$');
                break;
            case 3:
                // paddle
                term.cyan('-');
                break;
            case 4:
                // ball
                term.white('*');
                break;
        }
    }

    Draw(x, y, obj) {
        term.moveTo(x + 1, y + 1);
        this.Grid[`${x}_${y}`] = obj;
        this.DrawObj(obj);

        this.maxY = Math.max(this.maxY, y);
        term.moveTo(0, this.maxY + 3);
    }

    BlocksLeft() {
        return Object.keys(this.Grid).reduce((p, cell) => {
            return p + ((this.Grid[cell] === 2) ? 1 : 0);
        }, 0);
    }

    DrawTile() {
        return this.PC.GetOutput().then((x) => {
            return this.PC.GetOutput().then((y) => {
                return this.PC.GetOutput().then((tile) => {
                    this.Draw(x, y, tile);
                    return Promise.resolve();
                });
            });
        });
    }

    Run() {
        const StepChunks = 100;
        const Step = (rec = 0) => {
            this.DrawTile().then(() => {
                if (rec > StepChunks) {
                    process.nextTick(Step);
                } else {
                    Step(rec++);
                }
            });
        };
        Step();

        return this.PC.Run();
    }
}

Advent.GetInput().then((input) => {
    const Part1 = new Arcade(new Intcode(input));

    return Part1.Run().then(() => {
        // count blocks
        const blocks = Part1.BlocksLeft();

        return Advent.Submit(blocks).then(() => {
            console.log('Done!');
        });
    });

}).catch((e) => {
    console.log(e);
});