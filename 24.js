const Advent = new (require('./index.js'))(24, 2019);
const Screen = new (require('./screen'))({
    simulate: true,
});

class Tile {
    constructor(inputTile) {
        this.tiles = [];
        inputTile.forEach((row, y) => {
            row.split('').forEach((char, x) => {
                Screen.Set(x, y, char);
                this.tiles.push(Screen.Get(x, y));
            });
        });

        this.tilePoints = new Array(25).fill(0).map((x, idx) => Math.pow(2, idx));

        this.rating = this.GenRating();
    }

    GenRating() {
        return this.tiles.reduce((p, n, idx) => {
            return p + ((n.val === '#') ? this.tilePoints[idx] : 0);
        }, 0);
    }

    Tick() {
        const toApply = [];
        this.tiles.forEach(t => {
            const ns = Screen.GetNeighbours(t).filter(x => x !== undefined).map(x => x.val);
            const nearbyBugs = ns.filter(x => x === '#').length;
            if (t.val === '.') {
                if (nearbyBugs === 1 || nearbyBugs === 2) {
                    toApply.push({
                        x: t.x,
                        y: t.y,
                        val: '#',
                    });
                }
            } else if (t.val === '#') {
                if (nearbyBugs !== 1) {
                    toApply.push({
                        x: t.x,
                        y: t.y,
                        val: '.',
                    });
                }
            }
        });

        toApply.forEach((a) => {
            Screen.Set(a.x, a.y, a.val);
        });

        this.rating = this.GenRating();
    }
}

Advent.GetInput().then((input) => {
    const T = new Tile(input);
    const Ratings = {};
    const todo = [1];
    const step = () => {
        if (Ratings[T.rating] !== undefined) {
            return;
        }
        Ratings[T.rating] = 1;
        T.Tick();
        todo.push(1);
    };
    return Screen.RunTodoList(todo, step).then(() => {
        return Advent.Submit(T.rating).then(() => {
            
        });
    });
}).catch((e) => {
    console.log(e);
});