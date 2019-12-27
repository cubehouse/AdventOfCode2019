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

        this.depth = depth;

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

const Tiles = {};

function GetTile(depth, input = []) {
    // get (or create) tile at requested depth
    if (Tiles[depth] === undefined) {
        Tiles[depth] = new Tile2(input, depth);
    }
    return Tiles[depth];
}

class Tile2 extends Tile {
    constructor(input, depth) {
        super(input, depth);

        // register with manager
        Tiles[depth] = this;
    }

    ForEachCell(func) {
        this.grid.forEach((row, y) => {
            row.forEach((char, x) => {
                // skip out center square in for loops now, it's a magic square
                if (x === 2 && y === 2) return;

                const idx = (y * 5) + x;
                func(x, y, char, idx);
            });
        });
    }

    GetNeighbours(x, y) {
        // get depth +/- 1
        const lower = GetTile(this.depth - 1);
        const higher = GetTile(this.depth + 1);

        const n = [];

        dirs.map(d => {return {x: x + d[0], y: y + d[1]};}).forEach(pos => {
            if (pos.x < 0) {
                // get higher grid (1, 2)
                n.push(higher.grid[2][1]);
            } else if (pos.y < 0) {
                // get higher grid (1, 2)
                n.push(higher.grid[1][2]);
            } else if (pos.x > 4) {
                // get higher grid (3, 2)
                n.push(higher.grid[2][3]);
            } else if (pos.y > 4) {
                // get higher grid (2, 3)
                n.push(higher.grid[3][2]);
            } else if (pos.x === 2 && pos.y === 2) {
                // if this is the middle tile... add all along the side of the lower tile
                if (x === 1) {
                    // left side
                    n.push(lower.grid[0][0]);
                    n.push(lower.grid[1][0]);
                    n.push(lower.grid[2][0]);
                    n.push(lower.grid[3][0]);
                    n.push(lower.grid[4][0]);
                } else if (x === 3) {
                    // right side
                    n.push(lower.grid[0][4]);
                    n.push(lower.grid[1][4]);
                    n.push(lower.grid[2][4]);
                    n.push(lower.grid[3][4]);
                    n.push(lower.grid[4][4]);
                } else if (y === 1) {
                    // top side
                    n.push(lower.grid[0][0]);
                    n.push(lower.grid[0][1]);
                    n.push(lower.grid[0][2]);
                    n.push(lower.grid[0][3]);
                    n.push(lower.grid[0][4]);
                } else if (y === 3) {
                    // bottom side
                    n.push(lower.grid[4][0]);
                    n.push(lower.grid[4][1]);
                    n.push(lower.grid[4][2]);
                    n.push(lower.grid[4][3]);
                    n.push(lower.grid[4][4]);
                }
            } else if (this.grid[pos.y] !== undefined) {
                if (this.grid[pos.y][pos.x] !== undefined) {
                    n.push(this.grid[pos.y][pos.x]);
                }
            }
        });

        return n;
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
    return Advent.Submit(T.rating).then(() => {
        // part 2
        // create tile depth 0
        GetTile(0, input);

        // tick all tiles together
        const Tick = () => {
            const todo = [];

            // create min/max tile +/- 1 that has any bugs
            const depths = Object.keys(Tiles);
            const min = Math.min(...depths);
            const max = Math.min(...depths);
            if (Tiles[min].GenRating() > 0) {
                GetTile(min - 1);
            }
            if (Tiles[max].GenRating() > 0) {
                GetTile(max + 1);
            }

            Object.values(Tiles).forEach(t => {
                // tick but don't update cells yet...
                todo.push(...t.Tick(false));
            });
            todo.forEach(t => {
                GetTile(t.depth).grid[t.y][t.x] = t.char;
            });
        };
        for(let i=0; i<200; i++) {
            Tick();
        }
        let bugs = 0;
        const TileIDS = Object.keys(Tiles);
        TileIDS.sort((a,b)=>a-b);
        TileIDS.forEach(id => {
            const t = Tiles[id];
            t.ForEachCell((x, y, char) => {
                if (char === '#') {
                    bugs += 1;
                }
            });
        });
        return Advent.Submit(bugs, 2);
    });
}).catch((e) => {
    console.error(e);
});