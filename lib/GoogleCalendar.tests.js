const moment = require('moment');
const sinon = require('sinon'); // eslint-disable-line import/no-extraneous-dependencies
const { expect } = require('chai'); // eslint-disable-line import/no-extraneous-dependencies
const GoogleCalendar = require('./GoogleCalendar');

describe('[class] GoogleCalendar', () => {
  /* eslint no-unused-expressions: off */

  let token;
  let oauth;
  let config;

  beforeEach(() => {
    token = {
      access_token: 'ya29.GlvlBl0RsTtU8uZNOI5P5ErrGPVm5OXB9YdU0KppVOZSMBbn1i2snGg9Xj_kxRGjTRHDSAWvsrB',
      refresh_token: '1/kSncFfEAZy5tgIknvaUhr4T8EW6FvpOTBofUNwBBLO8',
      scope: 'https://www.googleapis.com/auth/calendar.readonly',
      token_type: 'Bearer',
      expiry_date: 1554684728523,
    };

    oauth = {
      client_id: '164452747151-9fs797qomrppmnol162m7vmi3k9d2ig3.apps.googleusercontent.com',
      project_id: 'quickstart-1551571748055',
      auth_uri: 'https://accounts.google.com/o/oauth2/auth',
      token_uri: 'https://oauth2.googleapis.com/token',
      auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
      client_secret: 'wEkEaKZxQ5YJ9DJM3LU91mxY',
      redirect_uris: [
        'urn:ietf:wg:oauth:2.0:oob',
        'http://localhost',
      ],
    };

    config = { token, oauth };
  });

  describe('[method] constructor', () => {
    it('should export a constructor', () => {
      const gs = new GoogleCalendar(config);

      expect(gs).to.be.instanceOf(GoogleCalendar);
    });
  });

  describe('[method] emailMatch, using [method] cleanEmail', () => {
    it('should match regardless of periods before the @', () => {
      expect(GoogleCalendar.emailMatch('john.doe@gmail.com', 'johndoe@gmail.com')).to.be.true;
      expect(GoogleCalendar.emailMatch('jo.hn.doe@gmail.com', 'joh..ndoe.@gmail.com')).to.be.true;
      expect(GoogleCalendar.emailMatch('john.doe@g.mail.com', 'john.doe@gmail.com')).to.be.false;
    });

    it('should match regardless of case', () => {
      expect(GoogleCalendar.emailMatch('john.Doe@gmail.com', 'john.doe@gmail.com')).to.be.true;
      expect(GoogleCalendar.emailMatch('JOHN.doe@gMail.com', 'john.doe@gmail.com')).to.be.true;
    });

    it('should match regardless of trailing/leading whitespace', () => {
      expect(GoogleCalendar.emailMatch(' john.doe@gmail.com', 'john.doe@gmail.com')).to.be.true;
      expect(GoogleCalendar.emailMatch('john.doe@gmail.com ', ' john.doe@gmail.com')).to.be.true;
    });
  });

  describe('[method] load', () => {
    const events = [{}];
    const from = moment().subtract(12, 'months').toDate();
    const to = moment().add(12, 'months').toDate();
    let calendar;

    beforeEach(() => {
      calendar = new GoogleCalendar(config);

      sinon.stub(calendar.api.events, 'list').callsFake((options, cb) => {
        expect(options.timeMin).to.deep.equal(from);
        expect(options.timeMax).to.deep.equal(to);
        cb(null, { data: { items: events } });
      });
    });

    it('should load calendar data, returning a promise', (done) => {
      calendar.load(from, to)
        .then(() => {
          expect(calendar.events).to.be.an('array');
          expect(calendar.events).to.have.lengthOf(1);
        })
        .then(done)
        .catch(done);
    });

    it('should load calendar data, await syntax', async () => {
      await calendar.load(from, to);
      expect(calendar.events).to.be.an('array');
      expect(calendar.events).to.have.lengthOf(1);
    });

    it('should reject w/error', (done) => {
      calendar.api.events.list.restore();
      sinon.stub(calendar.api.events, 'list').callsFake((options, cb) => {
        cb({ name: 'Boom!' });
      });

      calendar.load(from, to).catch((error) => {
        expect(error.name).to.equal('Boom!');
        done();
      });
    });
  });

  describe('[method] isScheduled', () => {
    it('should return false if email is not on any future events', () => {
      const calendar = new GoogleCalendar(config);

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

    it('should return false if email is only on a past event', () => {
      const calendar = new GoogleCalendar(config);

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
      const calendar = new GoogleCalendar(config);

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
      const calendar = new GoogleCalendar(config);

      calendar.events = [];
      expect(calendar.computeFrequencyScore('bogus@email.com', 'quarterly')).to.equal(0);
    });

    it('should compute a score of 1 if on target', () => {
      const calendar = new GoogleCalendar(config);

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
      const calendar = new GoogleCalendar(config);

      calendar.events = [{
        start: {
          dateTime: moment().subtract(6, 'months').toISOString(),
        },
        attendees: [{
          email: 'john.doe@gmail.com',
        }],
      }, {
        start: {
          dateTime: moment().subtract(15, 'months').toISOString(),
        },
        attendees: [{
          email: 'john.doe@gmail.com',
        }],
      }];

      expect(calendar.computeFrequencyScore('john.doe@gmail.com', 'biannually')).to.equal(0.5);
    });

    it('should compute a score of 0.5 if half on target, ignoring future events', () => {
      const calendar = new GoogleCalendar(config);

      calendar.events = [{
        start: {
          dateTime: moment().subtract(5, 'months').toISOString(),
        },
        attendees: [{
          email: 'john.doe@gmail.com',
        }],
      }, {
        start: {
          dateTime: moment().subtract(4, 'months').toISOString(),
        },
        attendees: [{
          email: 'john.doe@gmail.com',
        }],
      }, {
        start: {
          dateTime: moment().subtract(3, 'months').toISOString(),
        },
        attendees: [{
          email: 'john.doe@gmail.com',
        }],
      }, {
        start: {
          dateTime: moment().add(6, 'months').toISOString(),
        },
        attendees: [{
          email: 'john.doe@gmail.com',
        }],
      }];

      expect(calendar.computeFrequencyScore('john.doe@gmail.com', 'monthly')).to.equal(0.5);
    });

    it('should compute a score of 1 if annual was seen in last year', () => {
      const calendar = new GoogleCalendar(config);

      calendar.events = [{
        start: {
          dateTime: moment().subtract(11, 'months').toISOString(),
        },
        attendees: [{
          email: 'john.doe@gmail.com',
        }],
      }];

      expect(calendar.computeFrequencyScore('john.doe@gmail.com', 'annually')).to.equal(1);
    });
  });

  describe('[method] getTargetFrequencyAttributes', () => {
    it('should throw an error if unrecorgnized type', () => {
      try {
        GoogleCalendar.getTargetFrequencyAttributes('bogus');
      } catch (error) {
        expect(error.message).to.equal('Unknown target frequency! bogus');
      }
    });
  });

  describe('[method] findLastEventDate', () => {
    it('should return null if no prior event is found', () => {
      const calendar = new GoogleCalendar(config);

      calendar.events = [];
      expect(calendar.findLastEventDate('john.doe@gmail.com')).to.equal(null);
    });

    it('should return null if no prior event is found, ignoring future events', () => {
      const calendar = new GoogleCalendar(config);
      const dateTime = moment().add(2, 'week').toISOString();

      calendar.events = [{
        start: {
          dateTime,
        },
        attendees: [{
          email: 'john.doe@gmail.com',
        }],
      }];

      expect(calendar.findLastEventDate('john.doe@gmail.com')).to.deep.equal(null);
    });

    it('should return the date of last prior event found', () => {
      const calendar = new GoogleCalendar(config);
      const dateTime = moment().subtract(2, 'week').toISOString();

      calendar.events = [{
        start: {
          dateTime,
        },
        attendees: [{
          email: 'john.doe@gmail.com',
        }],
      }];

      expect(calendar.findLastEventDate('john.doe@gmail.com')).to.deep.equal(dateTime);
    });

    it('should return the date of the most recent prior event found', () => {
      const calendar = new GoogleCalendar(config);
      const dateTime1 = moment().subtract(2, 'week').toISOString();
      const dateTime2 = moment().subtract(4, 'week').toISOString();

      calendar.events = [{
        start: {
          dateTime: dateTime1,
        },
        attendees: [{
          email: 'john.doe@gmail.com',
        }],
      }, {
        start: {
          dateTime: dateTime2,
        },
        attendees: [{
          email: 'john.doe@gmail.com',
        }],
      }];

      expect(calendar.findLastEventDate('john.doe@gmail.com')).to.deep.equal(dateTime1);
    });
  });

  describe('[method] computeWeeksSinceLastSeen', () => {
    it('should return -1 if no prior event is found', () => {
      const calendar = new GoogleCalendar(config);

      calendar.events = [];
      expect(calendar.computeWeeksSinceLastSeen('john.doe@gmail.com')).to.equal(-1);
    });

    it('should return -1 if no prior event is found, ignoring future events', () => {
      const calendar = new GoogleCalendar(config);
      const dateTime = moment().add(2, 'week').toISOString();

      calendar.events = [{
        start: {
          dateTime,
        },
        attendees: [{
          email: 'john.doe@gmail.com',
        }],
      }];

      expect(calendar.computeWeeksSinceLastSeen('john.doe@gmail.com')).to.equal(-1);
    });

    it('should return the number of weeks since the last prior event found', () => {
      const calendar = new GoogleCalendar(config);
      const dateTime = moment().subtract(2, 'week').toISOString();

      calendar.events = [{
        start: {
          dateTime,
        },
        attendees: [{
          email: 'john.doe@gmail.com',
        }],
      }];

      expect(calendar.computeWeeksSinceLastSeen('john.doe@gmail.com')).to.equal(2);
    });

    it('should return the number of weeks since the most recent prior event found', () => {
      const calendar = new GoogleCalendar(config);
      const dateTime1 = moment().subtract(2, 'week').toISOString();
      const dateTime2 = moment().subtract(4, 'week').toISOString();

      calendar.events = [{
        start: {
          dateTime: dateTime1,
        },
        attendees: [{
          email: 'john.doe@gmail.com',
        }],
      }, {
        start: {
          dateTime: dateTime2,
        },
        attendees: [{
          email: 'john.doe@gmail.com',
        }],
      }];

      expect(calendar.computeWeeksSinceLastSeen('john.doe@gmail.com')).to.equal(2);
    });
  });

  describe('[method] computeLastSeenScore', () => {
    it('should correctly compute: weekly, never seen => 0', () => {
      const calendar = new GoogleCalendar(config);

      calendar.events = [];
      expect(calendar.computeLastSeenScore('john.doe@gmail.com', 'weekly')).to.equal(0);
    });

    it('should correctly compute: weekly, 3 weeks => 3/1 => 3.0', () => {
      const calendar = new GoogleCalendar(config);
      const dateTime = moment().subtract(3, 'weeks').toISOString();

      calendar.events = [{
        start: {
          dateTime,
        },
        attendees: [{
          email: 'john.doe@gmail.com',
        }],
      }];

      expect(calendar.computeLastSeenScore('john.doe@gmail.com', 'weekly')).to.equal(3 / 1);
    });

    it('should correctly compute: monthly, 3 weeks => 3/4 => 0.75', () => {
      const calendar = new GoogleCalendar(config);
      const dateTime = moment().subtract(3, 'weeks').toISOString();

      calendar.events = [{
        start: {
          dateTime,
        },
        attendees: [{
          email: 'john.doe@gmail.com',
        }],
      }];

      expect(calendar.computeLastSeenScore('john.doe@gmail.com', 'monthly')).to.equal(3 / 4);
    });

    it('should correctly compute: quarterly, 10 weeks => 10/12 => 0.83', () => {
      const calendar = new GoogleCalendar(config);
      const dateTime = moment().subtract(10, 'weeks').toISOString();

      calendar.events = [{
        start: {
          dateTime,
        },
        attendees: [{
          email: 'john.doe@gmail.com',
        }],
      }];

      expect(calendar.computeLastSeenScore('john.doe@gmail.com', 'quarterly')).to.equal(10 / 12);
    });

    it('should correctly compute: biannually, 10 weeks => 10/26 => 0.38', () => {
      const calendar = new GoogleCalendar(config);
      const dateTime = moment().subtract(10, 'weeks').toISOString();

      calendar.events = [{
        start: {
          dateTime,
        },
        attendees: [{
          email: 'john.doe@gmail.com',
        }],
      }];

      expect(calendar.computeLastSeenScore('john.doe@gmail.com', 'biannually')).to.equal(10 / 26);
    });

    it('should correctly compute: annually, 26 weeks => 26/52 => 0.5', () => {
      const calendar = new GoogleCalendar(config);
      const dateTime = moment().subtract(26, 'weeks').toISOString();

      calendar.events = [{
        start: {
          dateTime,
        },
        attendees: [{
          email: 'john.doe@gmail.com',
        }],
      }];

      expect(calendar.computeLastSeenScore('john.doe@gmail.com', 'annually')).to.equal(26 / 52);
    });
  });
});
