require("dotenv").config();

const parseCSV = require("csv-parse/lib/sync");
const s3Download = require("./s3");
const HubspotAPI = require("./hubspot");
const { Config, Secret, Context, isTruthy } = require("./lib");

async function run() {
  const context = Context.from_env();
  const secret = Secret.from_env();
  const config = Config.from_env();

  console.error(`This run is in mode: ${context["run_mode"]}`);

  //an instance of the hubspotAPI class is an object that has the hubspot client, the provided config, the provided secret, the apiKey (which is determined by the secret).  It also has a create method on it, which is used to make new companies or contacts in hubspot.
  const hsAPI = new HubspotAPI(config, secret);

  try {
    //get data from AWS's S3
    const data = await s3Download(
      secret["aws_access_key_id"],
      secret["aws_secret_access_key"],
      config["s3_bucket_name"],
      config["s3_file_name"]
    );
    //separating the header(meta) of the CSV from all the rows of data.  Weeding out any empty lines.
    const [meta, ...records] = parseCSV(data, {
      skip_empty_lines: true,
    });
    //for each rown in the CSV, if it is a contact put a contact in hubspot.
    records.map(async (record) => {
      if (isTruthy(config["make_contact"])) {
        //this next line should maybe be console.log rather than console.error?
        console.error("Creating Contact", record);
        try {
          await hsAPI.create("contacts", record);
        } catch (err) {
          console.error("ERROR: Unable to create contact:", record);
        }
      }
      //for each rown in the CSV, if it is a company put a company in hubspot.
      if (isTruthy(config["make_company"])) {
        //this next line should maybe be console.log rather than console.error?
        console.error("Creating Company:", record);
        try {
          await hsAPI.create("companies", record);
        } catch (err) {
          console.error("ERROR: Unable to create company:", record);
        }
      }
    });
  } catch (err) {
    console.error("ERROR:", err);
  }
}

run();
