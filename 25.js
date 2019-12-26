const EventEmitter = require('events');

const Advent = new (require('./index.js'))(25, 2019);
const Screen = new (require('./screen'))({
    logWidth: 40,
});
const Intcode = require('./intcode');
const blessed = require('blessed');

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
Screen.AddStyle(/(==\s.+\s==)/g, '{white-bg}{black-fg}');
Screen.AddStyle(/(- (?:north\b|south\b|east\b|west\b))/g, '{green-fg}');
Screen.AddStyle(/(- (?!.*(north\b|south\b|east\b|west\b)).*)/g, '{blue-fg}');
Screen.AddStyle(/^(Unrecognized .*)$/, '{red-fg}');
Screen.AddStyle(/^(You can't .*)$/, '{red-fg}');
Screen.AddStyle(/^(End)$/, '{red-fg}');

class Game extends EventEmitter {
    constructor(PC) {
        super();

        this.PC = PC;
        this.y = 0;

        this.stringBuffer = [];

        Screen.mapBox.bottom = 2;
        Screen.logBox.bottom = 2;
        this.inputBox = blessed.textbox({
            name: "textBox",
            input: true,
            inputOnFocus: true,
            bottom: 0,
            left: 0,
            height: 1,
            width: "100%",
            style: {
                fg: "white",
                bg: "black",
                focus: {
                    fg: "yellow"
                },
                underline: true
            },
            keys: true,
        });
        Screen.screen.append(this.inputBox);

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

        this.inputBox.on('submit', () => {
            const cmd = this.inputBox.value;
            if (cmd === 'q') process.exit(0);
            this.Command(cmd);
            this.inputBox.clearValue();
        });
        this.inputBox.on('cancel', () => {
            this.inputBox.focus();
        });
    }

    Command(str) {
        if (directions[str] !== undefined) {
            this.Command(directions[str]);
            return;
        }
        if (str === 'take all') {
            this.locations[this.location].items.forEach((i) => {
                this.Command(`take ${i}`);
            });
            return;
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
            this.stringBuffer = `== ${loc.name} ==\n${loc.desc}${loc.doors.length > 0 ? '\n\nDoors here lead:\n' + (loc.doors.map(x => `- ${x}`).join('\n')) : ''}${loc.items.length > 0 ? '\n\nItems here:\n' + (loc.items.map(x => `- ${x}`).join('\n')): ''}`.split('').concat(this.stringBuffer);
        }

        this.y = 0;
        // we have a location, reset the screen
        Screen.Clear();

        let x = 0;
        // utter chaos, but I'm reusing my map drawing lib, so I guess this is how it is
        const terminalText = this.stringBuffer.join('').replace(/\-\s(north|east|south|west)\b/g, (match, dir) => {
            const room = this.CurrentRoom.dirs[dir];
            if (room) {
                return `- ${dir} [${room}]`
            } else {
                return `- ${dir} [???]`;
            }
        });
        terminalText.split('').forEach((char) => {
            if (char === '\n') {
                // skip leading empty lines
                if (x === 0 && this.y === 0) return;
                this.y++;
                x = 0;
            } else {
                if (x >= Screen.mapBox.width) {
                    x = 0;
                    this.y++;
                }
                Screen.Set(x, this.y, char);
            }
            x++;
        });

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
                    this.FlushBuffer();

                    this.inputBox.setContent('');
                    this.inputBox.focus();

                    this.emit('command');
                }
            }
            if (this.y - Screen.minY > Screen.mapBox.height) {
                Screen.minY++;
                const KeysToRemove = Object.values(Screen.Grid).filter(x=>x.y < Screen.minY).map(x => `${x.x},${x.y}`);
                KeysToRemove.forEach(x => delete Screen.Grid[x]);
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
        //console.log(G.CurrentRoom.dirs);
        //console.log(G.LastDirection);
    });
}).catch((e) => {
    console.log(e);
});