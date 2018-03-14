const Scraper = require("../scraper");

describe("scraper.js", () => {
	const scraper = new Scraper();
	const testDetailURL =
		"http://www.boattrader.com/listing/2018-bavaria-nautitech-46-fly-103198852";

	it("Should load the cheerio object", async () => {
		// load cheerio
		const $ = await scraper.load("http://www.boattrader.com/");

		expect($).not.toBeNull();
		expect($("title").text().length).toBeGreaterThan(1);
		expect($("title").text()).toContain("Boats");
	});

	it("Shoud NOT load the cheerio object", async () => {
		// load cheerio
		const $ = await scraper.load("http://127.0.0.1");

		expect($).toBeNull();
	});

	it("Should get the text of 'Make' field by it's sibling", async () => {
		await scraper.load(testDetailURL);

		// load the text of the sibling
		const txt = scraper.findSiblingText("th", "Make", "td");

		expect(txt).not.toBeNull();
		expect(txt).toBe("Bavaria");
	});

	it("Should NOT get the text of 'Make' field because tag 'a' is not a sibling", async () => {
		await scraper.load(testDetailURL);

		// load the text of the sibling
		const txt = scraper.findSiblingText("th", "Make", "a");

		expect(txt).toBeNull();
	});

	it("Should NOT find a sibling", async () => {
		await scraper.load(testDetailURL);

		// load the text of the sibling
		const sibling = scraper.findSibling("th", "Make", "body");

		expect(sibling).toBeNull();
	});

	it("Should NOT get the text of 'Test' field, because that does not exist", async () => {
		await scraper.load(testDetailURL);

		// load the text of the sibling
		const txt = scraper.findSiblingText("th", "Test", "td");

		expect(txt).toBeNull();
	});

	it("Should reduce all category children into an array", async () => {
		await scraper.load(
			"https://www.boats24.com/sailboat/sailing-yacht/c-yacht/350540/compromis-999-mit-yanmar-saildraive-motor.html"
		);

		const location = scraper.findSibling("div", "Berth:", "span");
		const locationName = scraper.reduceChildrenToText(location, "a");

		expect(locationName.join(" ")).toBe("Warns Netherlands");
	});

	it("Should NOT reduce anything into an array", async () => {
		const locationName = scraper.reduceChildrenToText(null, "a");

		expect(locationName.length).toBe(0);
	});
});
