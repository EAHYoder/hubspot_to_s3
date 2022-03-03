function isTruthy(value) {
  return ["true", "1", "t", "y", "yes"].includes(value);
}

class Config {
  static from_env() {
    //look at all the key/value pairs in the .env
    //if the key starts with PAN_CGF then take everything in the key after that and make THAT the key
    for (const [key, val] of Object.entries(process.env)) {
      if (key.startsWith("PAN_CFG_")) {
        this[key.slice("PAN_CFG_".length).toLowerCase()] = val;
      }
    }

    /*
         {
             s3_bucket_name=client_user_bucket,
             s3_file_name= client_file_name,
             make_contact= true
             make_company=true

         }
        */
    return this;
  }
}

class Secret {
  static from_env() {
    //look at all the key/value pairs in the .env
    //if the key starts with PAN_SEC then take everything in the key after that and make THAT the key
    for (const [key, val] of Object.entries(process.env)) {
      if (key.startsWith("PAN_SEC_")) {
        this[key.slice("PAN_SEC_".length).toLowerCase()] = val;
      }
    }

    /*
        {
            aws_secret_access_key= client_aws_secret_key
            aws_key_id=client_aws_key_id
            hubspot_api_key= client_hubspot_api_key
        }
        */
    return this;
  }
}

class Context {
  static from_env() {
    for (const [key, val] of Object.entries(process.env)) {
      if (key.startsWith("PAN_CTX_")) {
        this[key.slice("PAN_CTX_".length).toLowerCase()] = val;
      }
    }
    return this;
  }
}

module.exports = {
  Config,
  Context,
  Secret,
  isTruthy,
};
