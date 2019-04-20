const { expect } = require('chai'); // eslint-disable-line import/no-extraneous-dependencies
const GoogleAPI = require('./GoogleAPI');

describe('[class] GoogleAPI', () => {
  /* eslint no-unused-expressions: off */
  describe('[method] authorize', () => {
    it('should instantiate with a default config', () => {
      const gapi = new GoogleAPI();

      expect(gapi).to.be.instanceOf(GoogleAPI);
    });
  });
});
