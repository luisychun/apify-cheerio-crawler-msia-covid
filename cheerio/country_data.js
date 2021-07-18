const axios = require("axios");
const cheerio = require("cheerio");

const sourceUrl = "http://covid-19.moh.gov.my/";
const now = new Date();

const toNumber = (txt) => parseInt(txt.replace(/\D/g, "", 10));

const getData = async () => {
  const res = await axios.get(sourceUrl);
  const $ = cheerio.load(res.data);
  const iframeUrl = $("#g-features script")
    .attr("id")
    .match(/(?<=_)[^_]+$/g)[0];

  const response = await axios.get(`https://e.infogram.com/${iframeUrl}`);

  const values = response.data.match(/(?<="text":")(\+|\d|,)+(?=")/g);

  // Get new positive cases
  let newPositiveCase = response.data.match(
    /(?<="Kes\sBaharu:\s)(\+|\d|,)+(?=")/g
  );
  newPositiveCase =
    newPositiveCase !== null
      ? newPositiveCase[0].substr(1, newPositiveCase[0].length)
      : "TBU";

  // Get new positive local/import case
  const localImptCase = response.data.match(
    /(?<="Kes\sTempatan:\s|"Kes\sImport:\s)(\d|,)+(?=")/g
  );

  // Get new positive resident state
  const residentState = response.data.match(
    /(?<="-Warganegara:\s|"-Bukan\sWarganegara:\s)(\d|,)+(?=")/g
  );

  // Get latest updated date
  const srcDate =
    response.data !== null
      ? new Date(response.data.match(/(?<=updatedAt":")[^"]+(?=")/g)[0])
      : "TBU";

  const data = {
    newPositiveCase: toNumber(newPositiveCase),
    newLocalCase: localImptCase !== null ? toNumber(localImptCase[1]) : "TBU",
    newImportCase: localImptCase !== null ? toNumber(localImptCase[0]) : "TBU",
    newLocalState: residentState !== null ? toNumber(residentState[0]) : "TBU",
    newForeignerState:
      residentState !== null ? toNumber(residentState[1]) : "TBU",
    newRecoveredCase:
      values !== null ? toNumber(values[4].substr(1, values[4].length)) : "TBU",
    newDeathCase:
      values !== null ? toNumber(values[1].substr(1, values[1].length)) : "TBU",
    overallTestedPositive: values !== null ? toNumber(values[0]) : "TBU",
    overallRecovered: values !== null ? toNumber(values[5]) : "TBU",
    overallDeath: values !== null ? toNumber(values[3]) : "TBU",
    activeCases: values !== null ? toNumber(values[2]) : "TBU",
    inICU: values !== null ? toNumber(values[7]) : "TBU",
    respiratoryAid: values !== null ? toNumber(values[8]) : "TBU",
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
    lastUpdatedAtSource:
      srcDate !== "TBU"
        ? new Date(
            Date.UTC(
              srcDate.getFullYear(),
              srcDate.getMonth(),
              srcDate.getDate(),
              srcDate.getHours() - 8,
              srcDate.getMinutes()
            )
          ).toISOString()
        : "TBU",
  };
  return data;
};

module.exports = getData;
