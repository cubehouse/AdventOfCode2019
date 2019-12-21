require('dotenv').config();

const quietMode = false;

const fs = require('fs');
const util = require('util');
const path = require('path');
const http = require('https');
const querystring = require('querystring');
const { PerformanceObserver, performance } = require('perf_hooks');

const year = 2019;
const session = process.env.AOCSESSION;
if (!session) {
    console.error('No session token found');
    process.exit(1);
}

const obs = new PerformanceObserver((items) => {
    if (!quietMode) console.log(`Took ${(items.getEntries()[0].duration / 1000).toFixed(2)} seconds`);
    performance.clearMarks();
});
obs.observe({ entryTypes: ['measure'] });
performance.mark('A');
function exitHandler(e) {
    if (e) {
        console.error(e);
    }
    performance.mark('B');
    performance.measure('A to B', 'A', 'B');
}
process.on('exit', exitHandler);
process.on('SIGINT', exitHandler);
process.on('SIGUSR1', exitHandler);
process.on('SIGUSR2', exitHandler);
process.on('uncaughtException', exitHandler);

if (!module.parent) {
    const inputsDir = path.join(__dirname, 'inputs');
    if (!fs.existsSync(inputsDir)) {
        fs.mkdirSync(inputsDir);
    }

    for(let i=1; i<=25; i++) {
        const entryFileName = path.join(__dirname, i.toString().padStart(2, '0') + '.js');
        if (fs.existsSync(entryFileName)) continue;
        fs.writeFileSync(entryFileName, `const Advent = new (require('./index.js'))(${i}, ${year});

Advent.GetInput().then((input) => {
    // TODO - puzzle answer 1
    let answer1 = 0;

    /*return Advent.Submit(answer1).then(() => {
        // TODO - puzzle answer 2
        let answer2 = 0;

        return Advent.Submit(answer2, 2);
    });*/
}).catch((e) => {
    console.error(e);
});`);
        console.log(`Written solution file ${i}: ${entryFileName}`);
    }
}

class Advent {
    constructor(day, year) {
        this.Day = day;
        this.Year = year || 2015;
    }

    get DateName() {
        return this.Day.toString().padStart(2, '0');
    }

    get InputFilename() {
        return path.join(__dirname, 'inputs', `${this.DateName}.txt`);
    }

    get RecordFilename() {
        return path.join(__dirname, 'inputs', `${this.DateName}.json`);
    }

    DownloadInput() {
        return new Promise((resolve, reject) => {
            const req = http.request({
                hostname: 'adventofcode.com',
                port: 443,
                path: `/${this.Year}/day/${this.Day}/input`,
                method: 'GET',
                headers: {
                    'Cookie': `session=${session}`,
                }
            }, (res) => {
                const inputFile = fs.openSync(this.InputFilename, 'w');
                res.on('data', (chunk) => {
                    fs.writeSync(inputFile, chunk);
                });
                res.on('end', () => {
                    if (!quietMode) console.log('Done');
                    resolve();
                });
            });
            
            req.on('error', (e) => {
                console.error(e);
                reject(e);
            });
            req.end();
        });
    }

    ReadInput() {
        if (!fs.existsSync(this.InputFilename)) return Promise.reject(new Error('Input file doesn\'t exist'));
        return util.promisify(fs.readFile)(this.InputFilename);
    }

    GetInputRaw() {
        if (!fs.existsSync(this.InputFilename)) {
            return this.DownloadInput().then(() => {
                return this.ReadInput();
            });
        }

        return this.ReadInput();
    }

    GetInput() {
        return this.GetInputRaw().then((fileBuffer) => {
            const lines = fileBuffer.toString().split(/[\r\n]+/g);
            if (lines[lines.length - 1] === '') {
                lines.splice(lines.length - 1);
            }
            return Promise.resolve(lines.length == 1 ? lines[0] : lines);
        });
    }
    
    ReadRecord() {
        if (this.Record !== undefined) return Promise.resolve(this.Record);

        if (!fs.existsSync(this.RecordFilename)) {
            this.Record = {
                parts: [
                    {
                        answer: null,
                        guesses: [],
                    },
                    {
                        answer: null,
                        guesses: [],
                    }
                ]
            };

            return Promise.resolve(this.Record);
        }

        return util.promisify(fs.readFile)(this.RecordFilename).then((fileBuffer) => {
            this.Record = JSON.parse(fileBuffer.toString());
            return Promise.resolve(this.Record);
        });
    }

    WriteRecord() {
        fs.writeFileSync(this.RecordFilename, JSON.stringify(this.Record, null, 2));
    }

    RecordGuess(answer, level) {
        this.Record.parts[level-1].guesses.push(answer);
        this.WriteRecord();
    }

    Submit(answer, level = 1) {
        if (!quietMode) console.log(`Submitting answer ${answer} for part ${level}...`);
        return this.ReadRecord().then((record) => {
            // skip if we already have the corret answer
            if (record.parts[level-1].answer !== null) {
                if (!quietMode) console.log(`* Already submitted correct answer for part ${level}`);

                return Promise.resolve();
            }

            if (record.parts[level-1].guesses.indexOf(answer) >= 0) {
                return Promise.reject(new Error('Already incorrectly guessed this answer'));
            }

            return new Promise((resolve, reject) => {
                const postData = querystring.stringify({
                    level: level,
                    answer: answer,
                });

                const req = http.request({
                    hostname: 'adventofcode.com',
                    port: 443,
                    path: `/${this.Year}/day/${this.Day}/answer`,
                    method: 'POST',
                    headers: {
                        'Cookie': `session=${session}`,
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Content-Length': postData.length,
                    }
                }, (res) => {
                    let response = '';
                    res.on('data', (chunk) => {
                        response += chunk;
                    });
                    res.on('end', () => {
                        if (response.indexOf('not the right answer') >= 0) {
                            this.RecordGuess(answer, level);
                            return reject(new Error('Incorrect answer'));
                        }

                        if (response.indexOf('You gave an answer too recently') >= 0) {
                            const m = /You have(?: ([0-9]+)m)? ([0-9]+)s left to wait/.exec(response);
                            let seconds = 0;
                            if (m) {
                                if (m[2]) {
                                    seconds = Number(m[1]) * 60 + Number(m[2]);
                                } else {
                                    seconds = Number(m[1]);
                                }
                            } else {
                                seconds = 60;
                            }

                            if (seconds <= 5 || Number.isNaN(seconds)) seconds = 60;

                            if (!quietMode) console.log(`Too many incorrect guesses. Waiting ${seconds} seconds...`);

                            return new Promise((resolve, reject) => {
                                setTimeout(() => {
                                    this.Submit(answer, level).then(resolve).catch(reject);
                                }, seconds * 1000);
                            });
                        }

                        if (response.indexOf('That\'s the right answer!') >= 0) {
                            record.parts[level-1].answer = answer;
                            this.WriteRecord();

                            if (!quietMode) console.log(`Correct answer submitted!`);

                            return resolve();
                        }

                        if (response.indexOf('Did you already complete it') >= 0) {
                            record.parts[level-1].answer = answer;
                            this.WriteRecord();
                            
                            if (!quietMode) console.log(`Correct answer already submitted!`);

                            return resolve();
                        }

                        return reject(new Error('Unknown response'));
                    });
                });
                
                req.on('error', (e) => {
                    console.error(e);
                    reject(e);
                });

                req.write(postData);
                req.end();
            });
        });
    }
}

module.exports = Advent;