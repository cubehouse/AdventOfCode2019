const Advent = new (require('./index.js'))(3, 2019);

class Line {
    constructor({originX, originY, endX, endY}) {
        this.start = {x: originX, y: originY};
        this.end = {x: endX, y: endY};

        this.minX = Math.min(this.start.x, this.end.x);
        this.maxX = Math.max(this.start.x, this.end.x);
        this.minY = Math.min(this.start.y, this.end.y);
        this.maxY = Math.max(this.start.y, this.end.y);

        this.orientation = (this.start.x === this.end.x) ? 'V' : 'H';
    }

    /** Does this line intersect with another line? Returns location of intersection, or undefined if they don't intersect */
    Intersect(other) {
        if (this.orientation === other.orientation) return undefined;

        if (this.orientation === 'H' && this.minX < other.minX && this.maxX > other.minX && this.minY > other.minY && this.minY < other.maxY) {
            return {
                x: other.minX,
                y: this.minY,
            };
        }

        if (this.orientation === 'V' && this.minY < other.minY && this.maxY > other.minY && this.minX > other.minX && this.minX < other.maxX) {
            return {
                x: this.minX,
                y: other.minY,
            };
        }

        return undefined;
    }
};

function AddInstructionToCoord(x, y, instr) {
    const distance = Number(instr.slice(1));
    const dir = instr[0];
    switch(dir) {
        case 'R': 
            return {
                x: x + distance,
                y,
            };
        case 'L':
            return {
                x: x - distance,
                y,
            };
        case 'U':
            return {
                x,
                y: y + distance,
            };
        case 'D':
            return {
                x,
                y: y - distance,
            };
    }
}

Advent.GetInput().then((input) => {
    // build all our lines from input
    const lines = input.map((lines) => {
        let x = 0, y = 0;
        return lines.split(',').map((i) => {
            const startX = x;
            const startY = y;

            const end = AddInstructionToCoord(startX, startY, i);

            x = end.x;
            y = end.y;

            return new Line({originX: startX, originY: startY, endX: end.x, endY: end.y});
        });
    });

    // find intersections between 1st and 2nd line sections
    const Intersections = [];
    lines[0].forEach((l1) => {
        lines[1].forEach((l2) => {
            const cross = l1.Intersect(l2);
            if (cross !== undefined) {
                if (cross.x === 0 && cross.y === 0) return;
                Intersections.push(cross);
            }
        });
    });

    // find nearset intersection to origin
    const ShortestDist = Intersections.map(i => Math.abs(i.x) + Math.abs(i.y)).reduce((p,n) => {
        return Math.min(p, n);
    }, Number.MAX_SAFE_INTEGER);

    return Advent.Submit(ShortestDist).then(() => {
        // TODO - puzzle answer 2
        let answer2 = 0;

        //return Advent.Submit(answer2, 2);
    });
}).catch((e) => {
    console.log(e);
});