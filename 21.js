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
        return Advent.Submit(PC.output).then(() => {
            const PC2 = new Intcode(input);
            PC2.on('output', (out) => {
                if (out < 128) {
                    process.stdout.write(String.fromCharCode(out));
                } else {
                    console.log(out);
                }
            });
            `OR A J
            AND B J
            AND C J
            NOT J J
            OR E T
            OR H T
            AND D T
            AND T J
            RUN`.split(/\n/g).map(PC2.InputStr.bind(PC2));
            return PC2.Run().then(() => {
                return Advent.Submit(PC2.output, 2);
            });
        });
    });
}).catch((e) => {
    console.log(e);
});