const Advent = new (require('./index.js'))(14, 2019);

class Nanofactory {
    constructor(input) {
        // parse recipes
        this.recipes = input.map((x) => {
            const parts = x.split(' => ');
            const io = parts.map((io) => {
                return io.split(',').map((ingr) => {
                    const match = /(\d+)\s+(\w+)/.exec(ingr);
                    return {
                        mat: match[2],
                        num: Number(match[1]),
                    };
                });
            });
            return {
                i: io[0],
                o: io[1],
            };
        });

        // build object of outputs to the recipes that can make them
        this.outputs = {};
        this.recipes.forEach((r) => {
            r.o.forEach((o) => {
                this.outputs[o.mat] = r;
            });
        });
    }

    Part1() {
        // what we still need to process
        const needs = [{
            mat: 'FUEL',
            num: 1,
        }, {
            mat: 'ORE',
            num: 0,
        }];

        const spareMaterial = {};

        const AddNeed = (material, num) => {
            // push our new input to our need list
            const existingNeed = needs.find(x => x.mat === material);
            if (!existingNeed) {
                // push an empty need, we'll populate this properly as we go
                needs.unshift({mat: material, num: num});
            } else {
                existingNeed.num += num;
            }
        };

        const ProcessNeed = () => {
            const need = needs.shift();
            const material = need.mat;
            let numNeeded = need.num;

            // skip if we don't need any of this material
            if (numNeeded === 0) {
                return;
            }

            // check if we already have some of this material
            if (spareMaterial[material]) {
                const spareUsed = Math.min(spareMaterial[material], numNeeded);
                numNeeded -= spareUsed;
                spareMaterial[material] -= spareUsed;
            } else {
                spareMaterial[material] = 0;
            }

            // find recipe to make this material
            const recipe = this.outputs[material];
            while (numNeeded > 0) {
                // add inputs for recipe as new needs
                recipe.i.forEach((i) => {
                    AddNeed(i.mat, i.num);
                });
                // track how many these inputs have satisfied
                numNeeded -= recipe.o[0].num;

                // if we have gone over, add the spares to our pile in case they can be used later
                if (numNeeded < 0) {
                    spareMaterial[material] += -numNeeded;
                    numNeeded = 0;
                }
            }
        };

        while(needs.length > 1) {
            ProcessNeed();
        }

        return {
            oreNeeded: needs[0].num,
            spareMaterials: spareMaterial,
        };
    }
}

function TestInput(input, ore) {
    const Tester = new Nanofactory(input.split(/\n/g));
    const Result = Tester.Part1();
    if (Result.oreNeeded !== ore) {
        throw new Error('Test Failed');
    }
}

// example tests
TestInput(`10 ORE => 10 A
1 ORE => 1 B
7 A, 1 B => 1 C
7 A, 1 C => 1 D
7 A, 1 D => 1 E
7 A, 1 E => 1 FUEL`, 31);
TestInput(`9 ORE => 2 A
8 ORE => 3 B
7 ORE => 5 C
3 A, 4 B => 1 AB
5 B, 7 C => 1 BC
4 C, 1 A => 1 CA
2 AB, 3 BC, 4 CA => 1 FUEL`, 165);
TestInput(`157 ORE => 5 NZVS
165 ORE => 6 DCFZ
44 XJWVT, 5 KHKGT, 1 QDVJ, 29 NZVS, 9 GPVTF, 48 HKGWZ => 1 FUEL
12 HKGWZ, 1 GPVTF, 8 PSHF => 9 QDVJ
179 ORE => 7 PSHF
177 ORE => 5 HKGWZ
7 DCFZ, 7 PSHF => 2 XJWVT
165 ORE => 2 GPVTF
3 DCFZ, 7 NZVS, 5 HKGWZ, 10 PSHF => 8 KHKGT`, 13312);
TestInput(`2 VPVL, 7 FWMGM, 2 CXFTF, 11 MNCFX => 1 STKFG
17 NVRVD, 3 JNWZP => 8 VPVL
53 STKFG, 6 MNCFX, 46 VJHF, 81 HVMC, 68 CXFTF, 25 GNMV => 1 FUEL
22 VJHF, 37 MNCFX => 5 FWMGM
139 ORE => 4 NVRVD
144 ORE => 7 JNWZP
5 MNCFX, 7 RFSQX, 2 FWMGM, 2 VPVL, 19 CXFTF => 3 HVMC
5 VJHF, 7 MNCFX, 9 VPVL, 37 CXFTF => 6 GNMV
145 ORE => 6 MNCFX
1 NVRVD => 8 CXFTF
1 VJHF, 6 MNCFX => 4 RFSQX
176 ORE => 6 VJHF`, 180697);
TestInput(`171 ORE => 8 CNZTR
7 ZLQW, 3 BMBT, 9 XCVML, 26 XMNCP, 1 WPTQ, 2 MZWV, 1 RJRHP => 4 PLWSL
114 ORE => 4 BHXH
14 VRPVC => 6 BMBT
6 BHXH, 18 KTJDG, 12 WPTQ, 7 PLWSL, 31 FHTLT, 37 ZDVW => 1 FUEL
6 WPTQ, 2 BMBT, 8 ZLQW, 18 KTJDG, 1 XMNCP, 6 MZWV, 1 RJRHP => 6 FHTLT
15 XDBXC, 2 LTCX, 1 VRPVC => 6 ZLQW
13 WPTQ, 10 LTCX, 3 RJRHP, 14 XMNCP, 2 MZWV, 1 ZLQW => 1 ZDVW
5 BMBT => 4 WPTQ
189 ORE => 9 KTJDG
1 MZWV, 17 XDBXC, 3 XCVML => 2 XMNCP
12 VRPVC, 27 CNZTR => 2 XDBXC
15 KTJDG, 12 BHXH => 5 XCVML
3 BHXH, 2 VRPVC => 7 MZWV
121 ORE => 7 VRPVC
7 XCVML => 6 RJRHP
5 BHXH, 4 VRPVC => 5 LTCX`, 2210736);

Advent.GetInput().then((input) => {
    const Machine1 = new Nanofactory(input);
    const Result = Machine1.Part1();
    return Advent.Submit(Result.oreNeeded).then(() => {
        console.log('Done');
    });
}).catch((e) => {
    console.log(e);
});