const EventEmitter = require('events');

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
    constructor(program, input = 0) {
        super();

        this.PC = 0;
        this.memory = program.split(',').map(Number);

        this.input = input;
        this.output = undefined;

        this.done = false;

        this.ops = {
            1: (a, b, out) => {
                this.memory[out] = a + b;
                return Promise.resolve();
            },
            2: (a, b, out) => {
                this.memory[out] = a * b;
                return Promise.resolve();
            },
            3: (out) => {
                this.memory[out] = this.input;
                return Promise.resolve();
            },
            4: (a) => {
                this.output = a;
                return Promise.resolve(this.output);
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
                argNames: args,
            };
        });
    }

    Tick() {
        if (!this.done) {
            // parse opcode
            const opStr = this.memory[this.PC].toString().padStart(8, '0');
            const op = Number(opStr.slice(-2));

            const func = this.ops[op];
            if (func) {
                const funcData = this.funcs[op];
                this.PC++;

                // build param mode array
                const paramModes = [];
                for(let i=opStr.length-3; i>=0; i--) {
                    paramModes.push(Number(opStr[i]));
                }
                
                // build arguments to pass to opcode function
                const args = [];
                for(let i=0; i<funcData.argNum; i++) {
                    // get param mode (any arg name starting with out is always in immediate mode though)
                    const paramMode = funcData.argNames[i].indexOf('out') === 0 ? 1 : paramModes[i];
                    const val = this.memory[this.PC + i];
                    switch(paramMode) {
                        case 0:
                            // position mode
                            args.push(this.memory[val]);
                            break;
                        case 1:
                            // immediate mode
                            args.push(val);
                            break;
                        default:
                            return Promise.reject(new Error(`Unknown parameter mode: ${paramMode} for opCode ${opStr} [MEM#${this.PC}]\n${this.memory}`));
                    }
                }

                this.PC += funcData.argNum;

                // call Opcode function
                return func.apply(this, args);
            } else {
                return Promise.reject(new Error(`Unknown opcode: ${op} [MEM#${this.PC}]\n${this.memory}`));
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
    const Test = (program, input = 0) => {
        const PC = new Com(program, input);
        return PC.Run().then(() => {
            return Promise.resolve(PC);
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

    Test('1002,4,3,4,33').then((PC) => {
        AssertMemory(PC, '1002,4,3,4,99');
    });
    Test('1101,100,-1,4,0').then((PC) => {
        AssertMemory(PC, '1101,100,-1,4,99');
    });
    Test('3,0,4,0,99', 1).then((PC) => {
        Assert(PC.output === 1);
    });

    // Day 5 input and solution
    Test(`3,225,1,225,6,6,1100,1,238,225,104,0,1101,48,82,225,102,59,84,224,
    1001,224,-944,224,4,224,102,8,223,223,101,6,224,224,1,223,224,223,1101,92,
    58,224,101,-150,224,224,4,224,102,8,223,223,1001,224,3,224,1,224,223,223,
    1102,10,89,224,101,-890,224,224,4,224,1002,223,8,223,1001,224,5,224,1,224,
    223,223,1101,29,16,225,101,23,110,224,1001,224,-95,224,4,224,102,8,223,223,
    1001,224,3,224,1,223,224,223,1102,75,72,225,1102,51,8,225,1102,26,16,225,
    1102,8,49,225,1001,122,64,224,1001,224,-113,224,4,224,102,8,223,223,1001,
    224,3,224,1,224,223,223,1102,55,72,225,1002,174,28,224,101,-896,224,224,4,
    224,1002,223,8,223,101,4,224,224,1,224,223,223,1102,57,32,225,2,113,117,224,
    101,-1326,224,224,4,224,102,8,223,223,101,5,224,224,1,223,224,223,1,148,13,
    224,101,-120,224,224,4,224,1002,223,8,223,101,7,224,224,1,223,224,223,4,223,
    99,0,0,0,677,0,0,0,0,0,0,0,0,0,0,0,1105,0,99999,1105,227,247,1105,1,99999,
    1005,227,99999,1005,0,256,1105,1,99999,1106,227,99999,1106,0,265,1105,1,
    99999,1006,0,99999,1006,227,274,1105,1,99999,1105,1,280,1105,1,99999,1,225,
    225,225,1101,294,0,0,105,1,0,1105,1,99999,1106,0,300,1105,1,99999,1,225,225,
    225,1101,314,0,0,106,0,0,1105,1,99999,8,677,226,224,102,2,223,223,1006,224,
    329,101,1,223,223,107,677,677,224,1002,223,2,223,1006,224,344,101,1,223,223,
    8,226,677,224,102,2,223,223,1006,224,359,101,1,223,223,107,226,226,224,102,
    2,223,223,1005,224,374,1001,223,1,223,1108,677,226,224,1002,223,2,223,1006,
    224,389,101,1,223,223,107,677,226,224,102,2,223,223,1006,224,404,1001,223,1,
    223,1107,226,677,224,1002,223,2,223,1006,224,419,1001,223,1,223,108,677,677,
    224,102,2,223,223,1005,224,434,1001,223,1,223,1008,677,226,224,1002,223,2,
    223,1006,224,449,1001,223,1,223,7,226,677,224,1002,223,2,223,1006,224,464,
    1001,223,1,223,1007,677,677,224,102,2,223,223,1005,224,479,1001,223,1,223,
    1007,226,226,224,1002,223,2,223,1005,224,494,1001,223,1,223,108,226,226,224,
    1002,223,2,223,1005,224,509,1001,223,1,223,1007,226,677,224,1002,223,2,223,
    1006,224,524,101,1,223,223,1107,677,677,224,102,2,223,223,1005,224,539,101,
    1,223,223,1107,677,226,224,102,2,223,223,1005,224,554,1001,223,1,223,108,
    677,226,224,1002,223,2,223,1006,224,569,1001,223,1,223,1108,226,677,224,
    1002,223,2,223,1006,224,584,101,1,223,223,8,677,677,224,1002,223,2,223,1006,
    224,599,1001,223,1,223,1008,226,226,224,102,2,223,223,1006,224,614,101,1,
    223,223,7,677,677,224,1002,223,2,223,1006,224,629,101,1,223,223,1008,677,
    677,224,102,2,223,223,1005,224,644,101,1,223,223,7,677,226,224,1002,223,2,
    223,1005,224,659,101,1,223,223,1108,226,226,224,102,2,223,223,1006,224,674,
    1001,223,1,223,4,223,99,226`, 1).then((PC) => {
        Assert(PC.output === 13547311);
    });
}