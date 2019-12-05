class PC {
    constructor(instructions) {
        // program counter
        this.PC = 0;

        this.memory = instructions.split(',').map(Number);

        // add our finished opcode initially so it's always here
        this.opcodes = {
            99: {
                code: 99,
                args: 0,
                func: (pc) => {
                    pc.finished = true;
                },
            },
        };

        this.finished = false;
    }

    AddOpcode({code, args, func}) {
        this.opcodes[code] = {
            code,
            args,
            func
        };
    }

    Exec() {
        const op = this.opcodes[this.memory[this.PC]];
        if (op === undefined) {
            throw new Error(`Unknown opcode ${this.memory[this.PC]}`);
        }

        const args = [this].concat(this.memory.slice(this.PC + 1, this.PC + 1 + op.args));

        op.func.apply(this, args);

        this.PC += op.args + 1;
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
}

class Task2PC extends PC {
    constructor(instructions) {
        super(instructions);

        this.AddOpcode({
            code: 1,
            args: 3,
            func: (pc, a, b, out) => {
                pc.Set(out, pc.Get(a) + pc.Get(b));
            },
        });

        this.AddOpcode({
            code: 2,
            args: 3,
            func: (pc, a, b, out) => {
                pc.Set(out, pc.Get(a) * pc.Get(b));
            },
        });
    }
}

module.exports = PC;

if (!module.parent) {
    const TestPC = (input, output) => {
        const P = new Task2PC(input);
        while(!P.Finished) {
            P.Exec();
        }
        const result = P.memory.join(',');
        if (result !== output) {
            throw new Error(`Failed PC:\n${input}\n${result}\nShould be:\n${output}`);
        }
    };

    TestPC('1,0,0,0,99', '2,0,0,0,99');
    TestPC('2,3,0,3,99', '2,3,0,6,99');
    TestPC('2,4,4,5,99,0', '2,4,4,5,99,9801');
    TestPC('1,1,1,4,99,5,6,0,99', '30,1,1,4,2,5,6,0,99');
    TestPC('1,9,10,3,2,3,11,0,99,30,40,50', '3500,9,10,70,2,3,11,0,99,30,40,50');
    
    console.log('Tests successful!');
}