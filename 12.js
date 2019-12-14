const Advent = new (require('./index.js'))(12, 2019);

function CalcVelocity(a, b, key, velKey) {
    if (a[key] < b[key]) {
        a[velKey]++;
        b[velKey]--;
    } else if (a[key] !== b[key]) {
        a[velKey]--;
        b[velKey]++;
    }
}

const gcd = (a, b) => a ? gcd(b % a, a) : b;
const lcm = (a, b) => a * b / gcd(a, b);

class Moon {
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;

        this.velX = 0;
        this.velY = 0;
        this.velZ = 0;

        this.originX = x;
        this.originY = y;
        this.originZ = z;
    }

    ApplyGravityX(other) {
        CalcVelocity(this, other, 'x', 'velX');
    }
    ApplyGravityY(other) {
        CalcVelocity(this, other, 'y', 'velY');
    }
    ApplyGravityZ(other) {
        CalcVelocity(this, other, 'z', 'velZ');
    }

    ApplyGravity(other) {
        this.ApplyGravityX(other);
        this.ApplyGravityY(other);
        this.ApplyGravityZ(other);
    }

    MoveX() {
        this.x += this.velX;
    }
    MoveY() {
        this.y += this.velY;
    }
    MoveZ() {
        this.z += this.velZ;
    }

    Move() {
        this.MoveX();
        this.MoveY();
        this.MoveZ();
    }

    get PotentialEnergy() {
        return Math.abs(this.x) + Math.abs(this.y) + Math.abs(this.z);
    }

    get KineticEnergy() {
        return Math.abs(this.velX) + Math.abs(this.velY) + Math.abs(this.velZ);
    }

    get TotalEnergy() {
        return this.PotentialEnergy * this.KineticEnergy;
    }

    Reset() {
        this.x = this.originX;
        this.y = this.originY;
        this.z = this.originZ;
        this.velX = 0;
        this.velY = 0;
        this.velZ = 0;
    }
}

class System { 
    constructor(input) {
        this.moons = input.map((m) => {
            const match = /x=(.+), y=(.+), z=([^>]+)/.exec(m);
            const [x,y,z] = match.slice(1, 4).map(Number);
            return new Moon(x, y, z);
        });
    }

    ForEachPair(fn) {
        for(let a=0; a<this.moons.length - 1; a++) {
            for(let b=a+1; b<this.moons.length; b++) {
                fn(this.moons[a], this.moons[b], a, b);
            }
        }
    }

    ForEach(fn) {
        this.moons.forEach(fn);
    }

    Tick() {
        this.ForEachPair((a, b) => {
            a.ApplyGravity(b);
        });
        this.ForEach((a) => {
            a.Move();
        });
    }

    FindCycles() {
        return [
            this.FindCyclesCoord('x', 'velX', 'originX'),
            this.FindCyclesCoord('y', 'velY', 'originY'),
            this.FindCyclesCoord('z', 'velZ', 'originZ'),
        ].reduce(lcm, 1);
    }

    FindCyclesCoord(key, velKey, originKey) {
        // reset our moons before calculating each cycle
        this.ForEach((x) => {
            x.Reset();
        });

        const GravFunc = `ApplyGravity${key.toUpperCase()}`;
        const MoveFunc = `Move${key.toUpperCase()}`;

        const Step = () => {
            this.ForEachPair((a, b) => {
                a[GravFunc](b);
            });
            this.ForEach((a) => {
                a[MoveFunc]();
            });
        };

        let stepCount = 0;
        while(true) {
            Step();
            stepCount++;

            const diffMoon = this.moons.find((a) => {
                return (a[key] !== a[originKey] || a[velKey] !== 0);
            });

            if (diffMoon === undefined) {
                return stepCount;
            }
        }
    }
}

Advent.GetInput().then((input) => {
    const Moons = new System(input);
    for(let i=0; i<1000; i++) {
        Moons.Tick();
    }
    const energy = Moons.moons.reduce((p, a) => {
        return p + a.TotalEnergy;
    }, 0);
    return Advent.Submit(energy).then(() => {
        // unit tests
        const Example1 = '<x=-1, y=0, z=2>|<x=2, y=-10, z=-7>|<x=4, y=-8, z=8>|<x=3, y=5, z=-1>'.split('|');
        const MoonsExample1 = new System(Example1);
        if (MoonsExample1.FindCycles() !== 2772) {
            throw new Error('Example 1 failed');
        }
        const Example2 = '<x=-8, y=-10, z=0>|<x=5, y=5, z=10>|<x=2, y=-7, z=3>|<x=9, y=-8, z=-3>'.split('|');
        const MoonsExample2 = new System(Example2);
        if (MoonsExample2.FindCycles() !== 4686774924) {
            throw new Error('Example 2 failed');
        }

        const MoonsPart2 = new System(input);
        const answer2 = MoonsPart2.FindCycles();
        return Advent.Submit(answer2, 2).then(() => {
            console.log('Done');
        });
    });
}).catch((e) => {
    console.log(e);
});