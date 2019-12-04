const Advent = new (require('./index.js'))(4, 2019);

Advent.GetInput().then((input) => {
    // puzzle answer 1
    const [min, max] = input.split('-').map(Number);

    const IsPWValid = (x) => {
        const str = x.toString();
        const strLen = str.length;
        const strNums = str.split('').map(Number);
        if (strLen !== 6) return false;
        let hasAdjacentDigits = false;
        for(let i=0; i<5; i++) {
            if (str[i] === str[i+1]) {
                hasAdjacentDigits = true;
            }
            if (strNums[i] > strNums[i+1]) {
                return false;
            }
        }
        if (!hasAdjacentDigits) return false;

        return true;
    };

    const digits = [];
    for(let i=min; i<=max; i++) {
        digits.push(i);
    }

    const validDigits = digits.filter(IsPWValid);

    return Advent.Submit(validDigits.length).then(() => {
        // TODO - puzzle answer 2
        let answer2 = 0;

        //return Advent.Submit(answer2, 2);
    });
}).catch((e) => {
    console.log(e);
});