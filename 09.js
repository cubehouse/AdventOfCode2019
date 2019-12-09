const Advent = new (require('./index.js'))(9, 2019);
const Intcode = require('./intcode');

Advent.GetInput().then((input) => {
    // TODO - puzzle answer 1
    const PC = new Intcode(input, 1);
    PC.Run().then((output) => {
        if (output.length > 1) {
            console.log(`Error handling opcode ${output[0]} at PC[${PC.PC-1}]`);
        }
    });

    /*return Advent.Submit(answer1).then(() => {
        // TODO - puzzle answer 2
        let answer2 = 0;

        //return Advent.Submit(answer2, 2);
    });*/
}).catch((e) => {
    console.log(e);
});