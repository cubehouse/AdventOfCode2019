const Advent = new (require('./index.js'))(16, 2019);

class FFT {
    constructor(input, pattern = '0, 1, 0, -1') {
        this.signal = input.split('').map(Number);
        this.pattern = pattern.split(',').map(Number);

        // prebuild all our patterns for processing
        this.patterns = this.signal.map((x, idx) => {
            const p = [];
            let pIdx = 0;
            while(p.length <= this.signal.length) {
                const patternToAdd = new Array(idx + 1).fill(this.pattern[pIdx++ % this.pattern.length]);
                Array.prototype.push.apply(p, patternToAdd);
            }
            return p.slice(1, this.signal.length + 1);
        });
    }

    PhaseIdx(idx) {
        const pattern = this.patterns[idx];
        const patternNum = pattern.length;
        const Result = Math.abs(this.signal.reduce((p, x, idx) => {
            return p + (x * pattern[idx % patternNum]);
        }, 0) % 10);
        return Result;
    }

    Phase() {
        this.signal = this.signal.map((x, idx) => {
            return this.PhaseIdx(idx);
        });
    }

    PhaseX(num) {
        for(let i=0; i<num; i++) {
            this.Phase();
        }
    }
};

// Part 1 unit tests
const Example1 = new FFT('12345678');
Example1.Phase();
if (Example1.signal.join('') !== '48226158') throw new Error('Example 1 failed');
Example1.Phase();
if (Example1.signal.join('') !== '34040438') throw new Error('Example 1 failed');
Example1.Phase();
if (Example1.signal.join('') !== '03415518') throw new Error('Example 1 failed');
Example1.Phase();
if (Example1.signal.join('') !== '01029498') throw new Error('Example 1 failed');
const Example2 = new FFT('80871224585914546619083218645595');
Example2.PhaseX(100);
if (Example2.signal.slice(0, 8).join('') !== '24176176') throw new Error('Example 2 failed');
const Example3 = new FFT('19617804207202209144916044189917');
Example3.PhaseX(100);
if (Example3.signal.slice(0, 8).join('') !== '73745418') throw new Error('Example 3 failed');
const Example4 = new FFT('69317163492948606335995924319873');
Example4.PhaseX(100);
if (Example4.signal.slice(0, 8).join('') !== '52432133') throw new Error('Example 4 failed');

// part 1
Advent.GetInput().then((input) => {
    const Part1 = new FFT(input);
    Part1.PhaseX(100);
    return Advent.Submit(Part1.signal.slice(0, 8).join('')).then(() => {
        console.log('Done');
    });
}).catch((e) => {
    console.log(e);
});