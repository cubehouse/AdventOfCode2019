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

    DecodePart2() {
        const Image = this.GetLayerPixels(this.layers.length - 1);
        for(let i=this.layers.length - 2; i>=0; i--) {
            const NewPixels = this.GetLayerPixels(i);
            NewPixels.forEach((p, idx) => {
                if (p !== 2) {
                    Image[idx] = p;
                }
            });
        }

        const splitRows = new RegExp(`.{1,${this.width}}`, 'g');
        const rows = Image.join('').match(splitRows);
        rows.forEach((row) => {
            console.log(row.split('').map((x)=> {
                return x === '1' ? 'X' : ' ';
            }).join(''));
        });

        return Image;
    }
}

Advent.GetInput().then((input) => {
    // puzzle answer 1
    const Image1 = new SpaceImage(25, 6, input);
    const answer1 = Image1.ValidatePart1();

    return Advent.Submit(answer1).then(() => {
        // puzzle answer 2
        Image1.DecodePart2();

        // Need to human-read this one :)
    });
}).catch((e) => {
    console.log(e);
});