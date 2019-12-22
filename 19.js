const Advent = new (require('./index.js'))(19, 2019);
const Screen = new (require('./screen'))({
    fps: 15,
}); 
const Intcode = require('./intcode');

Advent.GetInput().then((input) => {
    const Cache = {};
    const Check = (x, y) => {
        const cacheKey = `${x},${y}`;
        if (Cache[cacheKey] !== undefined) return Promise.resolve(Cache[cacheKey]);

        const PC = new Intcode(input);
        PC.Input(x);
        PC.Input(y);
        return PC.Run().then(() => {
            const res = {
                x,
                y,
                val: PC.output,
            };
            Cache[cacheKey] = res;
            return Promise.resolve(res);
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
            const FindWidth = (y, startX = 0) => {
                const todo = [startX];
                const result = {
                    left: null,
                    right: null,
                    y,
                };
                const checkRowCell = (x) => {
                    return Check(x, y).then((res) => {
                        if (result.left === null) {
                            if (res.val === 1) {
                                result.left = x;
                            }
                            todo.push(x + 1);
                        } else {
                            if (res.val === 0) {
                                result.right = x - 1;
                            } else {
                                todo.push(x + 1);
                            }
                        }
                        return Promise.resolve();
                    });
                };
                return Screen.RunTodoList(todo, checkRowCell).then(() => {
                    return result;
                });
            };

            const targetSize = 100;

            let maxX = 0;
            const todo = [{
                y: 1200,
            }];
            let ans = null;
            const Step = (c) => {
                return FindWidth(c.y, maxX).then(res => {
                    maxX = Math.max(maxX, res.left) - 1;
                    if ((res.right - res.left) >= targetSize) {
                        return Check(res.right - targetSize + 1, c.y + targetSize - 1).then((cell) => {
                            if (cell.val === 1) {
                                ans = {x: res.right - targetSize + 1, y: c.y};
                                return Promise.resolve();
                            }

                            todo.push({y: c.y + 1});
                            return Promise.resolve();
                        });
                    }

                    todo.push({y: c.y + 1});
                    return Promise.resolve();
                });
            };
            return Screen.RunTodoList(todo, Step).then(() => {
                return Advent.Submit((ans.x * 10000) + ans.y, 2);
            });
        });
    });
}).catch((e) => {
    console.log(e);
});