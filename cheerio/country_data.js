const axios = require("axios");
const cheerio = require("cheerio");

const sourceUrl = "http://covid-19.moh.gov.my/";
const now = new Date();

const toNumber = (txt) => parseInt(txt.replace(/\D/g, "", 10));

const getData = async () => {
  const res = await axios.get(sourceUrl);
  const $ = cheerio.load(res.data);
  const iframUrl = $("#g-features script")
    .attr("id")
    .match(/(?<=_)[^_]+$/g)[0];

  const response = await axios.get(`https://e.infogram.com/${iframUrl}`);

  const values = response.data.match(/(?<="text":")(\+|\d|,)+(?=")/g);

  // Get new positive cases
  let newPositiveCase = response.data.match(
    /(?<="Kes\sBaharu:\s)(\+|\d|,)+(?=")/g
  );
  newPositiveCase = newPositiveCase[0].substr(1, newPositiveCase[0].length);

  // Get new positive local/import case
  const localImptCase = response.data.match(
    /(?<="Kes\sTempatan:\s|"Kes\sImport:\s)(\d|,)+(?=")/g
  );

  // Get new positive resident state
  const residentState = response.data.match(
    /(?<="-Warganegara:\s|"-Bukan\sWarganegara:\s)(\d|,)+(?=")/g
  );

  // Get latest updated date
  const srcDate = new Date(
    response.data.match(/(?<=updatedAt":")[^"]+(?=")/g)[0]
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
  return data;
};

module.exports = getData;
