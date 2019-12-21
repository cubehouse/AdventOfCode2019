const Advent = new (require('./index.js'))(19, 2019);
const Screen = new (require('./screen'))({
    fps: 15,
}); 
const Intcode = require('./intcode');

Advent.GetInput().then((input) => {
    const Check = (x, y) => {
        const PC = new Intcode(input);
        PC.Input(x);
        PC.Input(y);
        return PC.Run().then(() => {
            return Promise.resolve({
                x,
                y,
                val: PC.output,
            });
        });
    };
    
    const gridSize = new Array(50).fill(0);
    Promise.all(gridSize.map((n, x) => {
        return Promise.all(gridSize.map((n, y) => {
            return Check(x, y);
        }));
    })).then((res) => {
        res.forEach((r) => {
            r.forEach((c) => {
                Screen.Set(c.x, c.y, c.val === 0 ? '.' : '#');
            });
        });

        const answer = Object.values(Screen.Grid).filter(cell => cell.val === '#').length;
        Advent.Submit(answer).then(() => {

        });
    });
}).catch((e) => {
    console.log(e);
});