const Advent = new (require('./index.js'))(7, 2019);
const Intcode = require('./intcode');

const RunSequence = (input, sequence) => {
    return new Promise((resolve) => {
        // build our PCs
        const PCs = sequence.split(',').map(Number).map((seq, idx) => {
            const PC = new Intcode(input);
            PC.Input(seq);

            if (idx === 0) {
                PC.Input(0);
            }

            PC.on('output', (a) => {
                const NextPC = (idx + 1) % PCs.length;
                //console.log(`Output from PC ${idx}: ${a} => Input to PC ${NextPC}`);

                // resolve if we're trying to pass input to a finished PC
                if (PCs[NextPC].done) {
                    return resolve(a);
                }

                // push our output to the next PC's input stack
                PCs[NextPC].Input(a);
            });

            PC.Run();

            return PC;
        });
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
        if (res !== 54321) throw new Error('Unit test 2 failed');
    });
    RunSequence('3,31,3,32,1002,32,10,32,1001,31,-2,31,1007,31,0,33,1002,33,7,33,1,33,31,31,1,32,31,31,4,31,99,0,0,0', '1,0,4,3,2').then((res) => {
        if (res !== 65210) throw new Error('Unit test 3 failed');
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