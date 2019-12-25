const Advent = new (require('./index.js'))(22, 2019);

class Deck {
    constructor(size, instr) {
        this.size = size;
        
        const instructions = instr.map((s) => {
            // so everything can be expressed as a form of ((t * a) - b)
            //  convert and then squish
            // two combined is:
            //  ((t * a) - b)   +++    ((t * X) - Y)
            //  ((t * X) - Y) * a) - b
            //    ===
            //  (t * aX) - (bX + y)
            if (s.indexOf('deal into new stack') === 0) {
                // a-t === (t * -1) - (-a)
                return [-1, 1 - this.size];
            } else if (s.indexOf('cut') === 0) {
                // (t - a) === (t * 1) - a
                return [1, Number(s.split(' ')[1])];
            } else if (s.indexOf('deal with increment' === 0)) {
                // (t * a) === (t * a) - 0
                return [Number(s.split(' ')[3]), 0];
            } else {
                return null;
            }
        });

        const r = this.SimplifyArr(instructions);
        this.a = r[0];
        this.b = r[1];
    }

    Run(x) {
        return this.Mul(x, this.a, this.b);
    }

    ModToSize(a) {
        return ((a % this.size) + this.size) % this.size;
    }

    SimplifyArr(arr) {
        return arr.reduce((p, n) => {
            return this.Simplify(p, n);
        }, [1, 0])
    }

    Simplify(a, b) {
        // take two instructions and combine them
        return [
            this.ModToSize(this.ModToSize(a[0]) * this.ModToSize(b[0])),
            this.ModToSize((a[1] * b[0]) + this.ModToSize(b[1])),
        ];
    }

    Mul(x, num1, num2) {
        return this.ModToSize((x * num1) - num2);
    }
}

Advent.GetInput().then((input) => {
    const D = new Deck(10007, input);
    const answer = D.Run(2019);
    return Advent.Submit(answer).then(() => {
        //const D = new Deck(119315717514047, input);
        //const answer2 = D.Run(2020, 101741582076661);
    });
}).catch((e) => {
    console.log(e);
});