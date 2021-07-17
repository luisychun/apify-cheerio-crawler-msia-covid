const getCountryData = require("./cheerio/country_data");
const getPostId = require("./cheerio/get_state_post");
const getStateData = require("./cheerio/state_data");

(async () => {
  try {
    const countryData = await getCountryData();
    console.log("MOH data success: ");
    console.log(countryData);

    const postIdList = await getPostId();
    const stateData = await getStateData(postIdList);

    console.log("DG Health data success: ");
    console.log(stateData);
    process.exit(0);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
})();
