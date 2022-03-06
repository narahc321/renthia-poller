const fs = require("fs");
const fetch = require("node-fetch");

const CONFIG_FILE_PATH = "./config.json";
const APARTMENTS_LIST_PATH = "./apartments-list.json";

const APARTMENTS_LIST = "apartments-list";
const PREFERENCES = "preferences";
const RESET_APARTMENTS_LIST = "reset_apartments_list";
const DATA_API = "data_api";
const DETAILS_API = "details_api";
const SLACK_HOOK = "slack_hook";
const POLLING_PERIOD_KEY = "polling_period";
const ID = "ID";

let apartments = [];

const generateURLfromConfig = (config) => {
  const preferences = config[PREFERENCES];
  let url = config[DATA_API] + "?";
  Object.entries(preferences).forEach(
    ([key, val]) => (url += key + "=" + val + "&")
  );
  return url.slice(0, -1);
};

const writeApartments = (apartments) => {
  fs.writeFileSync(
    APARTMENTS_LIST_PATH,
    '{ "' + APARTMENTS_LIST + '":' + JSON.stringify(apartments) + "}"
  );
};

const getPrevApartments = (config) => {
  const reset_list = config[RESET_APARTMENTS_LIST];
  if (!reset_list && fs.existsSync(APARTMENTS_LIST_PATH)) {
    const prev_apartments = JSON.parse(
      fs.readFileSync(APARTMENTS_LIST_PATH, "utf-8")
    );
    if (APARTMENTS_LIST in prev_apartments) {
      return prev_apartments[APARTMENTS_LIST];
    }
  }
  writeApartments([]);
  return [];
};

const postOnSlack = (ID, slack_hook, details_api) => {
  const payload = {
    channel: "renthia-stockholm-testing",
    attachments: [
      {
        color: "#4687f0",
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*ID:* ${ID}`,
            },
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `LINK: ${details_api}${ID}`,
            },
          },
          {
            type: "context",
            elements: [
              {
                type: "image",
                image_url: `https://avatars.githubusercontent.com/u/25249321?s=400&u=20e1ed01bce242f943a78cd659810d13e85041fa&v=4`,
                alt_text: "images",
              },
              {
                type: "mrkdwn",
                text: `*Author:* Narahc321`,
              },
            ],
          },
        ],
      },
    ],
  };

  fetch(slack_hook, {
    method: "POST",
    body: JSON.stringify(payload),
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Length": payload.length,
      Accept: "application/json",
    },
  })
    .then((res) => {
      if (!res.ok) {
        throw new Error(`Server error ${res.status}`);
      }
      return res;
    })
    .catch((error) => {
      console.log(error);
    });
};

const checkIfAnythingNew = (new_apartments, slack_hook, details_api) => {
  const config = fs.readFileSync(APARTMENTS_LIST_PATH, "utf-8");

  new_apartments = [new_apartments[0]];
  new_apartments.forEach((apartment) => {
    if (!apartments.includes(apartment[ID])) {
      postOnSlack(apartment[ID], slack_hook, details_api);
      apartments.push(apartment[ID]);
      writeApartments(apartments);
      console.log(apartment);
      return;
    }
  });
};

const fetchApartments = (url, slack_hook, details_api) => {
  fetch(url)
    .then((response) => response.json())
    .then((response_json) =>
      checkIfAnythingNew(response_json, slack_hook, details_api)
    );
};

const startPolling = (url, polling_period, slack_hook, details_api) => {
  fetchApartments(url, slack_hook, details_api);
  setInterval(() => {
    fetchApartments(url, slack_hook, details_api);
  }, polling_period);
};

const main = () => {
  const config = JSON.parse(fs.readFileSync(CONFIG_FILE_PATH, "utf-8"));

  const url = generateURLfromConfig(config);

  const slack_hook = config[SLACK_HOOK];

  const details_api = config[DETAILS_API];

  apartments = getPrevApartments(config);

  const polling_period =
    POLLING_PERIOD_KEY in config ? config[POLLING_PERIOD_KEY] : 10000;

  startPolling(url, polling_period, slack_hook, details_api);
};

main();
