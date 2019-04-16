const sinon = require('sinon'); // eslint-disable-line import/no-extraneous-dependencies
const { expect } = require('chai'); // eslint-disable-line import/no-extraneous-dependencies
const GoogleSheet = require('./GoogleSheet');

describe('[class] GoogleSheet', () => {
  /* eslint  no-unused-expressions: off */

  let token;
  let oauth;
  let config;

  beforeEach(() => {
    token = {
      access_token: 'ya29.GlvlBl0RsTtU8uZNOI5P5ErrGPVm5OXB9YfgScGANfBaIvsrB',
      refresh_token: '1/kSncFfEAZy5tgIknvaUhr4T8EW6FvpOTBofUNwBBLO8',
      scope: 'https://www.googleapis.com/auth/spreadsheets',
      token_type: 'Bearer',
      expiry_date: 1554684728523,
    };

    oauth = {
      client_id: '164451747151-a2q7iceav90r07d83g7gp3n2q7gg25bz.apps.googleusercontent.com',
      project_id: 'quickstart-1551572748055',
      auth_uri: 'https://accounts.google.com/o/oauth2/auth',
      token_uri: 'https://oauth2.googleapis.com/token',
      auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
      client_secret: 'hCFQR_ffk5HUDOQGQOoETlyM',
      redirect_uris: [
        'urn:ietf:wg:oauth:2.0:oob',
        'http://localhost',
      ],
    };

    config = { token, installed: oauth };
  });

  describe('[method] constructor', () => {
    it('should export a constructor', () => {
      const gs = new GoogleSheet(config);

      expect(gs).to.be.instanceOf(GoogleSheet);
    });
  });

  describe('[method] load', () => {
    const values = [['some', 'data']];
    const sheetId = 'some-sheet-id';
    const range = 'Tab!A1:B';
    let gs;

    beforeEach(() => {
      gs = new GoogleSheet(config);

      sinon.stub(gs.api.spreadsheets.values, 'get').callsFake((options, cb) => {
        expect(options.spreadsheetId).to.equal(sheetId);
        expect(options.range).to.equal(range);
        cb(null, { data: { values } });
      });
    });

    it('should load sheet data, returning a promise', (done) => {
      gs.load(sheetId, range)
        .then(() => {
          expect(gs.rows).to.be.an('array');
          expect(gs.rows).to.have.lengthOf(1);
        })
        .then(done)
        .catch(done);
    });

    it('should reject w/error', (done) => {
      gs.api.spreadsheets.values.get.restore();
      sinon.stub(gs.api.spreadsheets.values, 'get').callsFake((options, cb) => {
        cb({ name: 'Boom!' });
      });

      gs.load(sheetId, range).catch((error) => {
        expect(error.name).to.equal('Boom!');
        done();
      });
    });

    it('should load sheet data, await syntax', async () => {
      await gs.load(sheetId, range);
      expect(gs.rows).to.be.an('array');
      expect(gs.rows).to.have.lengthOf(1);
    });

    it('should load sheet data raw if no column headers given', async () => {
      await gs.load(sheetId, range);
      expect(gs.rows).to.deep.equal(values);
    });

    it('should load sheet data inflated if column headers given', async () => {
      gs.orderedColumnHeaders = ['H1', 'H2'];
      await gs.load(sheetId, range);
      expect(gs.rows).to.deep.equal([{
        H1: values[0][0],
        H2: values[0][1],
      }]);
    });
  });

  describe('[method] inflateRow', () => {
    it('should convert a flat row to an object', () => {
      const gs = new GoogleSheet(config, {
        orderedColumnHeaders: ['first', 'last', 'source', 'email', 'targetFrequency'],
      });
      const rawRowData = ['John', 'Doe', 'High School', 'john.doe@gmail.com', 'weekly'];
      const rowObj = gs.inflateRow(rawRowData);

      expect(rowObj).to.deep.equal({
        first: 'John',
        last: 'Doe',
        source: 'High School',
        email: 'john.doe@gmail.com',
        targetFrequency: 'weekly',
      });
    });
  });

  describe('[method] update', () => {
    const values = [['some', 'data']];
    const sheetId = 'some-sheet-id';
    const range = 'Tab!A1:B';
    let gs;

    beforeEach(() => {
      gs = new GoogleSheet(config);
    });

    it('should update sheet data, await syntax', async () => {
      sinon.stub(gs.api.spreadsheets.values, 'update').callsFake((options, cb) => {
        expect(options.spreadsheetId).to.equal(sheetId);
        expect(options.range).to.equal(range);
        expect(options.resource.values).to.deep.equal(values);
        cb(null, { success: true });
      });

      const response = await gs.update(sheetId, range, values);
      expect(response.success).to.be.true;
    });

    it('should reject w/error', (done) => {
      sinon.stub(gs.api.spreadsheets.values, 'update').callsFake((options, cb) => {
        cb({ name: 'Boom!' });
      });

      gs.update(sheetId, range, values).catch((error) => {
        expect(error.name).to.equal('Boom!');
        done();
      });
    });
  });
});
