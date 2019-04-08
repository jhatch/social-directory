const moment = require('moment');
const GoogleSheet = require('./lib/GoogleSheet');
const GoogleCalendar = require('./lib/GoogleCalendar');
const GoogleMail = require('./lib/GoogleMail');
const config = require('./package.json').config;

(async () => {
	try {
		const sheet = await new GoogleSheet(config.sheets);
		const calendar = new GoogleCalendar(config.calendar);
		const gmail = new GoogleMail(config.gmail);

		const nowTimestamp = moment().format('YYYY-MM-DD');
		const from = moment().subtract(12, 'months'); 
		const to = moment().add(12, 'months'); 

		// TODO: do them in parallel
		await sheet.load(config.sheets.id, config.sheets.ranges.data);
		await calendar.load(from, to);

		const scoreData = sheet.rows.map((person, index) => {
			person.score = calendar.computeFrequencyScore(person.email, person.targetFrequency);
			person.lastSeen = calendar.findLastEventDate(person.email);

			return [person.score, person.lastSeen, nowTimestamp];
		});

		await sheet.update(config.sheets.id, config.sheets.ranges.writes, scoreData);

		const winners = sheet.rows
		  .filter(person => !calendar.isScheduled(person.email))
			.filter(person => person.score === 0)
			.splice(0, 10);

		let html = '<ol>';

		html += '<li><span>Name</span><span>Score</span><span>Last Seen</span></li>'
		winners.forEach(person => {
			html += `<li><span>${person.first} ${person.last}</span><span>${person.score}</span><span>${person.lastSeen}</span></li>`;
		})

		html += '</ol>';

		await gmail.send(`[Social Directory] ${new Date()}`, html);
	}
	catch(error) {
		console.log("FUCK", error);
		// gmail.send(config.email, error);
		throw error;
	}
})();
