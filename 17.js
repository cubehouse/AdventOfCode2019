const Advent = new (require('./index.js'))(17, 2019);
const Screen = require('./screen');
const Intcode = require('./intcode');

const directions = '^>v<'.split('');

class ScaffoldViewer {
    constructor(PC, Screen) {
        let x = 0;
        let y = 0;
        let drawnAnythingThisLine = false;
        this.PC = PC;
        this.S = Screen;
        this.S.Clear();
        PC.on('output', (out) => {
            if (out === 10) {
                x = 0;
                y++;
                if (!drawnAnythingThisLine) {
                    y = 0;
                }
                drawnAnythingThisLine = false;
            } else {
                drawnAnythingThisLine = true;
                // any non-dot is a valid path
                if (out !== 46) {
                    Screen.SetKey(x, y, 'path', true);
                }
                Screen.Set(x, y, String.fromCharCode(out));
                x++;
            }
        });
        PC.on('input', () => {
            y = 0;
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
        const validDir = leftRight.find((char) => {
            const dir = this.CharToDir(char);
            return this.ValidateCell(x + dir.x, y + dir.y);
        });
        if (validDir === undefined) return undefined;
        const rayResult = this.RayCast(x, y, validDir);
        rayResult.turn = leftRight[0] === validDir ? 'R' : 'L';
        return rayResult;
    }

    RayCast(x, y, dirChar) {
        const dir = this.CharToDir(dirChar);
        const currentPos = {x, y};
        const nextPos = {x: currentPos.x + dir.x, y: currentPos.y + dir.y};
        while(this.ValidateCell(nextPos.x, nextPos.y)) {
            currentPos.x = nextPos.x;
            currentPos.y = nextPos.y;
            nextPos.x = currentPos.x + dir.x;
            nextPos.y = currentPos.y + dir.y;
        }
        return {
            oX: x, // origin
            oY: y,
            dX: currentPos.x, // destination (hit location)
            dY: currentPos.y,
            dir: dirChar,
            dist: Math.abs((currentPos.x - x) + (currentPos.y - y)),
        };
    }

    Part2() {
        const robot = this.FindRobot();

        // generate path of robot
        let res;
        const path = [];
        do {
            this.S.Draw();
            res = this.RayCastLeftOrRight(robot.x, robot.y, robot.val);
            if (res !== undefined) {
                path.push(`${res.turn},${res.dist}`);
                robot.x = res.dX;
                robot.y = res.dY;
                robot.val = res.dir;
            }
        } while (res !== undefined);

        // compress path
        const TestPathSegment = (seg, index) => {
            return (seg.join(',') === path.slice(index, index + seg.length).join(','));
        }
        const CheckCompression = (A, B, C) => {
            let currIdx = 0;
            while (currIdx < path.length) {
                if (TestPathSegment(A, currIdx)) {
                    currIdx += A.length;
                } else if (TestPathSegment(B, currIdx)) {
                    currIdx += B.length;
                } else if (TestPathSegment(C, currIdx)) {
                    currIdx += C.length;
                } else {
                    return false;
                }
            }
            return true;
        };
        const RemoveSegmentFromPath = (p, seg) => {
            const newPath = JSON.parse(JSON.stringify(p));
            let x = 0;
            const segStr = seg.join('Z');
            while(x < newPath.length) {
                if (newPath.slice(x, x + seg.length).join('Z') === segStr) {
                    newPath.splice(x, x + seg.length);
                } else {
                    x++;
                }
            }
            return newPath;
        };

        /*const maxSizeChunk = 4;
        const minSizeChunk = 4;
        const combos = [];
        for(let a=minSizeChunk; a<=maxSizeChunk; a++) {
            for(let b=3; b<=maxSizeChunk; b++) {
                // let a be from the start of the path
                const A = path.slice(0, a);
                const remainingPathA = RemoveSegmentFromPath(path, A);
                // ... and b from the back (after we've removed a)
                const B = remainingPathA.slice(remainingPathA.length - b, remainingPathA.length);
                const remainingPathB = RemoveSegmentFromPath(remainingPathA, B);
                console.log(remainingPathB);
                for(let c=minSizeChunk; c<=maxSizeChunk; c++) {
                    combos.push([A, B, remainingPathB.slice(0, c)]);
                }
            }
        }*/

        // can't be asked right now to auto-find this
        //  I've done my algorithm manually
        const combos = [
            [
                ['R,10', 'R,10', 'R,6', 'R,4'],
                ['R,10', 'R,10', 'L,4'],
                ['R,4', 'L,4', 'L,10', 'L,10'],
            ]
        ];

        console.log('Searching for compression combo...');
        const answer = combos.find((x) => {
            return CheckCompression(x[0], x[1], x[2]);
        });
        
        const A = answer[0];
        const B = answer[1];
        const C = answer[2];
        
        // build main program
        const Prog = [];
        let pathIdx = 0;
        while(pathIdx < path.length) {
            if (TestPathSegment(A, pathIdx)) {
                Prog.push('A');
                pathIdx += A.length;
            } else if (TestPathSegment(B, pathIdx)) {
                Prog.push('B');
                pathIdx += B.length;
            } else if (TestPathSegment(C, pathIdx)) {
                Prog.push('C');
                pathIdx += C.length;
            } else {
                console.log('ERROR: Invalid Path Segment');
            }
        }

        // input program into computer
        const Inputs = [
            Prog.join(','),
            A.join(','),
            B.join(','),
            C.join(','),
        ];

        // push the commands to the PC
        Inputs.forEach((l) => {
            l.split('').forEach((c) => {
                this.PC.Input(c.charCodeAt(0));
            });
            this.PC.Input(10);
        });
        
        // interactive mode?
        this.PC.Input('y'.charCodeAt(0));
        this.PC.Input(10);
    }
}

Advent.GetInput().then((input) => {
    const S = new Screen();

    const PC = new Intcode(input);
    const P1 = new ScaffoldViewer(PC, S);

    return P1.Run().then(() => {
        const answer1 = P1.Part1();
        return Advent.Submit(answer1).then(() => {
            const PC2 = new Intcode(input);
            PC2.memory[0] = 2;
            const P2 = new ScaffoldViewer(PC2, S);
            PC2.once('input', () => {
                // start part 2 once the PC asks for input the first time
                P2.Part2();
            });
            let answer2 = 0;
            PC2.on('output', (out) => {
                // catch any non-ASCII outputs
                if (out > 'z'.charCodeAt(0)) {
                    answer2 = out;
                }
            });
            return P2.Run().then(() => {
                return Advent.Submit(answer2, 2);
            });
        });
    });
}).catch((e) => {
    console.log(e);
});