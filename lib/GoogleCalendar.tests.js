const moment = require('moment');
const { expect } = require('chai'); // eslint-disable-line import/no-extraneous-dependencies
const GoogleCalendar = require('./GoogleCalendar');
const { config } = require('../package.json');

describe('[class] GoogleCalendar', () => {
  /* eslint no-unused-expressions:0 */

  describe('[method] constructor', () => {
    it('should export a constructor', () => {
      const gs = new GoogleCalendar(config.calendar);

      expect(gs).to.be.instanceOf(GoogleCalendar);
    });
  });

  describe('[method] load', () => {
    it('should load calendar data, returning a promise', (done) => {
      const calendar = new GoogleCalendar(config.calendar);

      const from = moment().subtract(12, 'months');
      const to = moment().add(12, 'months');

      calendar.load(from, to)
        .then(() => {
          expect(calendar.events).to.be.an('array');
          expect(calendar.events).to.have.lengthOf.at.least(1);
        })
        .then(done)
        .catch(done);
    });

    it('should load calendar data, await syntax', async () => {
      const calendar = new GoogleCalendar(config.calendar);

      const from = moment().subtract(12, 'months');
      const to = moment().add(12, 'months');

      await calendar.load(from, to);
      expect(calendar.events).to.be.an('array');
      expect(calendar.events).to.have.lengthOf.at.least(1);
    });
  });

  describe('[method] isScheduled', () => {
    it('should return false if email is on no future events', () => {
      const calendar = new GoogleCalendar(config.calendar);

      calendar.events = [{
        start: {
          dateTime: moment().add(500, 'years').toISOString(),
        },
        attendees: [{
          email: 'john.doe@gmail.com',
        }],
      }];

      expect(calendar.isScheduled('bob.dole@gmail.com')).to.be.false;
    });

    it('should return false if email is on a past event', () => {
      const calendar = new GoogleCalendar(config.calendar);

      calendar.events = [{
        start: {
          dateTime: moment().subtract(500, 'years').toISOString(),
        },
        attendees: [{
          email: 'john.doe@gmail.com',
        }],
      }];

      expect(calendar.isScheduled('john.doe@gmail.com')).to.be.false;
    });

    it('should return true if email is on a future event', () => {
      const calendar = new GoogleCalendar(config.calendar);

      calendar.events = [{
        start: {
          dateTime: moment().add(500, 'years').toISOString(),
        },
        attendees: [{
          email: 'john.doe@gmail.com',
        }],
      }];

      expect(calendar.isScheduled('john.doe@gmail.com')).to.be.true;
    });
  });

  describe('[method] computeFrequencyScore', () => {
    it('should compute a score of 0 if no events are found', () => {
      const calendar = new GoogleCalendar(config.calendar);

      calendar.events = [];
      expect(calendar.computeFrequencyScore('bogus@email.com', 'weekly')).to.equal(0);
    });

    it('should compute a score of 1 if on target', () => {
      const calendar = new GoogleCalendar(config.calendar);

      calendar.events = [{
        start: {
          dateTime: moment().subtract(1, 'week').toISOString(),
        },
        attendees: [{
          email: 'john.doe@gmail.com',
        }],
      }, {
        start: {
          dateTime: moment().subtract(2, 'week').toISOString(),
        },
        attendees: [{
          email: 'john.doe@gmail.com',
        }],
      }, {
        start: {
          dateTime: moment().subtract(3, 'week').toISOString(),
        },
        attendees: [{
          email: 'john.doe@gmail.com',
        }],
      }, {
        start: {
          dateTime: moment().subtract(4, 'week').toISOString(),
        },
        attendees: [{
          email: 'john.doe@gmail.com',
        }],
      }];

      expect(calendar.computeFrequencyScore('john.doe@gmail.com', 'weekly')).to.equal(1);
    });

    it('should compute a score of 0.5 if half on target', () => {
      const calendar = new GoogleCalendar(config.calendar);

      calendar.events = [{
        start: {
          dateTime: moment().subtract(1, 'week').toISOString(),
        },
        attendees: [{
          email: 'john.doe@gmail.com',
        }],
      }, {
        start: {
          dateTime: moment().subtract(2, 'week').toISOString(),
        },
        attendees: [{
          email: 'john.doe@gmail.com',
        }],
      }];

      expect(calendar.computeFrequencyScore('john.doe@gmail.com', 'weekly')).to.equal(0.5);
    });

    it('should compute a score of 0.5 if half on target, ignoring future events', () => {
      const calendar = new GoogleCalendar(config.calendar);

      calendar.events = [{
        start: {
          dateTime: moment().subtract(1, 'week').toISOString(),
        },
        attendees: [{
          email: 'john.doe@gmail.com',
        }],
      }, {
        start: {
          dateTime: moment().subtract(2, 'week').toISOString(),
        },
        attendees: [{
          email: 'john.doe@gmail.com',
        }],
      }, {
        start: {
          dateTime: moment().add(1, 'week').toISOString(),
        },
        attendees: [{
          email: 'john.doe@gmail.com',
        }],
      }];

      expect(calendar.computeFrequencyScore('john.doe@gmail.com', 'weekly')).to.equal(0.5);
    });
  });
});
