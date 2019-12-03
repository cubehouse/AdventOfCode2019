const Advent = new (require('./index.js'))(2, 2019);

Advent.GetInput().then((input) => {
    const RunProg = (input, a, b) => {
        const prog = input.split(',').map(Number);
        prog[1] = a;
        prog[2] = b;

        let PC = 0;
        const exec1 = () => {
            const cmd = prog[PC];
            if (cmd === 1) {
                prog[prog[PC+3]] = prog[prog[PC+1]] + prog[prog[PC+2]];
            } else if (cmd === 2) {
                prog[prog[PC+3]] = prog[prog[PC+1]] * prog[prog[PC+2]];
            } else if (cmd === 99) {
                return false;
            } else {
                console.error('UNKNOWN OPCODE ' + cmd);
                return false;
            }

            PC += 4;

            return true;
        };

        while(exec1()) {};

        return prog;
    }

    const prog1 = RunProg(input, 12, 2);

    return Advent.Submit(prog1[0]).then(() => {
        // puzzle 2
        for(let a=0; a<=99; a++) {
            for(let b=0; b<=99; b++) {
                const prog2 = RunProg(input, a, b);
                if (prog2[0] === 19690720) {
                    console.log(`Found answer: ${a}, ${b}`);
                    const answer2 = (a * 100) + b;
                    return Advent.Submit(answer2, 2);
                }
            }
        }

        console.error('Exhausted brute force!');
    });
}).catch((e) => {
    console.log(e);
});