import dotenv from "dotenv";
dotenv.config();

export default {
   apiToken: process.env.API_TOKEN,
   subAccount: process.env.SUB_ACCOUNT,
};
