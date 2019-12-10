const Advent = new (require('./index.js'))(10, 2019);

const GetDirectionVector = (x1, y1, x2, y2) => {
    const diff = {
        x: x2 - x1,
        y: y2 - y1,
    };
    const distance = Math.sqrt((diff.x * diff.x) + (diff.y * diff.y));
    const slopeX = diff.x / distance;
    const slopeY = diff.y / distance;
    const directionVector = {
        x: slopeX.toFixed(5),
        y: slopeY.toFixed(5),
        distance,
        origin: {
            x: x1,
            y: y1,
        },
        end: {
            x: x2,
            y: y2,
        },
    };

    // how "clockwisey" are we. Higher is further around the clock
    if (slopeX >= 0) {
        directionVector.clockwiseNess = slopeY;
    } else {
        directionVector.clockwiseNess = 2 - slopeY;
    }

    return directionVector;
};

Advent.GetInput().then((input) => {
    const asteroids = [];
    input.forEach((line, y) => {
        line.split('').forEach((cell, x) => {
            if (cell === '#') {
                asteroids.push({
                    x,
                    y,
                    idx: asteroids.length,
                    destroyed: false,
                });
            }
        });
    });

    const CalculateOtherAsteroids = (a) => {
        const slopes = [];
        asteroids.forEach((other) => {
            if (other.x === a.x && other.y === a.y) return;

            // skip destroyed asteroids
            if (other.destroyed) return;

            const dir = GetDirectionVector(a.x, a.y, other.x, other.y);

            const slopeAlreadyExists = slopes.find((a, idx) => {
                const match = (a.x === dir.x && a.y === dir.y);
                if (match && a.distance > dir.distance) {
                    slopes[idx] = dir;
                }
                return match;
            });
            if (slopeAlreadyExists === undefined) {
                slopes.push(dir);
            }
        });
        a.visibleOthers = slopes.length;
        a.slopesToOthers = slopes;
    };

    // calculate direction of each asteroid to each other asteroid
    //  if two asteroids have the same direction vector, then pick only the nearest one (the one not blocking the other one)
    asteroids.forEach(CalculateOtherAsteroids);
    
    const bestAsteroid = asteroids.reduce((p, a) => {
        return p.visibleOthers < a.visibleOthers ? a : p;
    }, {
        visibleOthers: 0,
    });

    return Advent.Submit(bestAsteroid.visibleOthers).then(() => {
        // Part 2
        const station = asteroids.splice(bestAsteroid.idx, 1)[0];
        let i = 0;
        const destroyedAsteroids = [];
        while(station.visibleOthers > 0) {
            // order other stations in clockwise order
            station.slopesToOthers.sort((a, b) => {
                return a.clockwiseNess - b.clockwiseNess;
            });
            
            // mark asteroids as destroyed in clockwise order
            station.slopesToOthers.forEach((a) => {
                i++;
                destroyedAsteroids.push((a.end.x * 100) + a.end.y);
                
                // find the correct asteroid from the slope data
                const asteroid = asteroids.find((x) => {
                    return x.x === a.end.x && x.y === a.end.y;
                });
                asteroid.destroyed = true;
            });

            CalculateOtherAsteroids(station);
        }

        return Advent.Submit(destroyedAsteroids[199], 2);
    });
}).catch((e) => {
    console.log(e);
});