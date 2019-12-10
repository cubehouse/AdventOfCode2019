const Advent = new (require('./index.js'))(10, 2019);

Advent.GetInput().then((input) => {
    /*input = `.#..#
.....
#####
....#
...##`.split('\n');*/

    const asteroids = [];
    input.forEach((line, y) => {
        line.split('').forEach((cell, x) => {
            if (cell === '#') {
                asteroids.push({
                    x,
                    y
                });
            }
        });
    });

    // calculate direction of each asteroid to each other asteroid
    //  if two asteroids have the same direction vector, then pick only the nearest one (the one not blocking the other one)
    asteroids.forEach((a, idx) => {
        const slopes = {};
        asteroids.forEach((other, oIdx) => {
            if (idx === oIdx) return;

            const direction = {
                x: other.x - a.x,
                y: other.y - a.y,
            };
            const distance = Math.sqrt((direction.x * direction.x) + (direction.y * direction.y));
            const unitDirection = {
                x: direction.x / distance,
                y: direction.y / distance,
            };
            
            const slopeKey = `${unitDirection.x.toFixed(5)}_${unitDirection.y.toFixed(5)}`;
            if (!slopes[slopeKey] || slopes[slopeKey].distance > distance) {
                slopes[slopeKey] = {
                    direction: unitDirection,
                    distance,
                };
            }
        });
        asteroids[idx].visibleOthers = Object.keys(slopes).length;
    });
    
    const bestAsteroid = asteroids.reduce((p, a) => {
        return p < a.visibleOthers ? a.visibleOthers : p;
    }, 0);

    return Advent.Submit(bestAsteroid).then(() => {
        // TODO - puzzle answer 2
        let answer2 = 0;

        //return Advent.Submit(answer2, 2);
    });
}).catch((e) => {
    console.log(e);
});