const knex = require("./config/db");
const getCountryData = require("./cheerio/country_data");
const getStateData = require("./cheerio/state_data");

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

const fetchCountryData = async () => {
  try {
    const countryData = await getCountryData();
    const result = await knex
      .insert({
        data: JSON.stringify(countryData),
      })
      .into("country_data");

    console.log("Country data inserted");
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

const fetchStateData = async () => {
  try {
    const stateData = await getStateData();
    const result = await knex
      .insert({
        data: JSON.stringify(stateData),
      })
      .into("state_data");

    console.log("State data inserted");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

fetchCountryData();
fetchStateData();
