const EventEmitter = require('events');
const AdventLib = require('./index.js');

const ParseArgs = (f) => {
    // https://stackoverflow.com/a/6922026
    const args = f.toString ().replace (/[\r\n\s]+/g, ' ').
              match (/(?:function\s*\w*)?\s*(?:\((.*?)\)|([^\s]+))/).
              slice (1,3).
              join ('').
              split (/\s*,\s*/);
    if (args.length === 1 && args[0] === '') return [];
    return args;
};

class Com extends EventEmitter {
    constructor(program) {
        super();

        this.PC = 0;
        this.memory = program.split(',').map(Number);

        this.done = false;

        this.ops = {
            1: (a, b, out) => {
                this.memory[out] = this.memory[a] + this.memory[b];
                return Promise.resolve();
            },
            2: (a, b, out) => {
                this.memory[out] = this.memory[a] * this.memory[b];
                return Promise.resolve();
            },
            99: () => {
                this.done = true;
                return Promise.resolve();
            },
        };

        this.funcs = {};
        this.Setup();
    }

    Setup() {
        // parse our intcode function params
        Object.keys(this.ops).forEach((opCode) => {
            const args = ParseArgs(this.ops[opCode]);
            this.funcs[opCode] = {
                argNum: args.length,
            };
        });
    }

    Tick() {
        if (!this.done) {
            const op = this.memory[this.PC];
            const func = this.ops[op];
            if (func) {
                const funcData = this.funcs[op];
                this.PC++;
                
                // build arguments to pass to opcode function
                const args = [];
                for(let i=0; i<funcData.argNum; i++) {
                    args.push(this.memory[this.PC + i]);
                }

                this.PC += funcData.argNum;

                // call Opcode function
                return func.apply(this, args);
            } else {
                return Promise.reject(new Error(`Unknown opcode: ${op} [MEM#${this.PC}]`));
            }
        }
    }

    Run() {
        return new Promise((resolve, reject) => {
            const outputs = [];

            const WhileRun = () => {
                if (this.done) {
                    return resolve(outputs);
                }
                return this.Tick().then((out) => {
                    if (out !== undefined) {
                        outputs.push(out);
                        this.emit('output', out);
                    }
                    process.nextTick(WhileRun);
                }).catch((err) => {
                    return reject(err);
                });
            };

            WhileRun();
        });
    }
}

module.exports = Com;

if (!module.parent) {
    // unit tests
    const Test = (input) => {
        const PC = new Com(input);
        return PC.Run().then((result) => {
            return Promise.resolve(PC, result);
        });
    };
    const Assert = (cond, fail) => {
        if (!cond) {
            throw new Error(fail ? fail : 'Unit test error failure');
        }
    };
    const AssertMemory = (PC, ExpectedMem) => {
        Assert(PC.memory.join(',') === ExpectedMem);
    };

    Test('1,0,0,3,99').then((PC) => {
        Assert(PC.memory[3] === 2);
    });
    Test('1,0,0,0,99').then((PC) => {
        AssertMemory(PC, '2,0,0,0,99');
    });
    Test('2,3,0,3,99').then((PC) => {
        AssertMemory(PC, '2,3,0,6,99');
    });
    Test('2,4,4,5,99,0').then((PC) => {
        AssertMemory(PC, '2,4,4,5,99,9801');
    });
    Test('1,1,1,4,99,5,6,0,99').then((PC) => {
        AssertMemory(PC, '30,1,1,4,2,5,6,0,99');
    });
    Test('1,9,10,3,2,3,11,0,99,30,40,50').then((PC) => {
        Assert(PC.memory[0] === 3500);
        Assert(PC.memory[3] === 70);
    });

    // my Part 2 inputs and correct solutions
    Test(`1,12,2,3,1,1,2,3,1,3,4,3,1,5,0,3,2,1,6,19,1,19,5,23,2,13,23,27,1,10,
27,31,2,6,31,35,1,9,35,39,2,10,39,43,1,43,9,47,1,47,9,51,2,10,51,55,1,55,9,59,
1,59,5,63,1,63,6,67,2,6,67,71,2,10,71,75,1,75,5,79,1,9,79,83,2,83,10,87,1,87,
6,91,1,13,91,95,2,10,95,99,1,99,6,103,2,13,103,107,1,107,2,111,1,111,9,0,99,2
,14,0,0`).then((PC) => {
        Assert(PC.memory[0] === 2692315);
    });
    Test(`1,95,7,3,1,1,2,3,1,3,4,3,1,5,0,3,2,1,6,19,1,19,5,23,2,13,23,27,1,10,
27,31,2,6,31,35,1,9,35,39,2,10,39,43,1,43,9,47,1,47,9,51,2,10,51,55,1,55,9,59,
1,59,5,63,1,63,6,67,2,6,67,71,2,10,71,75,1,75,5,79,1,9,79,83,2,83,10,87,1,87,
6,91,1,13,91,95,2,10,95,99,1,99,6,103,2,13,103,107,1,107,2,111,1,111,9,0,99,2
,14,0,0`).then((PC) => {
        Assert(PC.memory[0] === 19690720);
    });
}