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

        this.distance = this.orientation === 'V' ? Math.abs(this.maxY - this.minY) : Math.abs(this.maxX - this.minX);
    }

    /** Does this line intersect with another line? Returns location of intersection, or undefined if they don't intersect */
    Intersect(other) {
        if (this.orientation === other.orientation) return undefined;

        if (this.orientation === 'H' && this.minX < other.minX && this.maxX > other.minX && this.minY > other.minY && this.minY < other.maxY) {
            return {
                x: other.minX,
                y: this.minY,
                distance: Math.abs(other.minX - this.start.x),
            };
        }

        if (this.orientation === 'V' && this.minY < other.minY && this.maxY > other.minY && this.minX > other.minX && this.minX < other.maxX) {
            return {
                x: this.minX,
                y: other.minY,
                distance: Math.abs(other.minY - this.start.y),
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
    //input = ['R75,D30,R83,U83,L12,D49,R71,U7,L72', 'U62,R66,U55,R34,D71,R55,D58,R83'];
    //input = ['R8,U5,L5,D3', 'U7,R6,D4,L4'];

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
    let L1Distance = 0;
    lines[0].forEach((l1) => {
        let L2Distance = 0;
        lines[1].forEach((l2) => {
            const cross = l1.Intersect(l2);
            if (cross !== undefined && (cross.x !== 0 || cross.y !== 0)) {
                // need to find how far the wire steps with the opposite intersection for part 2
                const counterCross = l2.Intersect(l1);
                
                cross.totalDistance = cross.distance + counterCross.distance + L1Distance + L2Distance;

                Intersections.push(cross);
            }

            L2Distance += l2.distance;
        });

        L1Distance += l1.distance;
    });

    // find nearset intersection to origin
    const ShortestDist = Intersections.map(i => Math.abs(i.x) + Math.abs(i.y)).reduce((p,n) => {
        return Math.min(p, n);
    }, Number.MAX_SAFE_INTEGER);
    
    const ShortestDist2 = Intersections.reduce((p, n) => {
        return n.totalDistance < p.totalDistance ? n : p;
    }, Intersections[0]);

    return Advent.Submit(ShortestDist).then(() => {
        return Advent.Submit(ShortestDist2.totalDistance, 2);
    });
}).catch((e) => {
    console.log(e);
});