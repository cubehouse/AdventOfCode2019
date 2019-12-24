const Advent = new (require('./index.js'))(22, 2019);

class Deck {
    constructor(size, target, instr) {
        this.size = size;
        this.target = target;

        instr.forEach((s) => {
            if (s.indexOf('deal into new stack') === 0) {
                this.NewStack();
            } else if (s.indexOf('cut') === 0) {
                this.Cut(Number(s.split(' ')[1]));
            } else if (s.indexOf('deal with increment' === 0)) {
                this.Deal(Number(s.split(' ')[3]));
            } else {
                console.error(`Unknown op ${s}`);
            }
        });
    }

    NewStack() {
        this.target = this.size - this.target - 1;
    }

    Cut(num) {
        this.target = (this.target - num + this.size) % this.size;
    }

    Deal(num) {
        this.target = (this.target * num) % this.size;
    }
}

Advent.GetInput().then((input) => {
    const D = new Deck(10007, 2019, input);
    return Advent.Submit(D.target);
}).catch((e) => {
    console.log(e);
});