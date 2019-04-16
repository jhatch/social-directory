const moment = require('moment');
const GoogleAPI = require('./GoogleAPI');

class GoogleCalendar extends GoogleAPI {
  constructor(creds) {
    super(creds);
    this.events = [];
  }

  static getApiVersion() {
    return { name: 'calendar', version: 'v3' };
  }

  static cleanEmail(email) {
    const parts = email.trim().toLowerCase().split('@');
    const name = parts[0];
    const domain = parts[1];

    return [name.replace(/\./g, ''), domain].join('@');
  }

  static emailMatch(emailA, emailB) {
    return this.cleanEmail(emailA) === this.cleanEmail(emailB);
  }

  static getTargetFrequencyAttributes(targetFrequency) {
    const earliestRelevantDate = moment();
    let targetFrequencyPerYear;
    let targetMaxWeeksApart;

    switch (targetFrequency.toLowerCase()) {
      case 'weekly':
        targetMaxWeeksApart = 1;
        targetFrequencyPerYear = 4;
        earliestRelevantDate.subtract(1, 'month');
        break;
      case 'monthly':
        targetMaxWeeksApart = 4;
        targetFrequencyPerYear = 6;
        earliestRelevantDate.subtract(6, 'months');
        break;
      case 'quarterly':
        targetMaxWeeksApart = 12;
        targetFrequencyPerYear = 3;
        earliestRelevantDate.subtract(9, 'months');
        break;
      case 'biannually':
        targetMaxWeeksApart = 26;
        targetFrequencyPerYear = 2;
        earliestRelevantDate.subtract(12, 'months');
        break;
      case 'annually':
        targetMaxWeeksApart = 52;
        targetFrequencyPerYear = 1;
        earliestRelevantDate.subtract(12, 'months');
        break;
      default:
        throw new Error(`Unknown target frequency! ${targetFrequency}`);
    }

    return { targetFrequencyPerYear, targetMaxWeeksApart, earliestRelevantDate };
  }

  load(from, to) {
    return new Promise((resolve, reject) => {
      this.api.events.list({
        calendarId: 'primary',
        timeMax: to,
        timeMin: from,
        maxEvents: 2500, // max allowed
        singleEvents: true,
        orderBy: 'startTime',
      }, (err, res) => {
        if (err) {
          return reject(err);
        }

        this.events = res.data.items;
        return resolve(this);
      });
    });
  }

  isScheduled(email) {
    const now = moment();

    return this.events
      .filter(event => moment(event.start.date || event.start.dateTime).isAfter(now))
      .filter(event => event.attendees)
      .some(event => event.attendees
        .some(attendee => this.constructor.emailMatch(attendee.email, email)));
  }

  computeFrequencyScore(email, targetFrequency) {
    // determine how far to look back based on targetFrequency
    const now = moment();
    const {
      earliestRelevantDate,
      targetFrequencyPerYear,
    } = this.constructor.getTargetFrequencyAttributes(targetFrequency);

    // compute how often you've had events with the email
    // compute percentage of target you've achieved
    const pastEvents = this.events
      .filter(event => moment(event.start.date || event.start.dateTime).isAfter(earliestRelevantDate))
      .filter(event => moment(event.start.date || event.start.dateTime).isBefore(now))
      .filter(event => event.attendees)
      .filter(event => event.attendees
        .some(attendee => this.constructor.emailMatch(attendee.email, email)));

    return pastEvents.length / targetFrequencyPerYear;
  }

  findLastEventDate(email) {
    const now = moment();
    const pastEvents = this.events
      .filter(event => moment(event.start.date || event.start.dateTime).isBefore(now))
      .filter(event => event.attendees)
      .filter(event => event.attendees
        .some(attendee => this.constructor.emailMatch(attendee.email, email)))
      .map(event => (event.start.date || event.start.dateTime))
      .sort()
      .reverse();

    return pastEvents.length ? pastEvents[0] : null;
  }

  //  0 => saw them in the past 7 days
  // -1 => never seen them in the past
  // >0 => # of weeks since last seen (decimals round down)
  computeWeeksSinceLastSeen(email) {
    const lastSeenDateString = this.findLastEventDate(email);

    if (lastSeenDateString) {
      const lastSeenDate = moment(lastSeenDateString);

      return moment().diff(lastSeenDate, 'weeks');
    }

    return -1;
  }

  // 1) weekly, 3 weeks => 3/1 => 3.0
  // 2) monthly, 3 weeks => 3/4 => 0.75
  // 3) quarterly, 10 weeks => 10/12 => 0.83
  // 4) biannually, 10 weeks => 10/26 => 0.38
  // 5) annually. 26 weeks => 26/52 => 0.5
  // ranks: 1, 3, 2, 4, 5
  computeLastSeenScore(email, targetFrequency) {
    const { targetMaxWeeksApart } = this.constructor.getTargetFrequencyAttributes(targetFrequency);
    const weeksSinceLastSeen = this.computeWeeksSinceLastSeen(email);

    return weeksSinceLastSeen === -1 ? 0 : weeksSinceLastSeen / targetMaxWeeksApart;
  }
}

module.exports = GoogleCalendar;
