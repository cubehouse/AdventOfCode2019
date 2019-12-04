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
        const ValidStep2 = (x) => {
            // remove groups of 3 or more
            const str = x.toString().replace(/(\d)\1{2,}/g, '');

            // re-calculate adjacent digits
            let hasAdjacentDigits = false;
            for(let i=0; i<str.length-1; i++) {
                if (str[i] === str[i+1]) {
                    return true;
                }
            }
            return false;
        };

        // filter existing passwords from part 1
        const part2Digits = validDigits.filter(ValidStep2);

        return Advent.Submit(part2Digits.length, 2);
    });
}).catch((e) => {
    console.log(e);
});
