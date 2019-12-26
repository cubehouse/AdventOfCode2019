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
    }
};
screen.append(logBox);

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

function ReverseCompass(dir) {
    return compass[(compass.indexOf(dir) + 2) % compass.length];
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

class Game extends EventEmitter {
    constructor(PC) {
        super();

        this.PC = PC;

        this.stringBuffer = [];

        // command history
        this.history = [];
        // track all locations the player navigates
        this.locations = {};
        // current location name
        this.location = null;
        // player inventory
        this.inv = [];

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
        playerInput.on('cancel', () => {
            playerInput.focus();
        });
    }

    Command(str) {
        if (directions[str] !== undefined) {
            this.Command(directions[str]);
            return;
        }
        if (str === 'take all') {
            const items = this.locations[this.location].items;
            if (items.length > 0) {
                items.forEach((i) => {
                    this.Command(`take ${i}`);
                });
                return;
            }
        }
        if (str === 'drop all') {
            this.inv.forEach(i => {
                this.Command(`drop ${i}`);
            });
            return;
        }
        this.history.push(str);
        console.log(str);
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
                items.push(match[1]);
            }
        }

        const roomData = {
            name: locationName,
            desc: locationDesc,
            doors,
            items,
            text: '== ' + text.replace(/\n+Command\?$/, ''),
            dirs: {},
        };

        if (this.locations[roomData.name] === undefined) {
            roomData.doors.forEach(d => roomData.dirs[d] = null);
            this.locations[roomData.name] = roomData;
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
                    currentRoom[this.LastDirection] = room.name;
                }
            }
            
            this.location = room.name;

            this.emit('room', room);
        });

        if (rooms.filter(x => x !== undefined).length === 0) {
            const loc = this.locations[this.location];
            this.stringBuffer = this.GenerateRoomText(loc).split('').concat(this.stringBuffer);
        }

        // utter chaos, but I'm reusing my map drawing lib, so I guess this is how it is
        const terminalText = this.stringBuffer.join('').replace(/\-\s(north|east|south|west)\b/g, (match, dir) => {
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
                    this.stringBuffer = this.stringBuffer.slice(0, -8);
                    this.FlushBuffer();

                    playerInput.setContent('');
                    playerInput.focus();

                    this.emit('command');
                }
            }
        }
    }
}

Advent.GetInput().then((input) => {
    const PC = new Intcode(input);
    const G = new Game(PC);
    PC.Run().then(() => {
        console.log(G.stringBuffer.join(''));
        console.log('Done');
    });

    G.on('command', () => {
        if (G.CurrentRoom.items.length > 0) {
            //G.Command('take all');
        } else {

        }
        //console.log(G.CurrentRoom.dirs);
        //console.log(G.LastDirection);
    });
}).catch((e) => {
    console.log(e);
});