const GoogleAPI = require('./GoogleAPI');

class GoogleMail extends GoogleAPI {
  static getApiVersion() {
    return { name: 'gmail', version: 'v1' };
  }

  send(subject, html) {
    const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
    const messageParts = [
      'From: John Hatcher <john.h.hatcher@gmail.com>',
      'To: John Hatcher <john.h.hatcher@gmail.com>',
      'Content-Type: text/html; charset=utf-8',
      'MIME-Version: 1.0',
      `Subject: ${utf8Subject}`,
      '',
      html,
    ];
    const message = messageParts.join('\n');

    // The body needs to be base64url encoded.
    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    return new Promise((resolve, reject) => {
      this.api.users.messages.send({
        userId: 'me',
        resource: {
          raw: encodedMessage,
        },
      }, (err, res) => {
        if (err) return reject(new Error(`Failed to send email: ${err}`));
        return resolve(res);
      });
    });
  }
}

module.exports = GoogleMail;
