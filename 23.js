const Advent = new (require('./index.js'))(23, 2019);
const Intcode = require('./intcode');

class NetPC extends Intcode {
    constructor(input, ID) {
        super(input);

        this.ID = ID;

        this.inputs.push(this.ID);

        this.on('input', () => {
            if (this.inputs.length === 0) {
                this.Input(-1);
            }
        });

        this.WaitForPacket();
    }

    SendPacket(X, Y) {
        this.Input(X);
        this.Input(Y);
    }

    WaitForPacket() {
        return this.GetOutput().then((target) => {
            return this.GetOutput().then((X) => {
                return this.GetOutput().then((Y) => {
                    // emit packet for main program to deal with
                    this.emit('packet', target, X, Y);

                    // wait for another packet
                    setImmediate(this.WaitForPacket.bind(this));
                });
            });
        });
    }
}

Advent.GetInput().then((input) => {
    const AnswerPart1 = (ans) => {
        return Advent.Submit(ans).then(() => {
            process.exit(0);
        });
    };

    const PCs = new Array(50).fill(0).map((x, idx) => {
        const PC = new NetPC(input, idx);
        PC.on('packet', (target, X, Y) => {
            if (PCs[target] !== undefined) {
                PCs[target].SendPacket(X, Y);
            } else {
                if (target === 255) {
                    return AnswerPart1(Y);
                }
                console.log(target, X, Y);
            }
        });
        PC.Run();
        return PC;
    });

    
}).catch((e) => {
    console.log(e);
});