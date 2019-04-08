const GoogleAPI = require('./GoogleAPI');

class GoogleSheet extends GoogleAPI {
  constructor(creds, config = {}) {
    super(creds);
    this.orderedColumnHeaders = config.orderedColumnHeaders;
    this.rows = [];
  }

  static getApiVersion() {
    return { version: 'v4', name: 'sheets' };
  }

  inflateRow(rawRowData) {
    if (this.orderedColumnHeaders) {
      const rowObj = {};

      this.orderedColumnHeaders.forEach((header, index) => {
        rowObj[header] = rawRowData[index];
      });

      return rowObj;
    }

    return rawRowData;
  }

  load(sheetId, range) {
    return new Promise((resolve, reject) => {
      this.api.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range,
      }, (err, res) => {
        if (err) {
          return reject(err);
        }

        this.rows = res.data.values
          .map(rawRowData => this.inflateRow(rawRowData));

        return resolve(this);
      });
    });
  }

  update(id, range, values) {
    return new Promise((resolve, reject) => {
      this.api.spreadsheets.values.update({
        spreadsheetId: id,
        range,
        valueInputOption: 'USER_ENTERED',
        resource: {
          values,
        },
      }, (err, response) => {
        if (err) {
          return reject(err);
        }

        return resolve(response);
      });
    });
  }
}

module.exports = GoogleSheet;
