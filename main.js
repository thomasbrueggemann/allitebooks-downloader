const async = require("async");
const fs = require("await-fs");
const path = require("path");
const eBookScraper = require("./ebook.scraper");
const mkdir = require("make-dir");
const download = require("download");
const ProgressBar = require("progress");

const DOWNLOAD_DIR = process.argv[2];

(async () => {
	// init scraper
	const scraper = new eBookScraper();
	var pageUrl = scraper.overviewUrl;

	// parse a single overview page until no new page is available
	do {
		console.log("PAGE:", pageUrl);

		// load the overview page to scrape from
		await scraper.load(pageUrl);

		// parse all detail pages of this overview page
		const detailUrls = scraper.parseDetailPages();

		// parse the next page url
		pageUrl = scraper.parseNextPage();

		// async loop over etail urls and download them
		for (const detailUrl of detailUrls) {
			let bar = new ProgressBar("[:bar] :percent :etas", {
				complete: "=",
				incomplete: " ",
				width: 20,
				total: 0
			});

			// parse the detail page
			console.log("DETAIL:", detailUrl);

			// check if we already downloaded this ebook by checking if a coherent folder exists
			const eBookNameSlug = detailUrl
				.replace("http://www.allitebooks.com/", "")
				.replace("/", "");
			const eBookFolderPath = DOWNLOAD_DIR + "/" + eBookNameSlug;

			var alreadyDownloaded = false;
			try {
				alreadyDownloaded = await fs.stat(eBookFolderPath);
			} catch (e) {
				alreadyDownloaded = false;
				await mkdir(eBookFolderPath);
			}

			if (alreadyDownloaded) {
				console.log("→ skipped");
				continue;
			}

			try {
				// parse the detail page
				await scraper.load(detailUrl);
				const ebook = await scraper.parseDetailPage();

				// download description text
				fs.writeFile(eBookFolderPath + "/description.txt", ebook.description);

				// download ebook pdfs or zips
				for (const file of ebook.files) {
					const data = await download(file.url).on("response", (res) => {
						bar.total = res.headers["content-length"];
						res.on("data", (data) => bar.tick(data.length));
					});
					fs.writeFile(eBookFolderPath + "/" + file.name, data);
				}
			} catch (e) {
				console.log(e);
			}
		}
	} while (pageUrl !== null);
})();
