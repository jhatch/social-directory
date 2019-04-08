const GoogleAPI = require('./GoogleAPI');

class GoogleSheet extends GoogleAPI {
  constructor(config) {
    super(config);
    this.rowDefn = config.row;
    this.rows = [];
  }

  static getApiVersion() {
    return { version: 'v4', name: 'sheets' };
  }

  toRowObj(rawRowData) {
    if (this.rowDefn) {
      const rowObj = {};

      this.rowDefn.forEach((field, index) => {
        rowObj[field] = rawRowData[index];
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

        this.rows = res.data.values.map(row => this.toRowObj(row));
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
