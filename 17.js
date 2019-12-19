const Advent = new (require('./index.js'))(17, 2019);
const Screen = require('./screen');
const Intcode = require('./intcode');

Advent.GetInput().then((input) => {
    const S = new Screen();
    const PC = new Intcode(input);
    
    let x = 0;
    let y = 0;
    PC.on('output', (out) => {
        if (out === 10) {
            x = 0;
            y++;
        } else {
            S.Set(x, y, out === 35 ? '#' : '.');
            x++;
        }
    });
    return PC.Run().then(() => {
        S.Draw();
        const ValidateDir = (x, y) => {
            const cell = S.GetKey(x, y, 'val');
            return cell === '#';
        };
        const IsCellJunction = (cell) => {
            if (cell.val !== '#') return;
            // get neighbours
            const dirs = [
                ValidateDir(cell.x - 1, cell.y), // left
                ValidateDir(cell.x + 1, cell.y), // right
                ValidateDir(cell.x, cell.y - 1), // up
                ValidateDir(cell.x, cell.y + 1), // down
            ];
            return (dirs.filter(x => x).length === 4);
        };
        const junctions = Object.values(S.Grid).filter(IsCellJunction);
        junctions.forEach((j) => {
            S.Set(j.x, j.y, 'O');
        });
        S.Draw();
        const answer1 = junctions.reduce((p, cell) => {
            return p + (cell.x * cell.y);
        }, 0);

        return Advent.Submit(answer1).then(() => {
            process.exit(0);
        });
    });
}).catch((e) => {
    console.log(e);
});