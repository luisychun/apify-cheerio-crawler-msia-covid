// load env
require("dotenv").config();

const sgSendMail = require("./utils/mailService");
const getCountryData = require("./cheerio/country_data");
const getStateData = require("./cheerio/state_data");
const knex = require("./config/db");
const { countryTable, stateTable } = require("./config/tableList");

// DB
knex
  .raw("SELECT 1")
  .then(() => {
    console.log("DB connected");
  })
  .catch((err) => {
    console.log(err);
    process.exit(1);
  });

const fetchData = async () => {
  try {
    const countryData = await getCountryData();

    await knex
      .insert({
        data: JSON.stringify(countryData),
      })
      .into(countryTable);

    console.log("Country data inserted");

    const stateData = await getStateData();

    if (stateData.length > 1) {
      await knex
        .insert({
          data: JSON.stringify(stateData),
        })
        .into(stateTable);

      console.log("State data inserted");
    }

    process.exit(0);
  } catch (err) {
    await sgSendMail();
    console.error(err.message);
    process.exit(1);
  }
};

fetchData();
