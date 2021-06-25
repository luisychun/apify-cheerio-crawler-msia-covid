const axios = require("axios");
const cheerio = require("cheerio");

const sourceUrl = "https://kpkesihatan.com/";

const getData = async () => {
  const res = await axios.get(sourceUrl);
  let $ = cheerio.load(res.data);
  const postId = $("#main-content").children().first().attr("id");
  const articleHref = $("#" + postId)
    .find("section")
    .children()
    .first()
    .find("a")
    .attr("href");

  const response = await axios.get(articleHref);
  $ = cheerio.load(response.data);

  let dataList = [];
  const lastUpdatedAt = $(".entry-date").text();

  let stateTitle = null;
  let tableSource = null;

  let wpFigure = $(".wp-block-table");

  const figureTable = wpFigure.each((index, figure) => {
    stateTitle = $(figure)
      .children("table")
      .find("tbody")
      .children("tr")
      .first()
      .children("td")
      .eq(1)
      .children("strong")
      .first();

    if (stateTitle.text().includes("BILANGAN KES BAHARU")) {
      tableSource = $(figure).children("table").find("tbody").children("tr");
    }
  });

  if (tableSource === null || tableSource.length === 0) {
    console.log(`Table doesn't exist`);
    return;
  }

  const tr = tableSource.each((index, elem) => {
    if (index != 0 && index != tableSource.length - 1) {
      let stateData = {
        state: $(elem).children().children().text(),
        newCase: $(elem).children().eq(1).text(),
        overallCase: $(elem).children().eq(2).text(),
      };
      dataList.push(stateData);
    }
  });

  console.log(dataList);
  console.log(`() for import case`);
  console.log(`Last updated at: ${lastUpdatedAt}`);
};

getData();
