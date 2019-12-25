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
                    this.emit('packet', target, X, Y, this.ID);

                    // wait for another packet
                    setImmediate(this.WaitForPacket.bind(this));
                });
            });
        });
    }
}

Advent.GetInput().then((input) => {
    const AnswerPart1 = (ans) => {
        return Advent.Submit(ans);
    };

    let Part1Done = false;
    let Part2Done = false;

    const NATLastPacket = {
        x: -1,
        y: -1,
    };

    let LastSentY = -1;

    const PCs = new Array(50).fill(0).map((x, idx) => {
        const PC = new NetPC(input, idx);
        PC.on('packet', (target, X, Y, source) => {
            if (PCs[target] !== undefined) {
                PCs[target].SendPacket(X, Y);
            } else {
                if (!Part1Done && target === 255) {
                    Part1Done = true;
                    AnswerPart1(Y);
                }
                if (target === 255) {
                    NATLastPacket.x = X;
                    NATLastPacket.y = Y;
                } else {
                    console.log(target, X, Y, source);
                }
            }
        });
        PC.Run();
        return PC;
    });

    setInterval(() => {
        if (!Part1Done || NATLastPacket.x < 0) return;
        const findActivePC = PCs.find((P) => {
            return P.inputs.filter(x => x < 0).length > 0;
        });
        if (findActivePC === undefined) {
            if (NATLastPacket.y === LastSentY) {
                if (!Part2Done) {
                    Part2Done = true;
                    return Advent.Submit(LastSentY, 2).then(() => {
                        process.exit(0);
                    });
                }
            }
            LastSentY = NATLastPacket.y;
            PCs[0].Input(NATLastPacket.x);
            PCs[0].Input(NATLastPacket.y);
        }
    }, 1000);
}).catch((e) => {
    console.log(e);
});