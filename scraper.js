const cheerio = require("cheerio");
const request = require("request-promise-native");
const TurndownService = require("turndown");
const gmaps = require("@google/maps");

class Scraper {
	constructor() {
		// constants
		this.FEET_TO_METERS = 0.3048;
		this.GALLONS_TO_LITERS = 3.78541;
		this.KW_TO_HP = 1.34102;
		this.SCRAPE_EVERY_HOURS = 24;

		this.$ = null;
		this.currentLoadedUrl = null;

		this.turndownService = new TurndownService();
		this.geocoder = gmaps.createClient({
			key: process.env.GOOGLE_API_KEY,
			Promise: Promise
		});
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
	 * Parses a meter unit from input text value, e.g. "10 m
	 * @param  {String} value A text string representing a meter measurement
	 * @return {Number}       A float decimal of the meter measurement value
	 */
	parseMetric(value) {
		if (!value) return null;

		// replace all comata with dots
		value = value.replace(/,/g, ".");

		// remove all non-numeric characters
		value = value.replace(/[^\d.]+/g, "");

		if (!value || value.length === 0) return null;

		return parseFloat(value);
	}

	/**
	 * Parses an imperial unit from input text value, e.g. "10'
	 * @param  {String} value A text string representing an imperial measurement
	 * @return {Number}       A float decimal of the imperial measurement value
	 */
	parseImperial(value) {
		if (!value) return null;

		return this.parseMetric(value.split("'")[0]);
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

	/**
	 * Parses a HTML String to Markdown
	 * @param  {String} input An HTML string
	 * @return {String}       A markdown string
	 */
	html2Markdown(input) {
		if (!input) return null;

		return this.turndownService.turndown(input);
	}

	/**
	 * Returns the object, that has the maximum property value in a list
	 * @param  {Array} listOfObjects    A list of objects
	 * @param  {String} byProperty      Property name to maximize on
	 * @return {Object}                 The object with the highest property
	 */
	getMaxObject(listOfObjects, byProperty) {
		if (!listOfObjects || listOfObjects.length === 0) return null;

		return listOfObjects.sort((a, b) => {
			return b[byProperty] - a[byProperty];
		})[0];
	}

	/**
	 * Geocodes the location.name property
	 * @param  {String} name    The location name
	 * @param  {Object} listing The complete listing object
	 */
	async geocodeLocation(name, listing) {
		if (name && name.length > 0) {
			if (!("location" in listing)) {
				listing.location = {};
			}

			listing.location.name = name;

			try {
				// geocode the address name
				const gmapsResult = await this.geocoder
					.geocode({ address: listing.location.name })
					.asPromise();

				const result = gmapsResult.json.results[0];

				// find country
				listing.location.country = result.address_components.filter(
					c => {
						return c.types.indexOf("country") >= 0;
					}
				)[0].short_name;

				// make sure country is lowercase
				if (listing.location.country) {
					listing.location.country = listing.location.country.toLowerCase();
				}

				// store geojson point for country
				listing.location.geojson = {
					type: "Point",
					coordinates: [
						result.geometry.location.lng,
						result.geometry.location.lat
					]
				};
			} catch (e) {
				console.log("ERROR", e);
			}
		}

		return listing;
	}
}

module.exports = Scraper;
