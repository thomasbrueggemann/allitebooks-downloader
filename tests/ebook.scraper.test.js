const eBookScraper = require("../ebook.scraper");

describe("ebook.scraper.js", () => {
	it("Should find the next page link", async () => {
		const scraper = new eBookScraper();
		await scraper.load(scraper.overviewUrl);

		const nextPage = scraper.parseNextPage();

		expect(nextPage).not.toBeNull();
		expect(nextPage).toBe("http://www.allitebooks.com/page/2/");
	});

	it("Should parse links to detail pages", async () => {
		const scraper = new eBookScraper();
		await scraper.load(scraper.overviewUrl);

		const pages = scraper.parseDetailPages();

		expect(pages).not.toBeNull();
		expect(pages.length).toBeGreaterThan(0);
	});

	it("Should parse a single detail page", async () => {
		const scraper = new eBookScraper();
		await scraper.load("http://www.allitebooks.com/good-habits-for-great-coding/");

		const page = await scraper.parseDetailPage();

		expect(page).not.toBeNull();
		expect(page.description.length).toBeGreaterThan(0);
		expect(page.files.length).toBe(1);
	});
});
