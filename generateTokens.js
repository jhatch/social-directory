const GoogleAPI = require('./lib/GoogleAPI');
const credentials = require('./credentials.json');

const google = new GoogleAPI({ oauth: credentials.oauth });

// scopes:
// https://www.googleapis.com/auth/spreadsheets
// https://www.googleapis.com/auth/calendar.readonly
// https://www.googleapis.com/auth/gmail.send

google.generateAuthUrl(['']); // <-- scope
google.generateToken(''); // <-- token from first step
