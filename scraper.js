const cheerio = require("cheerio");
const request = require("request-promise-native");

class Scraper {
	constructor() {
		this.$ = null;
		this.currentLoadedUrl = null;
	}

	/**
	 * Triggers a request and downloads the HTML from URL and parses a cheerio
	 * @param  {String} url The URL to download from
	 * @return {Object}     Returns a cheerio object
	 */
	async load(url) {
		// shortcut, if the currently loaded url is the same as the
		// requested one
		if (this.currentLoadedUrl === url) return this.$;

		try {
			// download html
			const result = await request(url);

			// load cheerio object
			this.$ = cheerio.load(result);
			this.currentLoadedUrl = url;

			return this.$;
		} catch (e) {
			return null;
		}
	}

	/**
	 * Returns the text content of the sibling element of an HTML tag that
	 * contains a certain text
	 * @param  {String} tag        The HTML-tag to search for
	 * @param  {String} key        The text content the tag should contain
	 * @param  {String} siblingTag The HTML-tag of the sibling to read the text
	 *                             from
	 * @return {Object}            The found sibling or null
	 */
	findSibling(tag, key, siblingTag) {
		const keyElement = this.$(tag + ":contains(" + key + ")")
			.filter((i, el) => {
				// filter exact matches for siblings
				return (
					cheerio(el)
						.text()
						.trim() == key
				);
			})
			.first();

		// no element found?
		if (!keyElement || keyElement.get().length === 0) return null;

		const sibling = keyElement.next(siblingTag);

		// only return the sibling, if the array has elements
		if (!sibling || sibling.get().length === 0) return null;

		return sibling.first();
	}

	/**
	 * Returns the text content of the sibling element of an HTML tag that
	 * contains a certain text
	 * @param  {String} tag        The HTML-tag to search for
	 * @param  {String} key        The text content the tag should contain
	 * @param  {String} siblingTag The HTML-tag of the sibling to read the text
	 *                             from
	 * @return {String}            The text content of the sibling
	 */
	findSiblingText(tag, key, siblingTag) {
		// find the next sibling that matches the criteria
		const sibling = this.findSibling(tag, key, siblingTag);

		// no signling found?
		if (!sibling || sibling.text().length === 0) return null;

		return sibling.text().trim();
	}

	/**
	 * Reduces the text of child elements of a parent element to a list of
	 * strings
	 * @param  {Object} element    The cheerio element to start the search from
	 * @param  {String} childTags  The name of the child tags to reduce
	 * @return {Array}             A list of the child-texts, so that it can be
	 *                             joined together as neccesary
	 */
	reduceChildrenToText(element, childTags) {
		if (!element) return [];

		return element
			.children()
			.map((i, el) => {
				return cheerio(el).text();
			})
			.get();
	}
}

module.exports = Scraper;
