const axios = require("axios");
const cheerio = require("cheerio");

const sourceUrl = "https://kpkesihatan.com/";

const getData = async (postIdList) => {
  let counter = 0;
  let tableSource = null;

  const res = await axios.get(sourceUrl);
  $ = cheerio.load(res.data);

  do {
    const articleHref = $("#" + postIdList[counter])
      .find("section")
      .children()
      .first()
      .find("a")
      .attr("href");

    const response = await axios.get(articleHref);
    $$ = cheerio.load(response.data);

    let stateTitle = null;

    let wpFigure = $$(".wp-block-table");

    const figureTable = wpFigure.each((index, figure) => {
      stateTitle = $$(figure)
        .children("table")
        .find("tbody")
        .children("tr")
        .first()
        .children("td")
        .eq(1)
        .children("strong")
        .first();

      if (stateTitle.text().includes("BILANGAN KES BAHARU")) {
        tableSource = $$(figure).children("table").find("tbody").children("tr");
      }
    });
    counter++;
  } while (tableSource == null && counter < postIdList.length);

  let dataList = []; // state data array
  const lastUpdatedAt = $$(".entry-date").text();

  if (tableSource === null || tableSource.length === 0) {
    console.log(`Table doesn't exist`);
    return [];
  }

  const tr = tableSource.each((index, elem) => {
    if (index != 0 && index != tableSource.length - 1) {
      let stateData = {
        state: $$(elem).children().children().text(),
        newCase: $$(elem).children().eq(1).text(),
        overallCase: $$(elem).children().eq(2).text(),
      };
      dataList.push(stateData);
    }
  });

  dataList.push(lastUpdatedAt);
  return dataList;
};

module.exports = getData;
