const Advent = new (require('./index.js'))(21, 2019);
const Intcode = require('./intcode');

Advent.GetInput().then((input) => {
    const PC = new Intcode(input);
    PC.on('output', (out) => {
        if (out < 128) {
            process.stdout.write(String.fromCharCode(out));
        } else {
            console.log(out);
        }
    });
    `NOT A T
AND D J
NOT C J
AND D J
OR T J    
WALK`.split(/\n/g).map(PC.InputStr.bind(PC));
    return PC.Run().then(() => {
        return Advent.Submit(PC.output);
    });
}).catch((e) => {
    console.log(e);
});