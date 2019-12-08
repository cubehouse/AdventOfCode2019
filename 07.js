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

const FindHighestSequence = (input, values) => {
    // build all permutations of our input phases
    const perms = permutations(values);

    let highest = 0;
    return perms.reduce((p, n) => {
        return p.then(() => {
            return RunSequence(input, n.join(',')).then((val) => {
                highest = Math.max(highest, val);
                return Promise.resolve();
            });
        });
    }, Promise.resolve()).then(() => {
        return Promise.resolve(highest);
    })
};

// https://stackoverflow.com/a/56847118
const rotations = ([l, ...ls], right=[]) =>
l ? [[l, ...ls, ...right], ...rotations(ls, [...right, l])] : []

const permutations = ([x, ...xs]) =>
x ? permutations(xs).flatMap((p) => rotations([x, ...p])) : [[]]

Advent.GetInput().then((input) => {
    // part 1 unit tests
    RunSequence('3,15,3,16,1002,16,10,16,1,16,15,15,4,15,99,0,0', '4,3,2,1,0').then((res) => {
        if (res !== 43210) throw new Error('Unit test 1 failed');
    });
    RunSequence('3,23,3,24,1002,24,10,24,1002,23,-1,23,101,5,23,23,1,24,23,23,4,23,99,0,0', '0,1,2,3,4').then((res) => {
        if (res !== 54321) throw new Error('Unit test 2 failed');
    });
    RunSequence('3,31,3,32,1002,32,10,32,1001,31,-2,31,1007,31,0,33,1002,33,7,33,1,33,31,31,1,32,31,31,4,31,99,0,0,0', '1,0,4,3,2').then((res) => {
        if (res !== 65210) throw new Error('Unit test 3 failed');
    });

    // part 2 unit tests
    RunSequence('3,26,1001,26,-4,26,3,27,1002,27,2,27,1,27,26,27,4,27,1001,28,-1,28,1005,28,6,99,0,0,5', '9,8,7,6,5').then((res) => {
        if (res !== 139629729) throw new Error('Unit test 4 failed');
    });
    RunSequence('3,52,1001,52,-5,52,3,53,1,52,56,54,1007,54,5,55,1005,55,26,1001,54,-5,54,1105,1,12,1,53,54,53,1008,54,0,55,1001,55,1,55,2,53,55,53,4,53,1001,56,-1,56,1005,56,6,99,0,0,0,0,10', '9,7,8,5,6').then((res) => {
        if (res !== 18216) throw new Error('Unit test 5 failed');
    });

    // part 1
    return FindHighestSequence(input, "01234").then((highest) => {
        return Advent.Submit(highest).then(() => {
            // part 2
            return FindHighestSequence(input, "56789").then((highest2) => {
                return Advent.Submit(highest2, 2);
            });
        });
    });
}).catch((e) => {
    console.log(e);
});