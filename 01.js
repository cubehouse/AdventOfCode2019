const Advent = new (require('./index.js'))(1, 2019);

const CalculateFuel = (input) => {
    return Math.floor(input / 3) - 2;
};

const CalculateFuel2 = (input) => {
    let total = 0;
    let x = input;
    while(true) {
        x = CalculateFuel(x);
        if (x > 0) {
            total += x;
        } else {
            return total;
        }
    }
};

Advent.GetInput().then((input) => {
    const total = input.reduce((prev, x) => prev + CalculateFuel(Number(x)), 0);
    return Advent.Submit(total).then(() => {
        const total2 = input.reduce((prev, x) => prev + CalculateFuel2(Number(x)), 0);
        return Advent.Submit(total2, 2);
    });
}).catch((e) => {
    console.log(e);
});