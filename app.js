// load env
require("dotenv").config();

const sgSendMail = require("./utils/mailService");
const getCountryData = require("./cheerio/country_data");
const getPostId = require("./cheerio/get_state_post");
const getStateData = require("./cheerio/state_data");
const knex = require("./config/db");
const { countryTable, stateTable } = require("./config/tableList");

// DB
knex
  .raw("SELECT 1")
  .then(() => {
    console.log("DB connected");
  })
  .catch(async (err) => {
    await sgSendMail("Covid Scraper Failed", "DB connection failed");
    console.log(err);
    process.exit(1);
  });

(async () => {
  try {
    const countryData = await getCountryData();

    await knex
      .insert({
        data: JSON.stringify(countryData),
      })
      .into(countryTable);

    console.log("Country data inserted");

    const postIdList = await getPostId();

    const stateData = await getStateData(postIdList);

    if (stateData !== undefined && stateData.length > 1) {
      await knex
        .insert({
          data: JSON.stringify(stateData),
        })
        .into(stateTable);

      console.log("State data inserted");
    }

    await sgSendMail("Covid Scraper Success", "Data inserted into DB");
    process.exit(0);
  } catch (err) {
    await sgSendMail("Covid Scraper Failed", "Scraper failed");
    console.error(err.message);
    process.exit(1);
  }
})();
