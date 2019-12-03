class Grid {
    constructor(width, height) {
        if (width <= 0 || height <= 0) {
            throw new Error('Width and height must be > 0');
        }

        console.log(`Creating grid ${width} x ${height}`);

        // setup our grid
        this.cells = new Array(width).fill().map((null1, y) => new Array(height).fill().map((null2, x) => {
            return {
                x,
                y,
                label: '.',
            };
        }));
    }

    Get(x, y, key) {
        if (!this.IsValidCell(x, y)) return undefined;
        if (key) {
            return this.cells[y][x][key];
        }
        return this.cells[y][x];
    }

    Set(x, y, key, val) {
        const cell = this.Get(x, y);
        if (cell === undefined) {
            console.error(`Failed to set key at ${x}, ${y}. Invalid cell.`);
            console.log(this.cells[0].length);
        }
        return cell[key] = val;
    }

    ForEach(fn) {
        this.cells.forEach((row) => {
            row.forEach((cell) => {
                fn(cell);
            });
        });
    }

    Print() {
        this.cells.forEach((row) => {
            console.log(row.map((x) => x.label).join(""));
        });
    }

    IsValidCell(x, y) {
        return (
            (x >= 0)
            &&
            (y >= 0)
            &&
            (y < this.cells.length)
            &&
            (x < this.cells[0].length)
        );
    }
}

module.exports = Grid;

if (!module.parent) {
    const G = new Grid(2, 3);
    console.log(G.cells);
    G.Set(1, 0, 'label', 'X');
    G.Print();
    console.log(G.Get(1, 0));
    G.ForEach((cell) => {
        console.log(`${cell.x},${cell.y}: ${cell.label}`);
    });
    console.log(G.IsValidCell(0,0));
    console.log(G.IsValidCell(0,5));
}