import axios from "axios";
import fs from "fs";
import googleTTS from "google-tts-api";
import { exec } from "child_process";
import { promisify } from "util";
import config from "./config.js";

const execAsync = promisify(exec);
const DATA_FILE = "./data.json";
const API_URL = "https://my.sepay.vn/userapi/transactions/list";

const initDataFile = async () => {
   if (!fs.existsSync(DATA_FILE)) {
      try {
         const { data } = await axios.get(API_URL, {
            headers: { Authorization: `Bearer ${config.apiToken}` },
         });
         const lastTransactionId = data.transactions[0]?.id || null;
         fs.writeFileSync(
            DATA_FILE,
            JSON.stringify({ lastTransactionId }, null, 2)
         );
      } catch (error) {
         console.error("[ERROR] - Failed to initialize data:", error);
         fs.writeFileSync(
            DATA_FILE,
            JSON.stringify({ lastTransactionId: null }, null, 2)
         );
      }
   }
};

const getLastTransactionId = () => {
   try {
      return (
         JSON.parse(fs.readFileSync(DATA_FILE, "utf8")).lastTransactionId ||
         null
      );
   } catch (error) {
      console.error("[ERROR] - Failed to read data file:", error);
      return null;
   }
};

const saveLastTransactionId = (id) => {
   fs.writeFileSync(
      DATA_FILE,
      JSON.stringify({ lastTransactionId: id }, null, 2)
   );
};

const fetchTransactions = async () => {
   try {
      const lastTransactionId = getLastTransactionId();
      const { data } = await axios.get(API_URL, {
         headers: { Authorization: `Bearer ${config.apiToken}` },
      });

      const latestTransaction = data.transactions[0];
      if (latestTransaction && latestTransaction.id !== lastTransactionId) {
         saveLastTransactionId(latestTransaction.id);
         const amountReceived = Math.floor(latestTransaction.amount_in);
         console.log(`[NEW TRANSACTION] +${amountReceived} VND`);
         await playNotification(amountReceived);
      }
   } catch (error) {
      console.error("[ERROR] - Failed to fetch transactions:", error);
   }
};

const playNotification = async (amount) => {
   try {
      const ttsUrl = googleTTS.getAllAudioUrls(
         `Giao dịch thành công! Đã nhận ${amount} đồng. Cảm ơn quý khách!`,
         { lang: "vi" }
      )[0].url;

      await execAsync(
         `ffplay -nodisp -autoexit -loglevel quiet "https://tiengdong.com/wp-content/uploads/Tieng-tinh-tinh-www_tiengdong_com.mp3"`
      );
      await execAsync(`ffplay -nodisp -autoexit -loglevel quiet "${ttsUrl}"`);
   } catch (error) {
      console.error("[ERROR] - Failed to play notification sound:", error);
   }
};

(async () => {
   await initDataFile();
   setInterval(fetchTransactions, 5000);
   fetchTransactions();
})();
