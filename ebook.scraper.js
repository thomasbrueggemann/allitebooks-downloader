const cheerio = require("cheerio");
const Scraper = require("./scraper");

class Boats24Scraper extends Scraper {
	constructor() {
		super();

		this.baseUrl = "http://www.allitebooks.com";
		this.overviewUrl = this.baseUrl + "/";
	}

	/**
	 * Parses the HTML for a next-page link, that will be scanned within the
	 * overview scrape
	 * @return {String} The URL to the next page
	 */
	parseNextPage() {
		if (!this.$) return null;

		const current = this.$("span[class='current']");
		return current.next("a").attr("href");
	}

	/**
	 * Parses the HTML for all detail pages of boat listings
	 * @return {Array} An array of URLs to detail pages of an overview page
	 */
	parseDetailPages() {
		return this.$("h2[class='entry-title']")
			.find("a")
			.map((i, el) => {
				return cheerio(el).attr("href");
			})
			.get();
	}

	/**
	 * Parses a single detail page to extract boat listing information
	 * @param  {Object}     The previously found listing object
	 * @return {[type]}     [description]
	 */
	async parseDetailPage() {
		// find download links
		const files = this.$("span[class='download-links']")
			.children("a")
			.map((i, el) => {
				// extract href from all links
				return cheerio(el).attr("href");
			})
			.get()
			.filter((h) => {
				return h.indexOf("file.allitebooks.com") >= 0;
			})
			.map((h) => {
				const parts = h.split("/");
				return {
					url: h,
					name: parts[parts.length - 1]
				};
			});

		const description = this.$("article[class~='post']").text();

		return {
			files: files,
			description: description
		};
	}
}

module.exports = Boats24Scraper;
