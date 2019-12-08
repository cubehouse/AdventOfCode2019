const Advent = new (require('./index.js'))(5, 2019);
const PC = require('./intcode');

Advent.GetInput().then((input) => {
    
    // run our program against our intcode PC with input 1
    const PC1 = new PC(input, 1);
    return PC1.Run().then(() => {
        return Advent.Submit(PC1.output).then(() => {

            // run same program but with input 5
            const PC2 = new PC(input, 5);
            return PC2.Run().then(() => {
                return Advent.Submit(PC2.output, 2);
            });
        });
    });
}).catch((e) => {
    console.log(e);
});