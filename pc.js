const EventEmitter = require('events');

class PC extends EventEmitter {
    constructor(instructions) {
        super();

        // program counter
        this.PC = 0;

        this.memory = instructions.split(',').map(Number);

        // add our finished opcode initially so it's always here
        this.opcodes = {
            99: {
                args: 0,
                func: (pc) => {
                    pc.finished = true;
                    pc.emit('done');
                    return Promise.resolve();
                },
            },
        };

        this.finished = false;
    }

    AddOpcode({code, args, func}) {
        this.opcodes[code] = {
            args,
            func
        };
    }

    Exec() {
        if (!this.Finished) {
            const opcode = this.memory[this.PC];
            const op = this.opcodes[opcode];
            if (op === undefined) {
                throw new Error(`Unknown opcode ${opcode}`);
            }

            const args = [this].concat(this.memory.slice(this.PC + 1, this.PC + 1 + op.args));

            return op.func.apply(this, args).then((result) => {
                this.PC += op.args + 1;

                return Promise.resolve(result);
            });
        } else {
            return Promise.resolve();
        }
    }

    Get(idx) {
        return this.memory[idx];
    }

    Set(idx, value) {
        this.memory[idx] = value;
    }

    get Finished() {
        return this.finished;
    }

    Run() {
        return new Promise((resolve) => {
            const outputs = [];

            const WhileRun = () => {
                if (this.finished) {
                    return resolve(outputs);
                }
                return this.Exec().then((out) => {
                    if (out !== undefined) {
                        outputs.push(out);
                        this.emit('output', out);
                    }
                    process.nextTick(WhileRun);
                });
            };

            WhileRun();
        });
    }
}

class Task2PC extends PC {
    constructor(instructions) {
        super(instructions);

        this.AddOpcode({
            code: 1,
            args: 3,
            func: (pc, a, b, out) => {
                pc.Set(out, pc.Get(a) + pc.Get(b));
                return Promise.resolve();
            },
        });

        this.AddOpcode({
            code: 2,
            args: 3,
            func: (pc, a, b, out) => {
                pc.Set(out, pc.Get(a) * pc.Get(b));
                return Promise.resolve();
            },
        });
    }
}

class Task5PC extends Task2PC {
    constructor(instructions) {
        super(instructions);

        this.AddOpcode({
            code: 3,
            args: 1,
            func: (pc, target) => {
                pc.Set(target, 1);
                return Promise.resolve();
            },
        });

        this.AddOpcode({
            code: 4,
            args: 1,
            func: (pc, target) => {
                return Promise.resolve(pc.Get(target));
            },
        })
    }
}

module.exports = PC;

if (!module.parent) {
    const TestPC = (PCClass, input, memoryResult, outputResult) => {
        const P = new PCClass(input);
        return P.Run().then((outputs) => {
            if (memoryResult) {
                const result = P.memory.join(',');
                if (result !== memoryResult) {
                    throw new Error(`Failed PC:\n${input}\n${result}\nShould be:\n${memoryResult}`);
                }
            }

            if (outputResult) {
                const outputString = outputs.join(',');
                if (outputString !== outputResult) {
                    throw new Error(`Failed PC output:\n${input}\n${outputString}\nShould be:\n${outputResult}`);
                }
            }

            return Promise.resolve(outputs);
        });
    };

    Promise.all([
        TestPC(Task2PC, '1,0,0,0,99', '2,0,0,0,99'),
        TestPC(Task2PC, '2,3,0,3,99', '2,3,0,6,99'),
        TestPC(Task2PC, '2,4,4,5,99,0', '2,4,4,5,99,9801'),
        TestPC(Task2PC, '1,1,1,4,99,5,6,0,99', '30,1,1,4,2,5,6,0,99'),
        TestPC(Task2PC, '1,9,10,3,2,3,11,0,99,30,40,50', '3500,9,10,70,2,3,11,0,99,30,40,50'),
        TestPC(Task5PC, '4,2,99', null, '99'),
        TestPC(Task5PC, '3,3,4,4,99', '3,3,4,1,99', '3'),
    ]).then(() => {
        console.log('Tests successful!');
    });
}