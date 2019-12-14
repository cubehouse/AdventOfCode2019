const term = require('terminal-kit').terminal;
const TextBuffer = require('terminal-kit').TextBuffer;
const Advent = new (require('./index.js'))(13, 2019);
const Intcode = require('./intcode');


class Arcade {
    constructor(PC, debug = false) {
        this.PC = PC;

        term.clear();
        term.reset();

        this.maxY = 0;
        this.maxX = 0;

        this.Grid = {};

        this.text = [];
        this.textDebug = debug;

        this.ballPos = {x: 0, y: 0};
        this.ballVelocity = {};
        this.paddlePos = {x: 0, y: 0};

        this.score = 0;
    }

    DrawObj(obj, x, y) {
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
                term.blue('X');
                break;
            case 3:
                // paddle
                term.cyan('=');
                this.paddlePos = {
                    x: x,
                    y: y,
                };
                break;
            case 4:
                // ball
                term.white('.');
                if (this.ballPos.x !== 0) {
                    this.ballVelocity = {x: x - this.ballPos.x, y: y - this.ballPos.y};
                }
                this.ballPos.x = x;
                this.ballPos.y = y;
                break;
        }
    }

    Draw(x, y, obj) {
        if (x === -1 && y === 0) {
            this.score = obj;
            term.moveTo(1, 0, `Score: ${this.score}`);
        } else {
            term.moveTo(x + 2, y + 2);
            this.Grid[`${x}_${y}`] = obj;
            this.DrawObj(obj, x, y);
        }

        this.maxY = Math.max(this.maxY, y);
        if (x > this.maxX) {
            this.maxX = x;
            this.RedrawText();
        }
        term.moveTo(0, this.maxY + 5);
    }

    RedrawText() {
        if (!this.textDebug) return;
        term.eraseArea(this.maxX + 3, 1, 80, this.maxY);
        this.text.forEach((str, y) => {
            term.moveTo(this.maxX + 5, this.maxY - y, str);
        });
    }

    Text(str) {
        if (!this.textDebug) return;
        this.text.unshift(JSON.stringify(str));
        if (this.text.length > (this.maxY - 2)) {
            this.text.splice(-1);
        }
        this.RedrawText();
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
        // arcade inputs
        term.grabInput(true);

        const MovePaddle = () => {
            this.Text({
                ball: this.ballPos,
                paddle: this.paddlePos,
            });

            // where should our paddle go?
            let nextFrameBallX = this.ballPos.x + this.ballVelocity.x;
            if (this.ballPos.y === (this.paddlePos.y - 1) && this.ballPos.x === this.paddlePos.x) {
                this.PC.Input(0);
                return;
            }
            if (nextFrameBallX < this.paddlePos.x) {
                this.PC.Input(-1);
            } else if (nextFrameBallX > this.paddlePos.x) {
                this.PC.Input(1);
            } else {
                this.PC.Input(0);
            }
        };
        
        term.on('key', (name) => {
            if (name === 'CTRL_C') {
                process.exit(0);
            }
        });
        this.PC.on('input', () => {
            process.nextTick(MovePaddle);
        });

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
            const Part2 = new Arcade(new Intcode(input));
            // start game
            Part2.PC.memory[0] = 2;

            return Part2.Run().then(() => {
                return Advent.Submit(Part2.score, 2).then(() => {
                    console.log('Done!');
                    process.exit(0);
                });
            });
        });
    });

}).catch((e) => {
    console.log(e);
});