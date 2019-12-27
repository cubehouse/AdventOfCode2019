const Advent = new (require('./index.js'))(24, 2019);

const dirs = [
    [0, 1],
    [1, 0],
    [0, -1],
    [-1, 0],
];

class Tile {
    constructor(initialState = [], depth = 0) {
        this.grid = new Array(5).fill(0).map(x => new Array(5).fill('.'));
        initialState.forEach((row, y) => {
            row.split('').forEach((char, x) => {
                this.grid[y][x] = char;
            });
        });

        this.depth = 0;

        this.tilePoints = new Array(25).fill(0).map((x, idx) => Math.pow(2, idx));

        this.rating = this.GenRating();
    }

    ForEachCell(func) {
        this.grid.forEach((row, y) => {
            row.forEach((char, x) => {
                const idx = (y * 5) + x;
                func(x, y, char, idx);
            });
        });
    }

    Tick(updateCells = true) {
        const todo = [];
        this.ForEachCell((x, y, char) => {
            // get neighbours
            const n = this.GetNeighbours(x, y);
            // count how many bugs there are
            const bugN = n.filter(x => x === '#').length;

            // simulate life
            if (char === '#' && bugN !== 1) {
                todo.push({
                    x,
                    y,
                    char: '.',
                    depth: this.depth,
                });
            } else if (char === '.' && (bugN === 2 || bugN === 1)) {
                todo.push({
                    x,
                    y,
                    char: '#',
                    depth: this.depth,
                });
            }
        });

        if (updateCells) {
            // process new life
            todo.forEach(t => {
                this.grid[t.y][t.x] = t.char;
            });
            this.rating = this.GenRating();
        }

        return todo;
    }

    GetNeighbours(x, y) {
        return dirs.map(d => {return {x: x + d[0], y: y + d[1]};}).map(pos => {
            if (!this.grid[pos.y]) return undefined;
            return this.grid[pos.y][pos.x];
        }).filter(x => x !== undefined);
    }

    Print() {
        this.grid.forEach((row) => {
            console.log(row.join(''));
        });
    }

    GenRating() {
        let score = 0;
        this.ForEachCell((x, y, char, idx) => {
            if (char === '#') {
                score += this.tilePoints[idx];
            }
        });
        return score;
    }
}

Advent.GetInput().then((input) => {
    // part 1
    const T = new Tile(input);
    const Ratings = {};
    while(true) {
        Ratings[T.rating] = 1;
        T.Tick();
        if (Ratings[T.rating] !== undefined) {
            break;
        }
    };
    return Advent.Submit(T.rating);
}).catch((e) => {
    console.error(e);
});