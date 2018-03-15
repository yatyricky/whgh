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
                    const coords = chunks[1].match(/([\d]+\.[\d]*)/g);

                    entries.push({
                        player: playerName,
                        name: chunks[0],
                        link: chunks[1],
                        life: {
                            days: Math.floor(realDays.asDays()),
                            hours: realDays.hours(),
                            minutes: realDays.minutes(),
                            seconds: realDays.seconds()
                        },
                        distance: (getDistanceFromLatLonInKm(coords[0], coords[1], 30.546879, 114.296915)).toFixed(2)
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

// https://stackoverflow.com/a/27943/2372610
const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
    var R = 6371; // Radius of the earth in km
    var dLat = deg2rad(lat2 - lat1);  // deg2rad below
    var dLon = deg2rad(lon2 - lon1);
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c; // Distance in km
    return d;
}

const deg2rad = (deg) => {
    return deg * (Math.PI / 180);
}

module.exports = whgh;
