require("dotenv").config();

const parseCSV = require("csv-parse/lib/sync");
const s3Download = require("./s3");
const HubspotAPI = require("./hubspot");
const { Config, Secret, Context, isTruthy } = require("./lib");

async function run() {
  const context = Context.from_env(); //this is just for the purposes of the console.log.  I also think, given the .env it would just be an empty object so I don't see the point of it here.  Presumably it's more important if you have put context in the .env
  const secret = Secret.from_env();
  /*
        {
            aws_secret_access_key= client_aws_secret_key
            aws_key_id=client_aws_key_id
            hubspot_api_key= client_hubspot_api_key
        }
        */
  const config = Config.from_env();
  /*
         {
             s3_bucket_name=client_user_bucket,
             s3_file_name= client_file_name,
             make_contact= true
             make_company=true

         }
        */

  console.error(`This run is in mode: ${context["run_mode"]}`);

  //an instance of the hubspotAPI class is an object that has the hubspot client, the provided config, the provided secret, the apiKey (which is determined by the secret).  This class also has a create method, which is used to make new companies or contacts in hubspot.
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
    //for each row in the CSV, if it is a contact put a contact in hubspot.
    records.map(async (record) => {
      //make_contact is set to true in .env, so this will always be true.... unless you change what is in the .env and you wouldn't be able to change that part way through invoking this.  I think this means we are either making all companies OR all contacts
      if (isTruthy(config["make_contact"])) {
        //this next line should maybe be console.log rather than console.error?
        console.error("Creating Contact", record);
        try {
          //create a is a method on the hubspot class instance.  Making this a method makes it far less cluttered in this file.
          await hsAPI.create("contacts", record);
        } catch (err) {
          console.error("ERROR: Unable to create contact:", record);
        }
      }
      //for each rown in the CSV, if it is a company put a company in hubspot.
      //make_company is set to true in .env, so this will always be true.... unless you change what is in the .env  and you wouldn't be able to change that part way through invoking this  I think this means we are either making all companies OR all contacts
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
