const moment = require('moment');
const fs = require('fs');
const readline = require('readline');
const path = require('path');
const folder = path.join(__dirname, 'data');

const whgh = (callback) => {
    let tasks, progress;
    const now = moment.utc();
    now.add(8, 'h');
    
    const entries = [];
    fs.readdir(folder, (err, files) => {
        tasks = files.length;
        progress = 0;
        for (let i = 0; i < files.length; i++) {
            const reader = readline.createInterface({
                input: fs.createReadStream(path.join(folder, files[i]))
            });

            let diff = 0;
            let playerName = files[i].split('.')[0];
            reader.on('line', (line) => {
                if (line.length == 19) {
                    diff = now.diff(moment.utc(line));
                } else {
                    const chunks = line.split(/\s*[\(\)]\s*/g);
                    const daysTokens = chunks[2].match(/\d+/g);
                    const realDays = moment.duration(diff + Number(daysTokens[0]) * 86400000 + Number(daysTokens[1]) * 3600000 + Number(daysTokens[2]) * 60000);
                    
                    entries.push({
                        player: playerName,
                        name: chunks[0],
                        link: chunks[1],
                        life: {
                            days: Math.floor(realDays.asDays()),
                            hours: realDays.hours(),
                            minutes: realDays.minutes(),
                            seconds: realDays.seconds()
                        }
                    });
                }
            }).on('close', () => {
                progress++;
                if (progress >= tasks) {
                    callback(entries);
                }
            });
        }
    });
};

module.exports = whgh;
