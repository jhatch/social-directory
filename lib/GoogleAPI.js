const { google } = require('googleapis');

class GoogleAPI {
  constructor(creds = {}) {
    this.authorize(creds.oauth, creds.token);
  }

  static getApiVersion() {
    /* istanbul ignore next */
    return { name: 'some-google-api-name', version: 'v1000' };
  }

  /**
   * Create an OAuth2 client with the given credentials, and then execute the
   * given callback function.
   * @param {Object} credentials The authorization client credentials.
   * @param {function} callback The callback to call with the authorized client.
   */
  authorize(oAuth = {}, token = {}) {
    const { client_secret, client_id, redirect_uris } = oAuth;
    const apiConfig = this.constructor.getApiVersion();

    /* eslint camelcase: off */
    this.oAuth2Client = new google.auth.OAuth2(
      client_id,
      client_secret,
      redirect_uris && redirect_uris[0],
    );

    this.oAuth2Client.setCredentials(token);
    this.api = google[apiConfig.name] && google[apiConfig.name]({
      version: apiConfig.version,
      auth: this.oAuth2Client,
    });
  }

  /* istanbul ignore next */
  generateAuthUrl(SCOPES) {
    const authUrl = this.oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
    });

    /* eslint  no-console: off */
    console.log('visit this AUTH URL in your browser -->\n', authUrl);
  }

  /* istanbul ignore next */
  generateToken(code) {
    this.oAuth2Client.getToken(code, (err, token) => {
      /* eslint  no-console: off */
      console.log('STORE THIS TOKEN JSON IN YOUR CONFIG -->\n', JSON.stringify(token));
    });
  }
}

module.exports = GoogleAPI;
