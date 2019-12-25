const Advent = new (require('./index.js'))(22, 2019);

class Deck {
    constructor(size, target, instr) {
        this.size = size;
        this.target = target;
        
        this.is = instr.map((s) => {
            // so everything can be expressed as a form of ((t * a) - b)
            //  convert and then squish
            // two combined is:
            //  ((t * a) - b)   +++    ((t * X) - Y)
            //  ((t * X) - Y) * a) - b
            //    ===
            //  (t * aX) - (bX + y)
            if (s.indexOf('deal into new stack') === 0) {
                // a-t === (t * -1) - (-a)
                return {
                    type: this.MulMinus,
                    args: [-1, 1 - this.size],
                };
            } else if (s.indexOf('cut') === 0) {
                // (t - a) === (t * 1) - a
                return {
                    type: this.MulMinus,
                    args: [1, Number(s.split(' ')[1])],
                };
            } else if (s.indexOf('deal with increment' === 0)) {
                // (t * a) === (t * a) - 0
                return {
                    type: this.MulMinus,
                    args: [Number(s.split(' ')[3]), 0],
                };
            } else {
                return null;
            }
        });

        console.log(`Original function source: ${this.is.map((s) => {
            return s.type.apply(this, s.args);
        }).join('\n')}`);

        // crush instructions into a single line
        while (this.is.length > 1) {
            const newSquishedMethod = this.Simplify(this.is[0], this.is[1]);
            this.is.splice(0, 2, newSquishedMethod);
        }

        console.log(`\nOptimised down to: ${this.is.map((s) => {
            return s.type.apply(this, s.args);
        }).join('\n')}`);

        this.funcSrc = this.is.map((s) => {
            return s.type.apply(this, s.args);
        }).join('\n');

        // turn string into a callable function
        this.func = new Function(this.funcSrc);
    }

    ModToSize(a) {
        return ((a % this.size) + this.size) % this.size;
    }

    Simplify(a, b) {
        // take two instructions and combine them
        return {
            type: this.MulMinus,
            args: [
                this.ModToSize(a.args[0]) * b.args[0],
                this.ModToSize((a.args[1] * b.args[0]) + b.args[1]),
            ],
        }
    }

    MulMinus(num1, num2) {
        return `this.target = ((((this.target * ${num1}) - ${num2}) % ${this.size}) + ${this.size}) % ${this.size};`;
    }
}

Advent.GetInput().then((input) => {
    const D = new Deck(10007, 2019, input);
    D.func(); // run once
    return Advent.Submit((D.target + D.size) % D.size).then(() => {
        /*const D = new Deck(119315717514047, 2020, input);
        const perc = 101741582076661 / 100;
        for(let i=0; i<101741582076661; i++) {
            if ((i % perc) === 0) console.log('.');
            D.func();
        }
        return Advent.Submit((D.target + D.size) % D.size, 2);*/
    });
}).catch((e) => {
    console.log(e);
});