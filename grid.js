class Grid {
    constructor() {
        this.cells = {};

        this.minX = null;
        this.maxX = null;
        this.minY = null;
        this.maxY = null;

        this.fullRedraw = true;
        this.drawCmds = [];

        this.cacheWidth = 0;
        this.cacheHeight = 0;
    }

    get Width() {
        return this.maxX - this.minX + 1;
    }
    
    get Height() {
        return this.maxY - this.minY + 1;
    }

    ReadCell(x, y) {
        return this.cells[`${x}_${y}`];
    }

    GetCreateCell(x, y) {
        const cell = this.ReadCell(x, y);
        if (cell === undefined) {
            this.cells[`${x}_${y}`] = {
                x,
                y,
                val: ' ',
            };

            // calculate min/max of our grid
            if (this.minX === null || this.maxX === null || this.minY === null || this.maxY === null) {
                this.minX = x;
                this.maxX = x;
                this.minY = y;
                this.maxY = y;
                this.fullRedraw = true;
            } else {
                // if our dimentions change, request a full redraw
                this.minX = Math.min(this.minX, x);
                this.maxX = Math.max(this.maxX, x);
                this.minY = Math.min(this.minY, y);
                this.maxY = Math.max(this.maxY, y);
            }

            if (this.cacheWidth !== this.Width || this.cacheHeight !== this.Height) {
                this.fullRedraw = true;
                this.cacheWidth = this.Width;
                this.cacheHeight = this.Height;
            }

            return this.cells[`${x}_${y}`];
        }
        return cell;
    }

    Write(x, y, val) {
        this.WriteKey(x, y, 'val', val);
    }

    WriteKey(x, y, key, val) {
        const cell = this.GetCreateCell(x, y);
        if (key === 'val' && cell.val !== val) {
            this.AddDrawCall(x, y);
        }
        cell[key] = val;
    }

    Read(x, y) {
        return this.ReadKey(x, y, 'val');
    }

    ReadKey(x, y, key) {
        const cell = this.ReadCell(x, y);
        if (cell !== undefined) {
            return cell[key];
        }
        return undefined;
    }

    Print() {
        for(let y=this.minY; y<=this.maxY; y++) {
            const row = [];
            for(let x=this.minX; x<=this.maxX; x++) {
                const cell = this.ReadCell(x, y);
                row.push(cell === undefined ? ' ' : cell.val);
            }
            console.log(row.join(''));
        }
    }

    AddDrawCall(x, y) {
        this.drawCmds.push({
            x,
            y,
        });
    }

    GenerateFullRedrawCmds() {
        this.drawCmds = [];

        for(let y=this.minY; y<=this.maxY; y++) {
            for(let x=this.minX; x<=this.maxX; x++) {
                this.AddDrawCall(x, y);
            }
        }
    }

    Draw(cb) {
        // if we want a full refresh, generate our draw cmds first
        if (this.fullRedraw) {
            this.GenerateFullRedrawCmds();
            this.fullRedraw = false;
        }

        // call our incoming callback function with our draw calls
        //  will only call changed cells
        this.drawCmds.forEach((call) => {
            cb(call.x - this.minX, call.y - this.minY, this.ReadCell(call.x, call.y));
        });
    }
}

module.exports = Grid;

if (!module.parent) {
    const G = new Grid();
    G.Write(0, 0, '@');
    G.Write(-1, 0, '>');
    G.Write(-2, 0, '-');
    G.Write(-3, 0, '-');
    G.Write(0, 4, '_');
    G.Print();
}