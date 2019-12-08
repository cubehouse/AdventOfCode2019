const Advent = new (require('./index.js'))(7, 2019);
const Intcode = require('./intcode');

const RunSequence = (input, sequence) => {
    return new Promise((resolve) => {
        let lastOutput = 0;
        let PCIdx = 0;

        const RunNextPC = () => {
            if (PCs[PCIdx]) {
                PCs[PCIdx].Run().then((outputs) => {
                    lastOutput = outputs[outputs.length - 1];
                    RunNextPC();
                });
                PCIdx++;
            } else {
                return resolve(lastOutput);
            }
        };

        // build our PCs
        const PCs = sequence.split(',').map(Number).map((seq, idx) => {
            const PC = new Intcode(input);

            const inputs = [seq];
            if (idx === 0) inputs.push(0);

            PC.on('input', (PC) => {
                if (inputs.length > 0) {
                    PC.input = inputs.shift();
                } else {
                    PC.input = lastOutput;
                }
            });

            return PC;
        });

        RunNextPC();
    });
};

// https://stackoverflow.com/a/56847118
const rotations = ([l, ...ls], right=[]) =>
l ? [[l, ...ls, ...right], ...rotations(ls, [...right, l])] : []

const permutations = ([x, ...xs]) =>
x ? permutations(xs).flatMap((p) => rotations([x, ...p])) : [[]]

Advent.GetInput().then((input) => {
    RunSequence('3,15,3,16,1002,16,10,16,1,16,15,15,4,15,99,0,0', '4,3,2,1,0').then((res) => {
        if (res !== 43210) throw new Error('Unit test 1 failed');
    });
    RunSequence('3,23,3,24,1002,24,10,24,1002,23,-1,23,101,5,23,23,1,24,23,23,4,23,99,0,0', '0,1,2,3,4').then((res) => {
        if (res !== 54321) throw new Error('Unit test 1 failed');
    });
    RunSequence('3,31,3,32,1002,32,10,32,1001,31,-2,31,1007,31,0,33,1002,33,7,33,1,33,31,31,1,32,31,31,4,31,99,0,0,0', '1,0,4,3,2').then((res) => {
        if (res !== 65210) throw new Error('Unit test 1 failed');
    });

    // build all permutations of our input phases
    const values = "01234";
    const perms = permutations(values);

    let highest = 0;
    perms.reduce((p, n) => {
        return p.then(() => {
            return RunSequence(input, n.join(',')).then((val) => {
                highest = Math.max(highest, val);
                return Promise.resolve();
            });
        });
    }, Promise.resolve()).then(() => {
        return Advent.Submit(highest).then(() => {
            // TODO - part 2
            //return Advent.Submit(answer2, 2);
        });
    });
}).catch((e) => {
    console.log(e);
});