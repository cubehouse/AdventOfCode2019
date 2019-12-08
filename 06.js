const Advent = new (require('./index.js'))(6, 2019);

const Orbits = {};
class Orbitter {
    constructor(ID, depth) {
        this.ID = ID;
        this.depth = depth;

        this.children = [];

        this.path = [];

        Orbits[this.ID] = this;
    }
}

Advent.GetInput().then((input) => {
    // parse input
    const objs = {};
    input.map((x) => x.split(')')).forEach((x) => {
        if (!objs[x[0]]) objs[x[0]] = [];
        objs[x[0]].push(x[1]);
    });

    let orbits = 0;

    // build tree
    const COM = new Orbitter('COM', 0);
    const todo = [COM];
    const BuildNode = (node) => {
        const children = objs[node.ID];
        if (children !== undefined) {
            children.forEach((c) => {
                const child = new Orbitter(c, node.depth + 1);

                // remember the path this node took for part 2
                child.path = node.path.concat(node.ID);

                node.children.push(child);
                todo.push(child);

                // calculate number of orbits as we go
                //  each orbit has 1 direct orbit, so just tally this as we count the indirect orbits
                orbits += (node.depth + 1);
            });
        }
    };
    while(todo.length > 0) {
        const next = todo.shift();
        BuildNode(next);
    }

    return Advent.Submit(orbits).then(() => {
        const pathToYOU = Orbits['YOU'].path;
        const pathToSAN = Orbits['SAN'].path;

        // trim identical paths from start until we find the unique parts of the path
        while(pathToYOU[0] === pathToSAN[0]) {
            pathToYOU.shift();
            pathToSAN.shift();
        }

        return Advent.Submit(pathToYOU.length + pathToSAN.length, 2);
    });
}).catch((e) => {
    console.log(e);
});