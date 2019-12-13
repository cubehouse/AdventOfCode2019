const Advent = new (require('./index.js'))(11, 2019);
const Intcode = require('./intcode');

class Painter {
    constructor() {
        this.Grid = {};
        this.x = 0;
        this.y = 0;
        this.dir = 0;

        this.minX = 0;
        this.maxX = 0;
        this.minY = 0;
        this.maxY = 0;
    }

    Move(rot) {
        this.dir = (this.dir + (rot === 0 ? 3 : 1)) % 4;

        switch(this.dir) {
            case 0:
                this.y--;
                break;
            case 1:
                this.x++;
                break;
            case 2:
                this.y++;
                break;
            case 3:
                this.x--;
                break;
        }

        this.minX = Math.min(this.minX, this.x);
        this.maxX = Math.max(this.maxX, this.x);
        this.minY = Math.min(this.minY, this.y);
        this.maxY = Math.max(this.maxY, this.y);
    }

    Get(x, y) {
        const cell = this.Grid[`${x}_${y}`];
        if (cell === undefined) return 0;
        return cell;
    }

    Read() {
        return this.Get(this.x, this.y);
    }

    Write(val) {
        this.Grid[`${this.x}_${this.y}`] = val;
    }

    Print() {
        const SymPrint = (x) => {
            return x === 1 ? 'X' : '.';
        };
        for(let y=this.minY - 1; y<=this.maxY + 1; y++) {
            const row = [];
            for(let x=this.minX - 1; x<=this.maxX + 1; x++) {
                if (x === this.x && y === this.y) {
                    if (this.dir === 0) {
                        row.push('^');
                    } else if (this.dir === 1) {
                        row.push('>');
                    } else if (this.dir === 2) {
                        row.push('v');
                    } else if (this.dir === 3) {
                        row.push('<');
                    }
                } else {
                    row.push(SymPrint(this.Get(x, y)));
                }
            }
            console.log(row.join(''));
        }
    }

    WaitForPCInput() {
        this.PC.Input(this.Read());
        return this.PC.GetOutput().then((paintType) => {
            this.Write(paintType);
            return this.PC.GetOutput().then((direction) => {
                this.Move(direction);
                return Promise.resolve();
            });
        });
    }

    Run(input) {
        this.PC = new Intcode(input);
    
        const Step = () => {
            this.WaitForPCInput(this.PC).then(() => {
                process.nextTick(Step);
            });
        };
        Step();

        return this.PC.Run();
    }
};

Advent.GetInput().then((input) => {
    const P = new Painter();
    return P.Run(input).then(() => {
        const PanelsPainted = Object.keys(P.Grid).length;
        return Advent.Submit(PanelsPainted).then(() => {
            console.log('Done!');
        });
    });
}).catch((e) => {
    console.log(e);
});