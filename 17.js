const Advent = new (require('./index.js'))(17, 2019);
const Screen = require('./screen');
const Intcode = require('./intcode');

const directions = '^>v<'.split('');

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
                // any non-dot is a valid path
                if (out !== 46) {
                    Screen.SetKey(x, y, 'path', true);
                }
                Screen.Set(x, y, String.fromCharCode(out));
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

    ValidateCell(x, y) {
        return this.S.GetKey(x, y, 'path') === true;
    }

    GetNeighbours(cell) {
        if (cell.val !== '#') return [];
        return [
            this.ValidateCell(cell.x - 1, cell.y), // left
            this.ValidateCell(cell.x + 1, cell.y), // right
            this.ValidateCell(cell.x, cell.y - 1), // up
            this.ValidateCell(cell.x, cell.y + 1), // down
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

    FindRobot() {
        return Object.values(this.S.Grid).find((x) => {
            return directions.indexOf(x.val) >= 0;
        });
    }

    CharToDir(dirChar) {
        switch(dirChar) {
            case '^':
                return {x:0, y:-1};
            case '>':
                return {x:1, y:0};
            case 'v':
                return {x:0, y:1};
            case '<':
                return {x:-1, y:0};
        }
        return undefined;
    }

    RayCastLeftOrRight(x, y, dirChar) {
        const currDir = directions.indexOf(dirChar);
        const leftRight = [
            directions[(currDir + 1) % 4],
            directions[(currDir + 3) % 4],
        ];
        const validDir = leftRight.find((x) => {
            const dir = this.CharToDir(x);
            return this.ValidateCell(x + dir.x, y + dir.y);
        });
        if (validDir === undefined) return undefined;
        return this.RayCast(x, y, validDir);
    }

    RayCast(x, y, dirChar) {
        const dir = this.CharToDir(dirChar);
        const currentPos = {x, y};
        const nextPos = {x: currentPos.x + dir.x, y: currentPos.y + dir.y};
        while(this.ValidateCell(nextPos.x, nextPos.y)) {
            currentPos.x = nextPos.x;
            currentPos.y = nextPos.y;
            nextPos.x += dir.x;
            nextPos.y += dir.y;
        }
        return {
            oX: x, // origin
            oY: y,
            dX: currentPos.x, // destination (hit location)
            dY: currentPos.y,
            dir: dir,
            dist: Math.abs((currentPos.x - x) + (currentPos.y - y)),
        };
    }
}

Advent.GetInput().then((input) => {
    const S = new Screen();
    const PC = new Intcode(input);
    
    const P1 = new ScaffoldViewer(PC, S);

    return P1.Run().then(() => {
        const answer1 = P1.Part1();
        return Advent.Submit(answer1).then(() => {
            const robot = P1.FindRobot();
            console.log(robot);
        });
    });
}).catch((e) => {
    console.log(e);
});