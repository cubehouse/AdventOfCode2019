const Advent = new (require('./index.js'))(22, 2019);

class Deck {
    constructor(size, instr) {
        this.size = size;
        
        const instructions = instr.map((s) => {
            // each instruction can be expressed as a form of ((t * a) + b)
            //  given a1, b1 and a2, b2 from two sequential operations:
            //  (((t * a1) + b1) * a2) + b2
            //   ===
            //  (t * a1 * a2) + ((b1 * a1) + b2)
            //  so after smushing, a = a1 * a2, and b = (b1 * a1) + b2
            //  (see CombineSteps function)
            if (s.indexOf('deal into new stack') === 0) {
                // s-t === (t * -1) + (s - 1)
                return [-1, -1]; // no need to actually add deck size since it will be modulo'd away
            } else if (s.indexOf('cut') === 0) {
                // (t - a) === (t * 1) + -a
                return [1, -Number(s.split(' ')[1])];
            } else if (s.indexOf('deal with increment' === 0)) {
                // (t * a) === (t * a) + 0
                return [Number(s.split(' ')[3]), 0];
            } else {
                return null;
            }
        });

        const squished = this.CombineSteps(instructions);
        this.a = squished[0];
        this.b = squished[1];
    }

    Step(input, a, b) {
        if (a === undefined) {
            return this.Mod((this.a * input) + this.b);
        }
        return this.Mod((a * input) + b);
    }

    CombineSteps(steps) {
        return steps.reduce((p, n) => {
            return [
                this.Mod(p[0] * n[0]),
                this.Mod((p[1] * n[0]) + n[1]),
            ];
        }, [1, 0])
    }

    Mod(input) {
        return ((input + this.size) % this.size) % this.size;
    }
}

Advent.GetInput().then((input) => {
    const D = new Deck(10007, input);
    const answer = D.Step(2019);
    return Advent.Submit(answer).then(() => {
        //const D = new Deck(119315717514047, input);
        //const answer2 = D.Run(2020, 101741582076661);
    });
}).catch((e) => {
    console.log(e);
});