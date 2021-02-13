const Apify = require('apify')

const { log } = Apify.utils
const sourceUrl = 'http://covid-19.moh.gov.my/'
const LATEST = 'LATEST'
const now = new Date()

Apify.main(async () => {
  log.info('Starting actor.')
  const kvStore = await Apify.openKeyValueStore('COVID-19-MY')
  const dataset = await Apify.openDataset('COVID-19-MY-HISTORY')
  const requestQueue = await Apify.openRequestQueue()

  const req1 = await requestQueue.addRequest({
    url: sourceUrl,
    userData: {
      label: 'GET_IFRAME',
    },
  })

  const cheerioCrawler = new Apify.CheerioCrawler({
    requestQueue,
    maxRequestRetries: 5,
    requestTimeoutSecs: 60,
    handlePageFunction: async ({ request, body, $ }) => {
      const { label } = request.userData
      log.info('Page opened.', {
        label, // get iframe from moh website
        url: request.url,
      })

      switch (label) {
        case 'GET_IFRAME':
          const iframUrl = $('#g-intro script')
            .attr('id')
            .match(/(?<=_)[^_]+$/g)[0]
          await requestQueue.addRequest({
            // add second request to the queue
            url: `https://e.infogram.com/${iframUrl}`, // actual data are being stored here
            userData: {
              label: 'EXTRACT_DATA',
            },
          })
          break
        case 'EXTRACT_DATA':
          log.info('Processing and saving data...')
          const values = body.match(/(?<="text":")(\+|\d|,)+(?=")/g)
          let newCase = body.match(/(?<="Kes\sBaharu:\s)(\+|\d|,)+(?=")/g)

          const localCase = body.match(/(?<="Kes\sTempatan:\s)(\d|,)+(?=")/g)
          const imtCase = body.match(/(?<="Kes\sImport:\s)(\d|,)+(?=")/g)

          const localResident = body.match(/(?<="-Warganegara:\s)(\d|,)+(?=")/g)
          const foreigner = body.match(
            /(?<="-Bukan\sWarganegara:\s)(\d|,)+(?=")/g
          )

          const srcDate = new Date(
            body.match(/(?<=updatedAt":")[^"]+(?=")/g)[0]
          )

          console.log(values)
          newCase = newCase[0].substr(1, newCase[0].length)
          const data = {
            newCase: toNumber(newCase),
            localCase: toNumber(localCase[0]),
            imtCase: toNumber(imtCase[0]),
            localResident: toNumber(localResident[0]),
            foreigner: toNumber(foreigner[0]),
            newRecover: toNumber(values[4].substr(1, values[4].length)),
            newDeath: toNumber(values[1].substr(1, values[1].length)),
            testedPositive: toNumber(values[0]),
            recovered: toNumber(values[5]),
            activeCases: toNumber(values[2]),
            inICU: toNumber(values[7]),
            respiratoryAid: toNumber(values[8]),
            death: toNumber(values[3]),
            country: 'Malaysia',
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
          }
          console.log(data)

          // Push the data
          let latest = await kvStore.getValue(LATEST)
          if (!latest) {
            await kvStore.setValue('LATEST', data)
            latest = Object.assign({}, data)
          }
          delete latest.lastUpdatedAtApify
          const actual = Object.assign({}, data)
          delete actual.lastUpdatedAtApify
          const { itemCount } = await dataset.getInfo()
          if (
            JSON.stringify(latest) !== JSON.stringify(actual) ||
            itemCount === 0
          ) {
            await dataset.pushData(data)
          }
          await kvStore.setValue('LATEST', data)
          await Apify.pushData(data)
          log.info('Data saved.')
          requestQueue.isFinished()
          break
        default:
          break
      }
    },
    handleFailedRequestFunction: async ({ request }) => {
      console.log(`Request ${request.url} failed many times.`)
      console.dir(request)
    },
  })
  // Run the crawler and wait for it to finish.
  log.info('Starting the crawl.')
  await cheerioCrawler.run()
  log.info('Actor finished.')
})
const toNumber = (txt) => parseInt(txt.replace(/\D/g, '', 10))
