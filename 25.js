const EventEmitter = require('events');
const util = require('util');
const blessed = require('blessed');

const Advent = new (require('./index.js'))(25, 2019);
const Intcode = require('./intcode');

screen = blessed.screen({
    smartCSR: true,
});
screen.key(['escape', 'q', 'C-c'], () => {
    process.exit(0);
});

const textArea = new blessed.box({
    bottom: 3,
    top: 0,
    left: 0,
    right: 40,
    tags: true,
    border: {
        type: 'line'
    },
});
screen.append(textArea);

const playerInput = new blessed.textbox({
    height: 3,
    bottom: 0,
    left: 0,
    right: 40,
    border: {
        type: 'line',
    },
    input: true,
    inputOnFocus: true,
    keys: true,
});
screen.append(playerInput);

const logBox = new blessed.box({
    right: 0,
    left: '100%-40',
    height: '100%',
    border: {
        type: 'line',
    },
});
const logHistory = [];
console.log = (...args) => {
    if (args.length > 0) {
        logHistory.unshift(args.map(x => {
            if (typeof x === 'string') return x;
            return util.inspect(x);
        }).join(' '));
        logBox.setContent(logHistory.join('\n'));
        screen.render();
    }
};
screen.append(logBox);

const mapBox = new blessed.box({
    right: 41,
    bottom: 4,
});
screen.append(mapBox);

screen.render();

const directions = {
    'up': 'north',
    'left': 'west',
    'right': 'east',
    'down': 'south',
    'n': 'north',
    's': 'south',
    'e': 'east',
    'w': 'west',
};

const compass = [
    'north', 'east', 'south', 'west',
];

const compassGrid = {
    'north': {x: 0, y: -1},
    'east': {x: 1, y: 0},
    'south': {x: 0, y: 1},
    'west': {x: -1, y: 0},
};

function ReverseCompass(dir) {
    return compass[(compass.indexOf(dir) + 2) % compass.length];
}

function combinations(arr) {
    var fn = function(active, rest, a) {
        if (active.length === 0 && rest.length === 0)
            return;
        if (rest.length === 0) {
            a.push(active);
        } else {
            fn(active.concat(rest[0]), rest.slice(1), a);
            fn(active, rest.slice(1), a);
        }
        return a;
    }
    return fn([], arr, []);
}

// some styles to jazz up the text adventure
const styles = [
    [/(==\s.+\s==)/g, '{white-bg}{black-fg}'],
    [/(- (?:north\b|south\b|east\b|west\b))/g, '{green-fg}'],
    [/(- (?!.*(north\b|south\b|east\b|west\b)).*)/g, '{blue-fg}'],
    [/^(Unrecognized .*)$/m, '{red-fg}'],
    [/^(You (?:ca|do)n't .*)$/m, '{red-fg}'],
    [/^(End)$/m, '{red-fg}'],
];

class Minimap {
    constructor() {
        this.grid = {};
        this.minX = null;
        this.maxX = null;
        this.minY = null;
        this.maxY = null;
    }

    Set(X, Y, char) {
        this.grid[`${X},${Y}`] = char;

        if (this.minX === null) {
            this.minX = X;
            this.maxX = X;
            this.minY = Y;
            this.maxY = Y;
        } else {
            this.minX = Math.min(this.minX, X);
            this.maxX = Math.max(this.maxX, X);
            this.minY = Math.min(this.minY, Y);
            this.maxY = Math.max(this.maxY, Y);
        }
    }

    get width() {
        if (this.minX === null) return 0;
        return this.maxX - this.minX;
    }
    
    get height() {
        if (this.minY === null) return 0;
        return this.maxY - this.minY;
    }

    Print() {
        if (this.minX === null) return '';
        const w = this.width;
        const h = this.height;
        const rows = [];
        for(let y=this.minY; y<=this.maxY; y++) {
            const row = [];
            for(let x=this.minX; x<=this.maxX; x++) {
                row.push(this.grid[`${x},${y}`] || ' ');
            }
            rows.push(row.join(''));
        }
        return rows.join('\n');
    }
}

class Game extends EventEmitter {
    constructor(PC) {
        super();

        this.PC = PC;

        this.stringBuffer = [];

        this.badItems = [];

        this.commandWaiting = false;
        this.commandQueue = [];

        // command history
        this.history = [];
        // track all locations the player navigates
        this.locations = {};
        // current location name
        this.location = null;
        // player inventory
        this.inv = [];

        // minimap grid
        //  game map overlaps and isn't on a grid, which makes me sad
        //  but I started writing it and I like it, so it's staying
        this.map = new Minimap();

        this.PC.on('output', this.OnOutpurChar.bind(this));
        this.PC.on('done', () => {
            this.stringBuffer = this.stringBuffer.concat('\nEnd'.split(''));
            this.FlushBuffer();
        });

        playerInput.on('submit', () => {
            const cmd = playerInput.value;
            if (cmd === 'q') process.exit(0);
            this.Command(cmd);
            playerInput.clearValue();
        });
    }

    QueueCommand(str) {
        if (this.commandWaiting) {
            this.Command(str);
        } else {
            this.commandQueue.push(str);
        }
    }

    Command(str) {
        if (!this.commandWaiting) {
            this.QueueCommand(str);
            return;
        }

        if (directions[str] !== undefined) {
            this.Command(directions[str]);
            return;
        }
        if (str === 'take all' || str === 't') {
            const items = this.locations[this.location].items;
            if (items.length > 0) {
                items.forEach((i) => {
                    this.Command(`take ${i}`);
                });
                return;
            }
        }
        if (str === 'drop all' || str === 'd') {
            this.inv.forEach(i => {
                this.Command(`drop ${i}`);
            });
            return;
        }
        this.history.push(str);
        console.log(str);
        this.commandWaiting = false;
        this.emit('exec', str);
        this.PC.InputStr(str);
    }

    get LastDirection() {
        const dirs = ['north', 'south', 'east', 'west'];
        const historyCopy = this.history.slice(0);
        historyCopy.reverse();
        return historyCopy.find(x => dirs.indexOf(x) >= 0);
    }

    ParseRoom(text) {
        const hasDoors = text.indexOf('Doors here lead:');
        const hasItems = text.indexOf('Items here:');
        const IsLocation = (hasDoors > 0 || hasItems > 0);
        if (!IsLocation) return undefined;

        const locationName = /(.+)\s==/.exec(text)[1];
        const locationDesc = text.slice(locationName.length + 4, hasDoors > 0 ? hasDoors : hasItems).replace(/\n+$/, '');

        const doors = [];
        if (hasDoors > 0) {
            const doorsText = text.slice(hasDoors, hasItems > 0 ? hasItems : undefined);
            const doorFinder = /\-\s+(.+)/g;
            let match;
            while(match = doorFinder.exec(doorsText)) {
                doors.push(match[1]);
            }
        }

        const items = [];
        if (hasItems > 0) {
            const itemsText = text.slice(hasItems);
            const itemFinder = /\-\s+(.+)/g;
            let match;
            while(match =itemFinder.exec(itemsText)) {
                // ignore silly items that are annoying
                if (this.badItems.indexOf(match[1]) < 0) {
                    items.push(match[1]);
                }
            }
        }

        const roomData = {
            name: locationName,
            desc: locationDesc,
            doors,
            items,
            text: '== ' + text.replace(/\n+Command\?$/, ''),
            dirs: {},
            x: null,
            y: null,
        };

        if (this.locations[roomData.name] === undefined) {
            roomData.doors.forEach(d => roomData.dirs[d] = null);
            this.locations[roomData.name] = roomData;
            if (Object.keys(this.locations).length === 1) {
                // first room! give it (0,0)
                roomData.x = 0;
                roomData.y = 0;
                this.map.Set(0, 0, 'X');
            }
        } else {
            // update fields of existing room
            ['desc', 'doors',' items', 'text'].forEach(k => {
                this.locations[roomData.name][k] = roomData[k];
            });
        }

        return this.locations[roomData.name];
    }

    GenerateRoomText(loc) {
        return `== ${loc.name} ==\n${loc.desc}${loc.doors.length > 0 ? '\n\nDoors here lead:\n' + (loc.doors.map(x => `- ${x}`).join('\n')) : ''}${loc.items.length > 0 ? '\n\nItems here:\n' + (loc.items.map(x => `- ${x}`).join('\n')): ''}`;
    }

    FlushBuffer() {
        // parse information from screen
        const text = this.stringBuffer.join('').split(/\n==\s+/);

        const itemMatch = /You (take|drop) the (.+)\./.exec(text);
        if (itemMatch) {
            if (itemMatch[1] === 'take') {
                this.locations[this.location].items.splice(this.locations[this.location].items.indexOf(itemMatch[2]), 1);
                this.inv.push(itemMatch[2]);
                this.inv.sort();
            } else {
                this.locations[this.location].items.push(itemMatch[2]);
                this.inv.splice(this.inv.indexOf(itemMatch[2]), 1);
            }
        }

        const currentRoom = this.locations[this.location];
        
        const rooms = text.slice(1).map(this.ParseRoom.bind(this));
        rooms.filter(x => x !== undefined).forEach((room, idx) => {
            if (idx === 0) {
                // first room visited through this command is evaluated for connections
                if (currentRoom !== undefined) {
                    const directionBack = ReverseCompass(this.LastDirection);
                    room.dirs[directionBack] = currentRoom.name;
                    currentRoom.dirs[this.LastDirection] = room.name;

                    if (currentRoom.x !== null) {
                        const lastDelta = compassGrid[this.LastDirection];
                        room.x = currentRoom.x + lastDelta.x;
                        room.y = currentRoom.y + lastDelta.y;
                        this.map.Set(room.x * 2, room.y * 2, '.');

                        room.doors.forEach((d) => {
                            const delta = compassGrid[d];
                            this.map.Set(
                                (room.x * 2) + delta.x,
                                (room.y * 2) + delta.y,
                                delta.x !== 0 ? '-' : '|',
                            );
                        });
                    }
                }
            }

            const prevRoom = this.CurrentRoom;
            if (prevRoom !== undefined && prevRoom.x !== undefined) {
                this.map.Set(prevRoom.x * 2, prevRoom.y * 2, '.');
            }
            
            this.location = room.name;

            const newRoom = this.CurrentRoom;
            if (newRoom.x !== undefined) {
                this.map.Set(newRoom.x * 2, newRoom.y * 2, 'X');
            }

            this.emit('room', room);
        });

        if (rooms.filter(x => x !== undefined).length === 0) {
            const loc = this.locations[this.location];
            this.stringBuffer = this.GenerateRoomText(loc).split('').concat(this.stringBuffer);
        }

        const terminalText = this.stringBuffer.join('').replace(/\-\s(north|east|south|west)\b/g, (match, dir) => {
            // add room destinations to screen output
            const room = this.CurrentRoom.dirs[dir];
            if (room) {
                return `- ${dir} [${room}]`
            } else {
                return `- ${dir} [???]`;
            }
        }).replace(/^\n+/g, ''); // remove leading new lines
        textArea.setContent(styles.reduce((p, n) => {
            // apply styles to output text
            return p.replace(n[0], `${n[1]}$1{/}`);
        }, terminalText));

        mapBox.width = this.map.width + 1;
        mapBox.height = this.map.height + 1;
        mapBox.setContent(this.map.Print());

        screen.render();

        this.stringBuffer = [];
    }

    get CurrentRoom() {
        return this.locations[this.location];
    }

    OnOutpurChar(char) {
        if (char <= 125) {
            if (char === 10) {
                this.stringBuffer.push('\n');
            } else {
                const asciiChar = String.fromCharCode(char);
                this.stringBuffer.push(asciiChar);

                if (this.stringBuffer.slice(-8).join('') === 'Command?') {
                    this.commandWaiting = true;

                    this.stringBuffer = this.stringBuffer.slice(0, -8);
                    this.FlushBuffer();

                    if (this.commandQueue.length > 0) {
                        this.Command(this.commandQueue.shift());
                    } else {
                        playerInput.focus();
                        this.emit('command');
                    }
                }
            }
        }
    }

    GetPath(a, b) {
        const A = this.locations[a];
        const B = this.locations[b];

        if (A === undefined || B === undefined) {
            return undefined;
        }

        const todo = [{
            cell: A,
            path: [],
        }];
        const visited = {};
        while(todo.length > 0) {
            const cell = todo.shift();
            if (cell.cell.x === B.x && cell.cell.y === B.y) {
                return cell.path;
            }

            const key = `${cell.cell.x},${cell.cell.y}`;
            visited[key] = true;

            // queue up each direction
            cell.cell.doors.map(x => {
                const diff = compassGrid[x];
                return {
                    x: cell.cell.x + diff.x,
                    y: cell.cell.y + diff.y,
                    dir: x,
                };
            }).forEach(pos => {
                const nextLoc = Object.values(this.locations).find(x => x.x === pos.x && x.y === pos.y);
                if (nextLoc !== undefined && visited[`${nextLoc.x},${nextLoc.y}`] === undefined) {
                    todo.push({
                        cell: nextLoc,
                        path: cell.path.concat(pos.dir),
                    });
                }
            });
        }
        return undefined;
    }
}

Advent.GetInput().then((input) => {
    const PC = new Intcode(input);
    const G = new Game(PC);
    G.badItems.push('giant electromagnet');
    G.badItems.push('molten lava');
    G.badItems.push('photons');
    G.badItems.push('infinite loop');
    G.badItems.push('escape pod');

    PC.Run().then(() => {
        // we made it out of the checkpoint! check the output text for the password
        const answerMatch = /You should be able to get in by typing (\d+) on the keypad at the main airlock/.exec(textArea.content);
        if (answerMatch) {
            return Advent.Submit(answerMatch[1]).then(() => {
                process.exit(0);
            });
        }
        console.log('Done');
    });

    // initial auto-run commands
    //  this sequence picks up all my items and sits at the Security Checkpoint
    const commandsToRun = 'ntswtntwntetnetwstwnwntsweesswtwn'.split('');
    commandsToRun.push('tryitems');
    commandsToRun.forEach(G.Command.bind(G));

    const TakeDropForInv = (newInv) => {
        newInv.forEach(i => {
            if (G.inv.indexOf(i) < 0) {
                G.Command(`take ${i}`);
            }
        });
        G.inv.forEach(i => {
            if (newInv.indexOf(i) < 0) {
                G.Command(`drop ${i}`);
            }
        });
    };

    // after auto-run commands are done, run back to the start for no real reason other than to prove this out
    /*G.once('command', () => {
        const RouteToStart = G.GetPath(G.CurrentRoom.name, 'Hull Breach');
        if (RouteToStart.length > 0) {
            RouteToStart.forEach(G.Command.bind(G));
        }
    });*/
    G.on('exec', (cmd) => {
        if (cmd === 'tryitems') {
            // pick up all the items then run this command
            //  my set is hypercube, mouse, prime number, wreath
            const todo = combinations(G.inv);
            todo.reverse();
            const step = () => {
                const c = todo.shift();
                if (!c) return;
                TakeDropForInv(c);
                G.GetPath(G.CurrentRoom.name, 'Pressure-Sensitive Floor').forEach(G.Command.bind(G));
                G.once('command', () => {
                    if (G.CurrentRoom.name === 'Security Checkpoint') {
                        const match = /are (lighter|heavier) than the/.exec(textArea.content);
                        if (match && match[1] === 'lighter') {
                            // remove all todo items that have at least the current set
                            for(let i=0; i<todo.length; i++) {
                                if (c.filter(x => todo[i].indexOf(x) >= 0).length === c.length) {
                                    todo.splice(i, 1);
                                    i--;
                                }
                            }
                        }
                        // bounced back to the checkpoint, so try again
                        setImmediate(step);
                    }
                });
            };
            setImmediate(step);
        }
    });
}).catch((e) => {
    console.log(e);
});