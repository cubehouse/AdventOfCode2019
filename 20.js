const Advent = new (require('./index.js'))(20, 2019);

Advent.GetInput().then((input) => {
    // TODO - puzzle answer 1
    let answer1 = 0;

    /*return Advent.Submit(answer1).then(() => {
        // TODO - puzzle answer 2
        let answer2 = 0;

        return Advent.Submit(answer2, 2);
    });*/
}).catch((e) => {
    console.log(e);
});