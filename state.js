const Apify = require('apify')
const { log } = Apify.utils

const sourceUrl = 'https://kpkesihatan.com/'
let postId = ''

// get state data
Apify.main(async () => {
  log.info('Starting actor.')
  const requestQueue = await Apify.openRequestQueue()

  await requestQueue.addRequest({
    url: sourceUrl,
    userData: {
      label: 'GET_ARTICLE_HREF',
    },
  })

  const cheerioCrawler = new Apify.CheerioCrawler({
    requestQueue,
    maxRequestRetries: 5,
    requestTimeoutSecs: 60,
    handlePageFunction: async ({ request, body, $ }) => {
      const { label } = request.userData
      log.info('Page opened.', {
        label, // get article href from MOH website
        url: request.url,
      })

      switch (label) {
        case 'GET_ARTICLE_HREF':
          postId = $('#main-content').children().first().attr('id')
          const articleHref = $("#" + postId).find('section').children().first().find('a').attr('href')

          // console.log(`articleHref: ${articleHref}`)
          await requestQueue.addRequest({
            // add second request to the queue
            url: `${articleHref}`,
            userData: {
              label: 'EXTRACT_DATA',
            },
          })
          break
        case 'EXTRACT_DATA':
          // console.log(postId)
          log.info('Processing and saving data...')
          let dataList = []
          const lastUpdatedAt = $('.entry-date').text()
          const figureList = [28, 29, 30, 31, 32, 33]

          let listNum = 0
          let stateTable = null

          do {
            stateTable = $(
              `#${postId} > section > figure:nth-child(${figureList[listNum]}) > table > tbody > tr`
            )
            ++listNum
          } while (stateTable.length == 0 && listNum <= figureList.length - 1)

          const tableSource = stateTable

          const tr = tableSource.each((index, elem) => {
            if (index != 0 && index != tableSource.length - 1) {
              let stateData = {
                state: $(elem).children().children().text(),
                newCase: $(elem).children().eq(1).text(),
                overallCase: $(elem).children().eq(2).text(),
              }
              dataList.push(stateData)
            }
          })
          console.log(dataList)
          console.log(`() for import case`)
          console.log(`Last updated at: ${lastUpdatedAt}`)

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
