const moment = require('moment');
const GoogleAPI = require('./GoogleAPI');

class GoogleCalendar extends GoogleAPI {
	constructor(config) {
		super(config);
		this.events = [];
	}

	getApiVersion(google) {
		return { name: 'calendar', version: 'v3' };
	}

	cleanEmail(email) {
		return email.trim().toLowerCase().replace(/\./g, '');
	}

	emailMatch(emailA, emailB) {
		return this.cleanEmail(emailA) === this.cleanEmail(emailB);
	}

	load(from, to) {
		return new Promise((resolve, reject) => {
			this.api.events.list({
				calendarId: 'primary',
				timeMax: to.toDate(),
				timeMin: from.toDate(),
				maxEvents: 2500, // max allowed
				singleEvents: true,
				orderBy: 'startTime',
			}, (err, res) => {
				if (err) {
					return reject(err);
				}

				this.events = res.data.items;
				resolve(this);
			});
		});
	}

	isScheduled(email) {
		const now = moment();

		return this.events
			.filter(event => moment(event.start.date || event.start.dateTime).isAfter(now))
			.filter(event => event.attendees)
			.some(event => event.attendees.some(attendee => this.emailMatch(attendee.email, email)));
	}

	getMinDate(targetFrequency) {
		let minDate = moment();
		let target;

		switch (targetFrequency.toLowerCase()) {
			case 'weekly':
				target = 4;
				minDate.subtract(1, 'month');
				break;
			case 'monthly':
				target = 6;
				minDate.subtract(6, 'months');
				break;
			case 'quarterly':
				target = 3;
				minDate.subtract(9, 'months');
				break;
			case 'biannually':
				target = 2;
				minDate.subtract(12, 'months');
				break;
			case 'annually':
				target = 1;
				minDate.subtract(12, 'months');
				break;
			default:
				throw new Error('Unknown target frequency!' + targetFrequency);
		}

		return { minDate, target };
	}

	computeFrequencyScore(email, targetFrequency) {
		// determine how far to look back based on targetFrequency
		const now = moment();
		const {target, minDate} = this.getMinDate(targetFrequency);

		// compute how often you've had events with the email
		// compute percentage of target you've achieved
		const pastEvents = this.events
		  .filter(event => moment(event.start.date || event.start.dateTime).isAfter(minDate))
			.filter(event => moment(event.start.date || event.start.dateTime).isBefore(now))
			.filter(event => event.attendees)
			.filter(event => event.attendees.some(attendee => this.emailMatch(attendee.email, email)));
		
		return pastEvents.length / target;
	}

	findLastEventDate(email) {
		const now = moment();
		const pastEvents = this.events
			.filter(event => moment(event.start.date || event.start.dateTime).isBefore(now))
			.filter(event => event.attendees)
			.filter(event => event.attendees.some(attendee => this.emailMatch(attendee.email, email)))
			.map(event => (event.start.date || event.start.dateTime))
			.sort()
			.reverse();
	
		return pastEvents.length ? now.diff(moment(pastEvents[0]), 'months') + ' months ago' : null;
	}
}

module.exports = GoogleCalendar;
