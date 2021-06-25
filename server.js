const Apify = require("apify");
const { log } = Apify.utils;

const sourceUrl = "http://covid-19.moh.gov.my/";
// const LATEST = 'LATEST'
const now = new Date();

// get from MOH
Apify.main(async () => {
  log.info("Starting actor.");
  // const kvStore = await Apify.openKeyValueStore('COVID-19-MY')
  // const dataset = await Apify.openDataset('COVID-19-MY-HISTORY')
  const requestQueue = await Apify.openRequestQueue();

  await requestQueue.addRequest({
    url: sourceUrl,
    userData: {
      label: "GET_IFRAME",
    },
  });

  const cheerioCrawler = new Apify.CheerioCrawler({
    requestQueue,
    maxRequestRetries: 5,
    requestTimeoutSecs: 60,
    handlePageFunction: async ({ request, body, $ }) => {
      const { label } = request.userData;
      log.info("Page opened.", {
        label, // get iframe from MOH website
        url: request.url,
      });

      switch (label) {
        case "GET_IFRAME":
          const iframUrl = $("#g-features script")
            .attr("id")
            .match(/(?<=_)[^_]+$/g)[0];
          await requestQueue.addRequest({
            // add second request to the queue
            url: `https://e.infogram.com/${iframUrl}`,
            userData: {
              label: "EXTRACT_DATA",
            },
          });
          break;
        case "EXTRACT_DATA":
          log.info("Processing and saving data...");
          // Get overall data
          const values = body.match(/(?<="text":")(\+|\d|,)+(?=")/g);

          // Get new positive cases
          let newPositiveCase = body.match(
            /(?<="Kes\sBaharu:\s)(\+|\d|,)+(?=")/g
          );
          newPositiveCase = newPositiveCase[0].substr(
            1,
            newPositiveCase[0].length
          );

          // Get new positive local/import case
          const localImptCase = body.match(
            /(?<="Kes\sTempatan:\s|"Kes\sImport:\s)(\d|,)+(?=")/g
          );

          // Get new positive resident state
          const residentState = body.match(
            /(?<="-Warganegara:\s|"-Bukan\sWarganegara:\s)(\d|,)+(?=")/g
          );

          // Get latest updated date
          const srcDate = new Date(
            body.match(/(?<=updatedAt":")[^"]+(?=")/g)[0]
          );

          const data = {
            newPositiveCase: toNumber(newPositiveCase),
            newLocalCase: toNumber(localImptCase[1]),
            newImportCase: toNumber(localImptCase[0]),
            newLocalState: toNumber(residentState[0]),
            newForeignerState: toNumber(residentState[1]),
            newRecoveredCase: toNumber(values[4].substr(1, values[4].length)),
            newDeathCase: toNumber(values[1].substr(1, values[1].length)),
            overallTestedPositive: toNumber(values[0]),
            overallRecovered: toNumber(values[5]),
            overallDeath: toNumber(values[3]),
            activeCases: toNumber(values[2]),
            inICU: toNumber(values[7]),
            respiratoryAid: toNumber(values[8]),
            country: "Malaysia",
            sourceUrl,
            lastUpdatedAt: new Date(
              Date.UTC(
                now.getFullYear(),
                now.getMonth(),
                now.getDate(),
                now.getHours(),
                now.getMinutes()
              )
            ).toISOString(),
            lastUpdatedAtSource: new Date(
              Date.UTC(
                srcDate.getFullYear(),
                srcDate.getMonth(),
                srcDate.getDate(),
                srcDate.getHours() - 8,
                srcDate.getMinutes()
              )
            ).toISOString(),
          };
          console.log(data);

          // Push the data
          // let latest = await kvStore.getValue(LATEST)
          // if (!latest) {
          //   await kvStore.setValue('LATEST', data)
          //   latest = Object.assign({}, data)
          // }
          // delete latest.lastUpdatedAtApify
          // const actual = Object.assign({}, data)
          // delete actual.lastUpdatedAtApify
          // const { itemCount } = await dataset.getInfo()
          // if (
          //   JSON.stringify(latest) !== JSON.stringify(actual) ||
          //   itemCount === 0
          // ) {
          //   await dataset.pushData(data)
          // }
          // await kvStore.setValue('LATEST', data)
          // await Apify.pushData(data)
          // log.info('Data saved.')

          break;
        default:
          break;
      }
    },
    handleFailedRequestFunction: async ({ request }) => {
      console.log(`Request ${request.url} failed many times.`);
      console.dir(request);
    },
  });

  // Run the crawler and wait for it to finish.
  log.info("Starting the crawl.");
  await cheerioCrawler.run();
  log.info("Actor finished.");
});

const toNumber = (txt) => parseInt(txt.replace(/\D/g, "", 10));
