const moment = require('moment');
const GoogleSheet = require('./lib/GoogleSheet');
const GoogleCalendar = require('./lib/GoogleCalendar');
const GoogleMail = require('./lib/GoogleMail');
const config = require('./package.json').config;

const sheet = new GoogleSheet(config.sheets);
const calendar = new GoogleCalendar(config.calendar);
const gmail = new GoogleMail(config.gmail);

const nowTimestamp = moment().format('YYYY-MM-DD');
const from = moment().subtract(12, 'months'); 
const to = moment().add(12, 'months'); 

exports.handler = async function(event, context, callback) {   
	try {
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

		let html = '<table>';

		html += '<th><td>Name</td><td>Score</td><td>Last Seen</td></th>'
		winners.forEach(person => {
			html += `<tr><td>${person.first} ${person.last}</td><td>${person.score}</td><td>${person.lastSeen}</td></tr>`;
		})

		html += '</table>';

		await gmail.send(`[Social Directory] ${new Date()}`, html);
	}
	catch(error) {
	  await gmail.send(`[Social Directory] ${new Date()} ERROR!`, `<pre>${error.stack}</pre>`);
		throw error;
	}
};
