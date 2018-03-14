const async = require("async");
const fs = require("fs-then-native");
const path = require("path");
const eBookScraper = require("./ebook.scraper");
const http = require("http");

const DOWNLOAD_DIR = "./data";

// init scraper
const scraper = new eBookScraper();
var pageUrl = scraper.overviewUrl;

// parse a single overview page until no new page is available
async.doWhilst(
	async () => {
		console.log("PAGE:", pageUrl);

		// load the overview page to scrape from
		await scraper.load(pageUrl);

		// parse all detail pages of this overview page
		const detailUrls = scraper.parseDetailPages();

		// async loop over etail urls and download them
		async.eachLimit(
			detailUrls,
			5,
			async (detailUrl) => {
				// parse the detail page
				console.log("DETAIL:", detailUrl);

				// check if we already downloaded this ebook by checking if a coherent folder exists
				const eBookSlug = detailUrl
					.replace("http://www.allitebooks.com/", "")
					.replace("/", "");
				const eBookFolderPath = path.join(__dirname, DOWNLOAD_DIR + "/" + eBookSlug);
				const alradyDownloaded = await fs.stat(eBookFolderPath);

				if (alradyDownloaded) {
					console.log("→ skipped");
					return;
				}

				// parse the detail page
				await scraper.load(detailUrl);
				const ebook = await scraper.parseDetailPage(listing || null);

				// download ebook pdfs or zips
				async.each(ebook.links, async (link) => {
					var file = fs.createWriteStream(eBookFolderPath + "/" + link);
					http.get(link, (response) => {
						response.pipe(file);
					});
				});

				// download description text
				// ...

				return;
			},
			(err) => {
				if (err) console.log(err);

				// parse the next page url
				return scraper.parseNextPage();
			}
		);
	},
	(pageUrl) => {
		return pageUrl !== null;
	}
);
