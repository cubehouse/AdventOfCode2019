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

class Moon {
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;

        this.velX = 0;
        this.velY = 0;
        this.velZ = 0;
    }

    ApplyGravity(other) {
        CalcVelocity(this, other, 'x', 'velX');
        CalcVelocity(this, other, 'y', 'velY');
        CalcVelocity(this, other, 'z', 'velZ');
    }

    Move() {
        this.x += this.velX;
        this.y += this.velY;
        this.z += this.velZ;
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
}

Advent.GetInput().then((input) => {
    const Moons = new System(input);//'<x=-8, y=-10, z=0>|<x=5, y=5, z=10>|<x=2, y=-7, z=3>|<x=9, y=-8, z=-3>'.split('|'));
    for(let i=0; i<1000; i++) {
        Moons.Tick();
    }
    const energy = Moons.moons.reduce((p, a) => {
        return p + a.TotalEnergy;
    }, 0);
    return Advent.Submit(energy).then(() => {
        console.log('Done');
    });
}).catch((e) => {
    console.log(e);
});