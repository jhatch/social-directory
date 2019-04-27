const moment = require('moment');
const doT = require('dot');
const {
  GoogleSheet,
  GoogleCalendar,
  GoogleMail,
} = require('google-clients');
const weeklyDigest = require('./emails/weeklyDigest');
const { config } = require('./package.json');
const credentials = require('./credentials.json');

const oauth = {
  client_id: process.env.client_id || credentials.oauth.client_id,
  client_secret: process.env.client_secret || credentials.oauth.client_secret,
  redirect_uris: process.env.redirect_uris || credentials.oauth.redirect_uris,
};

const sheetsToken = {
  access_token: process.env.sheets_access_token || credentials.sheets.token.access_token,
  refresh_token: process.env.sheets_refresh_token || credentials.sheets.token.refresh_token,
  scope: process.env.sheets_scope || credentials.sheets.token.scope,
  token_type: process.env.sheets_token_type || credentials.sheets.token.token_type,
  expiry_date: process.env.sheets_expiry_date || credentials.sheets.token.expiry_date,
};

const calendarToken = {
  access_token: process.env.calendar_access_token || credentials.calendar.token.access_token,
  refresh_token: process.env.calendar_refresh_token || credentials.calendar.token.refresh_token,
  scope: process.env.calendar_scope || credentials.calendar.token.scope,
  token_type: process.env.calendar_token_type || credentials.calendar.token.token_type,
  expiry_date: process.env.calendar_expiry_date || credentials.calendar.token.expiry_date,
};

const gmailToken = {
  access_token: process.env.gmail_access_token || credentials.gmail.token.access_token,
  refresh_token: process.env.gmail_refresh_token || credentials.gmail.token.refresh_token,
  scope: process.env.gmail_scope || credentials.gmail.token.scope,
  token_type: process.env.gmail_token_type || credentials.gmail.token.token_type,
  expiry_date: process.env.gmail_expiry_date || credentials.gmail.token.expiry_date,
};

const sheet = new GoogleSheet({
  oauth,
  token: sheetsToken,
}, config.sheets);

const calendar = new GoogleCalendar({
  oauth,
  token: calendarToken,
});

const gmail = new GoogleMail({
  oauth,
  token: gmailToken,
});

const from = moment().subtract(12, 'months');
const to = moment().add(12, 'months');

exports.timeSinceLastSeenHandler = async () => {
  try {
    // 0. load our social directory spreadsheet and calendar events
    // TODO: do them in parallel
    await sheet.load(config.sheets.id, config.sheets.ranges.data);
    await calendar.load(from.toDate(), to.toDate());

    // 1. process each person: compute score, find last-seen-date
    const sheetsData = [];

    for (let i = 0; i < sheet.rows.length; i++) {
      const person = sheet.rows[i];

      person.lastEvent = calendar.getLastEvent(person.email);

      if (person.lastEvent) {
        person.lastEvent.phrase = `${moment().diff(moment(person.lastEvent.date), 'weeks')} weeks ago`;
      }

      person.score = calendar.computeLastSeenScore(person.email, person.targetFrequency);

      sheetsData.push([
        person.score,
        person.lastEvent ? person.lastEvent.phrase : 'No record.',
        person.nowTimestamp,
      ]);
    }

    // 2. record in our spreadsheet: [current score, last-seen-date, timestamp]
    await sheet.update(config.sheets.id, config.sheets.ranges.writes, sheetsData);

    // 3. decide who you most need to schedule; for the email digest
    const notScheduled = sheet.rows
      .filter(person => !calendar.isScheduled(person.email))
      .sort((p1, p2) => {
        if (p1.score < p2.score) {
          return 1;
        }

        if (p1.score > p2.score) {
          return -1;
        }

        if (p1.targetFrequency < p2.targetFrequency) {
          return 1;
        }

        return -1;
      });

    const active = notScheduled.filter(person => person.score !== -1);
    const inactive = notScheduled.filter(person => person.score === -1);

    const scheduled = sheet.rows
      .filter(person => calendar.isScheduled(person.email))
      .map((person) => {
        /* eslint no-param-reassign: Off */
        person.nextEvent = calendar.getNextEvent(person.email);
        return person;
      });

    // 4. count how many events you had in the past 30 days
    const recentlySeen = sheet.rows.filter((person) => {
      if (!person.lastEvent) {
        return false;
      }

      const days = moment().diff(moment(person.lastEvent.date), 'days');

      return (days <= 30 && days > 0);
    });

    // 4. generate/send the email digest
    const html = doT.template(weeklyDigest)({
      active,
      inactive,
      scheduled,
      upcomingCount: scheduled.length,
      recentlyCount: recentlySeen.length,
      moment,
    });

    await gmail.send(`[Social Directory] ${new Date()}`, html);
  } catch (error) {
    // await gmail.send(`[Social Directory] ${new Date()} ERROR!`, `<pre>${error.stack}</pre>`);
    throw error;
  }
};
