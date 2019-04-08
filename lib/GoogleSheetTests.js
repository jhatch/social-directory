const moment = require('moment');
const expect = require('chai').expect;
const GoogleSheet = require('./GoogleSheet');
const config = require("../package.json").config;

describe("[class] GoogleSheet", () => {

	describe("[method] constructor", () => {

		it("should export a constructor", () => {
			const gs = new GoogleSheet(config.sheets);
	
			expect(gs).to.be.instanceOf(GoogleSheet);
		});
	});

	describe("[method] load", () => {

		it("should load sheet data, returning a promise", done => {
			const gs = new GoogleSheet(config.sheets);
	
			gs.load(config.sheets.id, config.sheets.range)
				.then(() => {
					expect(gs.rows).to.be.an('array');
					expect(gs.rows).to.have.lengthOf.at.least(1);
					console.log(gs.rows);
				})
				.then(done)
				.catch(done);
		});
	
		it("should load sheet data, await syntax", async () => {
			const gs = new GoogleSheet(config.sheets);
	
			await gs.load(config.sheets.id, config.sheets.range);
			expect(gs.rows).to.be.an('array');
			expect(gs.rows).to.have.lengthOf.at.least(1);
		});
	});

	describe("[method] toRowObj", () => {

		it("should convert a flat row to an object", () => {
			const gs = new GoogleSheet(config.sheets);
			const rowObj = gs.toRowObj(['John', 'Doe', 'High School', 'john.doe@gmail.com', 'weekly']);

			expect(rowObj).to.deep.equal({
				first: 'John',
				last: 'Doe',
				source: 'High School',
				email: 'john.doe@gmail.com',
				targetFrequency: 'weekly'
			});
		});
	});
});
