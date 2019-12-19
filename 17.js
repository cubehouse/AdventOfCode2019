const Advent = new (require('./index.js'))(17, 2019);
const Screen = require('./screen');
const Intcode = require('./intcode');

class ScaffoldViewer {
    constructor(PC, Screen) {
        let x = 0;
        let y = 0;
        this.PC = PC;
        this.S = Screen;
        PC.on('output', (out) => {
            if (out === 10) {
                x = 0;
                y++;
            } else {
                Screen.Set(x, y, out === 35 ? '#' : '.');
                x++;
            }
        });
    }

    Run() {
        return this.PC.Run().then((out) => {
            this.S.Draw();
            return Promise.resolve(out);
        });
    }

    ValidateDir(x, y) {
        const cell = this.S.GetKey(x, y, 'val');
        return cell === '#';
    }

    GetNeighbours(cell) {
        if (cell.val !== '#') return [];
        return [
            this.ValidateDir(cell.x - 1, cell.y), // left
            this.ValidateDir(cell.x + 1, cell.y), // right
            this.ValidateDir(cell.x, cell.y - 1), // up
            this.ValidateDir(cell.x, cell.y + 1), // down
        ];
    }

    IsCellJunction(cell) {
        const dirs = this.GetNeighbours(cell);
        return (dirs.filter(x => x).length === 4);
    }

    Part1() {
        const junctions = Object.values(this.S.Grid).filter(this.IsCellJunction.bind(this));
        junctions.forEach((j) => {
            this.S.Set(j.x, j.y, 'O');
        });
        return junctions.reduce((p, cell) => {
            return p + (cell.x * cell.y);
        }, 0);
    }
}

Advent.GetInput().then((input) => {
    const S = new Screen();
    const PC = new Intcode(input);
    
    const P1 = new ScaffoldViewer(PC, S);

    return P1.Run().then(() => {
        const answer1 = P1.Part1();
        return Advent.Submit(answer1).then(() => {
            
        });
    });
}).catch((e) => {
    console.log(e);
});