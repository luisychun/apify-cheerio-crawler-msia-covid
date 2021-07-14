const axios = require("axios");
const cheerio = require("cheerio");

const sourceUrl = "https://kpkesihatan.com/";

const getPostId = async () => {
  const res = await axios.get(sourceUrl);
  let $ = cheerio.load(res.data);
  const postId = $("#main-content").children().first().attr("id"); // .eq(1)
  const postIdBak = $("#main-content").children().eq(1).attr("id");

  return [postId, postIdBak];
};

module.exports = getPostId;
