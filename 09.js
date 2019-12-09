const Advent = new (require('./index.js'))(9, 2019);
const Intcode = require('./intcode');

Advent.GetInput().then((input) => {
    // puzzle answer 1
    const PC = new Intcode(input, 1);
    return PC.Run().then(() => {
        return Advent.Submit(PC.output).then(() => {
            // puzzle answer 2
            const PC2 = new Intcode(input, 2);
            return PC2.Run().then(() => {
                return Advent.Submit(PC2.output, 2);
            });
        });
    });

}).catch((e) => {
    console.log(e);
});