const GoogleSheet = require('./lib/GoogleSheet');
const { config } = require('./package.json');

const google = new GoogleSheet(config.sheets);

google.generateAuthUrl(['https://www.googleapis.com/auth/spreadsheets']);
google.generateToken('4/JgEeSkzEYARfJltjiu-aObT9hoTRKkKprnc7TTUre2SwE9knrYo5eII');
