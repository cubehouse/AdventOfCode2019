const Advent = new (require('./index.js'))(8, 2019);

class SpaceImage {
    constructor(w, h, data) {
        this.width = w;
        this.height = h;

        const splitRows = new RegExp(`.{1,${this.width}}`, 'g');
        const rows = data.match(splitRows);
        this.layers = [];
        while(rows.length > 0) {
            this.layers.push(rows.splice(0, this.height).map((row) => {
                return row.split('').map(Number);
            }));
        }
    }

    GetLayerPixels(layerID) {
        const pixels = [];
        this.layers[layerID].forEach((row) => {
            row.forEach((pixel) => {
                pixels.push(pixel);
            });
        })
        return pixels;
    }

    ValidatePart1() {
        let lowestZeros = (this.width * this.height) + 1;
        const layerID = this.layers.reduce((p, layer, layerID) => {
            const zeroes = this.GetLayerPixels(layerID).filter((x) => x === 0).length;
            if (p === null || lowestZeros > zeroes) {
                lowestZeros = zeroes;
                return layerID;
            } else {
                return p;
            }
        }, null);

        const pixels = this.GetLayerPixels(layerID);
        const ones = pixels.filter((x) => x === 1);
        const twos = pixels.filter((x) => x === 2);
        return ones.length * twos.length;
    }
}

Advent.GetInput().then((input) => {
    // puzzle answer 1
    const Image1 = new SpaceImage(25, 6, input);
    const answer1 = Image1.ValidatePart1();

    return Advent.Submit(answer1).then(() => {
        // TODO - puzzle answer 2
        let answer2 = 0;

        //return Advent.Submit(answer2, 2);
    });
}).catch((e) => {
    console.log(e);
});