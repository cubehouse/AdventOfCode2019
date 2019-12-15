const Advent = new (require('./index.js'))(15, 2019);
const Intcode = require('./intcode');
const Grid = require('./grid');
const termKit = require('terminal-kit')

class RepairDroid {
    constructor(input, useTerm = true) {
        this.PC = new Intcode(input);
        this.Grid = new Grid();
        if (useTerm) {
            this.term = termKit.terminal;
            this.term.clear();
            this.term.fullscreen(true);
            this.term.grabInput(true);
            this.term.on('key', (name) => {
                if (name === 'CTRL_C') {
                    process.exit(0);
                }
            });
        }

        this.screenW = 0;
        this.screenH = 0;
        this.scrBuf = null;

        this.pos = {x: 0, y: 0};
        this.dirs = {
            1: {
                x: 0,
                y: -1,
            },
            2: {
                x: 0,
                y: 1,
            },
            3: {
                x: -1,
                y: 0,
            },
            4: {
                x: 1,
                y: 0,
            },
        };

        this.Grid.Write(this.pos.x, this.pos.y, 'D');
        this.Grid.WriteKey(this.pos.x, this.pos.y, 'distance', 0);

        this.Draw();
    }

    Move(dir) {
        // figure out where we want to end up with this movement update
        const dirVec = this.dirs[dir];
        const newPos = {x: this.pos.x + dirVec.x, y: this.pos.y + dirVec.y};

        this.PC.Input(dir);

        return this.PC.GetOutput().then((output) => {
            if (output === 0) {
                // hit a wall
                this.Grid.Write(newPos.x, newPos.y, '#');
                this.Grid.WriteKey(newPos.x, newPos.y, 'block', true);
            } else {
                // track how far we have come
                const distance = this.Grid.ReadKey(this.pos.x, this.pos.y, 'distance');

                // mark current spot as empty ground
                this.Grid.Write(this.pos.x, this.pos.y, '.');

                // move droid to new spot
                this.pos.x = newPos.x;
                this.pos.y = newPos.y;
                this.Grid.Write(this.pos.x, this.pos.y, 'D');

                // check new spot distance before writing any new values
                const newCellDistance = this.Grid.ReadKey(this.pos.x, this.pos.y, 'distance');
                if (newCellDistance === undefined || newCellDistance > distance) {
                    this.Grid.WriteKey(this.pos.x, this.pos.y, 'distance', distance + 1);
                }
            }

            this.Draw();

            return Promise.resolve(output === 2);
        });
    }

    Draw() {
        if (!this.term) return;

        // build our screenbuffer (if screen size has changed)
        const mapW = this.Grid.Width;
        const mapH = this.Grid.Height;
        if (mapW !== this.screenW || mapH !== this.screenH) {
            this.scrBuf = new termKit.ScreenBuffer({
                width: mapW,
                height: mapH,
                dst: this.term,
            });
        }

        // draw updated grid state
        this.Grid.Draw((x, y, cell) => {
            const val = (cell === undefined) ? ' ' : cell.val;

            // default colour in tiles in white
            let col = 'white';
            
            // droid in green
            if (val === 'D') {
                col = 'green';
            }

            // colour all blocking tiles in red
            if (cell !== undefined && cell.block) {
                col = 'red';
            }

            // write each cell
            this.scrBuf.moveTo(x + 2, y + 2);
            this.scrBuf.put({
                x: x,
                y: y,
                attr: {
                    color: col,
                },
            }, val);
        });

        // TODO - center screen buffer to middle of terminal window
        this.scrBuf.draw({
            x: 1,
            y: 2,
        });

        this.term.defaultColor();
        const currDistance = this.Grid.ReadKey(this.pos.x, this.pos.y, 'distance') || 0;
        this.term.moveTo(1, 1, `Distance: ${currDistance.toString().padStart(9, '0')}`);

        this.term.moveTo(1, this.Grid.Height + 2);
    }

    Run() {
        return this.PC.Run();
    }

    RandomExplore() {
        return new Promise((resolve) => {
            this.Run().then(() => {
                return resolve();
            });

            const ChooseDirection = () => {
                const validDirs = [];
                for(let i=1; i<=4; i++) {
                    const newPos = {x: this.pos.x + this.dirs[i].x, y: this.pos.y + this.dirs[i].y};
                    const newCell = this.Grid.ReadCell(newPos.x, newPos.y);

                    // prioritise going in new directions!
                    if (newCell === undefined) {
                        return i;
                    }

                    // any non-blocking cell is a valid direction
                    if (!newCell.block) {
                        validDirs.push(i);
                    }
                }

                if (validDirs.length === 1) {
                    // only one valid direction, so this is a dead end!
                    //  mark this space as blocking so we won't try and visit it again
                    this.Grid.WriteKey(this.pos.x, this.pos.y, 'block', true);
                }

                return validDirs[Math.floor(Math.random() * validDirs.length)];
            };

            const Step = () => {
                const newDir = ChooseDirection();
                this.Move(newDir).then((done) => {
                    if (done) {
                        return resolve();
                    }
                    setTimeout(Step, 0);
                });
            };
            Step();
        });
    }

    InteractiveExplore() {
        return new Promise((resolve) => {
            this.Run().then(() => {
                return resolve();
            });

            let moving = false;

            this.term.on('key', (name) => {
                if (moving) return;
                moving = true;

                if (name === 'UP') {
                    this.Move(1).then(() => {
                        moving = false;
                    });
                } else if (name === 'DOWN') {
                    this.Move(2).then(() => {
                        moving = false;
                    });
                } else if (name === 'LEFT') {
                    this.Move(3).then(() => {
                        moving = false;
                    });
                } else if (name === 'RIGHT') {
                    this.Move(4).then(() => {
                        moving = false;
                    });
                }
            });
        });
    }
}

Advent.GetInput().then((input) => {
    const Droid = new RepairDroid(input, true);
    return Droid.RandomExplore().then(() => {
        // get distance from start for the tile we land on
        const distanceToPoint = Droid.Grid.ReadKey(Droid.pos.x, Droid.pos.y, 'distance');
        return Advent.Submit(distanceToPoint).then(() => {
            process.exit(0);
        });
    });
}).catch((e) => {
    console.log(e);
});