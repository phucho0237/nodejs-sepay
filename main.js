import axios from "axios";
import fs from "fs";
import googleTTS from "google-tts-api";
import { exec } from "child_process";
import { promisify } from "util";
import config from "./config.js";

const execAsync = promisify(exec);
const DATA_FILE = "./data.json";
const tingting_file = "./assets/tingting.mp3";
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
         console.error("[ERROR] - Không thể khởi tạo dữ liệu:", error);
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
      console.error("[ERROR] - Không thể đọc tệp dữ liệu:", error);
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
         console.log(`[GIAO DỊCH MỚI] +${amountReceived} VND`);
         await playNotification(amountReceived);
      }
   } catch (error) {
      console.error("[ERROR] - Không thể lấy danh sách giao dịch:", error);
   }
};

const playNotification = async (amount) => {
   try {
      const ttsUrl = googleTTS.getAllAudioUrls(
         `Giao dịch thành công! Đã nhận ${amount} đồng!`,
         { lang: "vi" }
      )[0].url;

      await execAsync(
         `ffplay -nodisp -autoexit -loglevel quiet "${tingting_file}"`
      );
      await execAsync(`ffplay -nodisp -autoexit -loglevel quiet "${ttsUrl}"`);
   } catch (error) {
      console.error("[ERROR] - Không thể phát âm thanh thông báo:", error);
   }
};

(async () => {
   await initDataFile();
   setInterval(fetchTransactions, 5000);
   fetchTransactions();
})();
