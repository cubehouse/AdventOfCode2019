const Advent = new (require('./index.js'))(16, 2019);

class FFT {
    constructor(input, pattern = '0, 1, 0, -1') {
        this.signal = Array.isArray(input) ? input : input.split('').map(Number);
        this.pattern = pattern.split(',').map(Number);
        this.signalNum = this.signal.length;
    }

    CalcIdx(idx) {
        let signalIdx = idx;
        let result = 0;
        let add = true;
        while(signalIdx < this.signalNum) {
            const arr = this.signal.slice(signalIdx, signalIdx + idx + 1);
            const newNum = arr.reduce((p, x) => p+x, 0);
            if (add) {
                result += newNum;
                add = false;
            } else {
                result -= newNum;
                add = true;
            }
            signalIdx += (idx + 1) * 2;
        }
        result = Math.abs(result % 10);
        this.signal[idx] = result;
        return result;
    }

    Phase(startIdx = 0) {
        for(let i=startIdx; i<this.signalNum; i++) {
            this.CalcIdx(i);
        }
    }

    PhaseX(num) {
        for(let i=0; i<num; i++) {
            this.Phase();
        }
    }

    Phase2() {
        for(let x=0; x<100; x++) {
            for(let i=this.signal.length - 2; i>=0; i--) {
                this.signal[i] = (this.signal[i] + this.signal[i + 1]) % 10;
            }
        }
    }
};

try {
    // Part 1 unit tests
    const Example1 = new FFT('12345678');
    Example1.Phase();
    if (Example1.signal.join('') !== '48226158') throw new Error('Example 1 failed ' + Example1.signal.join(''));
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
} catch(e) {
    console.error(e);
}

// part 1
Advent.GetInput().then((input) => {
    const Part1 = new FFT(input);
    Part1.PhaseX(100);
    return Advent.Submit(Part1.signal.slice(0, 8).join('')).then(() => {
        // build new input
        const offset = Number(input.slice(0, 7));
        const input2 = input.repeat(10000).slice(offset).split('').map(Number);
        const Part2 = new FFT(input2);
        Part2.Phase2();
        return Advent.Submit(Part2.signal.slice(0, 8).join(''), 2);
    });
}).catch((e) => {
    console.log(e);
});