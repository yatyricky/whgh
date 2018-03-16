const fs = require('fs');
const config = JSON.parse(fs.readFileSync('config/config.json'));
const https = require('https');
const app = require('express')();
const path = require('path');
const url = require('url');
const whgh = require('./parser');

const folder = path.join('data');

const lifeSorter = (a, b) => {
    const lifeA = a.life.days + a.life.hours / 24.0 + a.life.minutes / 1440.0 + a.life.seconds / 86400.0;
    const lifeB = b.life.days + b.life.hours / 24.0 + b.life.minutes / 1440.0 + b.life.seconds / 86400.0;
    return lifeA > lifeB ? -1 : 1;
};

const searchByTop = (num, chatId, sender) => {
    whgh((res) => {
        let resp = `@${sender} Query by top ${num}\n`;
        if (sender == "") {
            resp = `Daily report\n`;
        }
        res.sort(lifeSorter);
        for (let i = 0; i < res.length && i < num; i++) {
            const element = res[i];
            resp += `${element.player} [${element.name}](${element.link}) *${element.life.days}d*:${element.life.hours}h:${element.life.minutes}m *${element.distance}km*\n`;
        }
        const requestString = `https://api.telegram.org/bot${config.apikey}/sendMessage?chat_id=${chatId}&text=${encodeURIComponent(resp)}&parse_mode=markdown&disable_web_page_preview=true`;
        https.get(requestString, (res) => {
        }).on('error', (e) => {
            console.log(e);
        });
    });
};

const searchByPlayer = (player, chatId, sender) => {
    whgh((res) => {
        let resp = `@${sender} Query by player ${player}\n`;
        const lowerPlayer = player.toLowerCase();
        res.sort(lifeSorter);
        let foundNothing = true;
        for (let i = 0; i < res.length; i++) {
            const element = res[i];
            if (element.player.toLowerCase() == lowerPlayer) {
                resp += `[${element.name}](${element.link}) *${element.life.days}d*:${element.life.hours}h:${element.life.minutes}m *${element.distance}km*\n`;
                foundNothing = false;
            }
        }
        if (foundNothing) {
            resp += "Nothing found.";
        }
        const requestString = (`https://api.telegram.org/bot${config.apikey}/sendMessage?chat_id=${chatId}&text=${encodeURIComponent(resp)}&parse_mode=markdown&disable_web_page_preview=true`);
        https.get(requestString, (res) => {
        }).on('error', (e) => {
            console.log(e);
        });
    });
};

app.get('/', (req, res) => {
    // fetch secret and message
    const query = url.parse(req.url, true).query;
    let obj = {};
    let jsonDecode = true;
    try {
        obj = JSON.parse(Buffer.from(query.message, 'base64'));
    } catch (e) {
        jsonDecode = false;
    }
    res.send("Good day mate :)");

    if (query.secret == config.secret && jsonDecode) {
        // secret query must match
        const chatId = obj.message.chat.id;
        if (config.chatid.indexOf(chatId) != -1) {
            // chat id must match
            const msg = obj.message.text;
            const sender = obj.message.from.username;
            const msgTokens = msg.split('@');
            console.log(`I: Good request from @${sender}: ${msg}`);
            let resp = "";
            if (msgTokens[0] == '/ping') {
                resp = "pong";
            } else if (msgTokens[0] == '/help') {
                resp = "\n/ping 测试bot\n/list *list 10* - 显示最高10个 *list iroly* - 显示萝莉的🍄 或者直接 *list*\n/help 获得帮助";
            } else {
                const paramTokens = msgTokens[0].split(' ');
                if (paramTokens[0] == '/list') {
                    if (paramTokens.length > 1) {
                        if (!isNaN(paramTokens[1])) {
                            if (parseInt(paramTokens[1]) <= 15) {
                                searchByTop(parseInt(paramTokens[1]), chatId, sender);
                            } else {
                                searchByPlayer(paramTokens[1], chatId, sender);
                            }
                        } else {
                            searchByPlayer(paramTokens[1], chatId, sender);
                        }
                    } else {
                        searchByTop(15, chatId, sender);
                    }
                }
            }

            // Make bot request
            if (resp != "") {
                const requestString = encodeURI(`https://api.telegram.org/bot${config.apikey}/sendMessage?chat_id=${chatId}&text=@${sender} ${resp}&parse_mode=markdown`);
                https.get(requestString, (res) => {
                }).on('error', (e) => {
                    console.log(e);
                });
            }
        } else {
            console.log('E: PRIVATE CHAT INITIATED BY '.chatId);
        }
    } else {
        console.log(`E: Secret mismatch: ${query.secret} or wrong message`);
    }

});

https.createServer({
    cert: fs.readFileSync(config.sslcert),
    key: fs.readFileSync(config.sslkey)
}, app).listen(config.port, () => {
    console.log(`WHGH running on ${config.port}`);
});

const schedule = require('node-schedule');
schedule.scheduleJob('0 0 * * *', () => {
    searchByTop(config.dailynumbers, config.chatid[0], "");
});