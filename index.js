const moment = require('moment');
const GoogleSheet = require('./lib/GoogleSheet');
const GoogleCalendar = require('./lib/GoogleCalendar');
const GoogleMail = require('./lib/GoogleMail');
const { config } = require('./package.json');
const credentials = require('./credentials.json');

const sheet = new GoogleSheet({
  oauth: credentials.oauth,
  token: credentials.sheets.token,
}, config.sheets);
const calendar = new GoogleCalendar({
  oauth: credentials.oauth,
  token: credentials.calendar.token,
});
const gmail = new GoogleMail({
  oauth: credentials.oauth,
  token: credentials.gmail.token,
});

const nowTimestamp = moment().format('YYYY-MM-DD');
const from = moment().subtract(12, 'months');
const to = moment().add(12, 'months');

exports.handler = async () => {
  try {
    // 0. load our social directory spreadsheet and calendar events
    // TODO: do them in parallel
    await sheet.load(config.sheets.id, config.sheets.ranges.data);
    await calendar.load(from.toDate(), to.toDate());

    // 1. process each person: compute score, find last-seen-date
    const sheetsData = [];

    for (let i = 0; i < sheet.rows.length; i++) {
      const person = sheet.rows[i];
      const score = calendar.computeFrequencyScore(person.email, person.targetFrequency);
      const lastSeenDate = calendar.findLastEventDate(person.email);

      person.score = score;
      sheetsData.push([
        score,
        lastSeenDate ? `${moment().diff(moment(lastSeenDate), 'months')} months ago` : 'Never',
        nowTimestamp,
      ]);
    }

    // 2. record in our spreadsheet: [current score, last-seen-date, timestamp]
    await sheet.update(config.sheets.id, config.sheets.ranges.writes, sheetsData);

    // 3. decide who you most need to schedule; for the email digest
    const winners = sheet.rows
      .filter(person => !calendar.isScheduled(person.email))
      .filter(person => person.score === 0)
      .splice(0, 10);

    // 4. generate/send the email digest
    let html = '<table>';

    html += '<th><td>Name</td><td>Score</td><td>Last Seen</td></th>';
    winners.forEach((person) => {
      html += `<tr><td>${person.first} ${person.last}</td><td>${person.score}</td><td>${person.lastSeen}</td></tr>`;
    });

    html += '</table>';
    html += '<a href="https://docs.google.com/spreadsheets/d/11TtAui1fy4HXbDaqB_mlHVzv_hdJw5jD8w7c7h05oaY">Full Directory"</a>';

    await gmail.send(`[Social Directory] ${new Date()}`, html);
  } catch (error) {
    // await gmail.send(`[Social Directory] ${new Date()} ERROR!`, `<pre>${error.stack}</pre>`);
    throw error;
  }
};
