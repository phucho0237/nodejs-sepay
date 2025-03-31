import axios from "axios";
import fs from "fs";
import googleTTS from "google-tts-api";
import { exec } from "child_process";
import { promisify } from "util";
import config from "./config.js";

const execAsync = promisify(exec);
const DATA_FILE = "./data.json";
const NOTI_SOUND = "./assets/tingting.mp3";
const API_URL = "https://my.sepay.vn/userapi/transactions/list";

const readDataFile = () => {
   try {
      return JSON.parse(fs.readFileSync(DATA_FILE, "utf8")) || {};
   } catch {
      return { lastTransactionId: null };
   }
};

const writeDataFile = async (data) => {
   try {
      await fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
   } catch (error) {
      console.error("[ERROR] - Không thể ghi file data:", error);
   }
};

const initDataFile = async () => {
   if (!fs.existsSync(DATA_FILE)) {
      try {
         const { data } = await axios.get(API_URL, {
            headers: { Authorization: `Bearer ${config.apiToken}` },
         });
         writeDataFile({ lastTransactionId: data.transactions[0]?.id || null });
      } catch {
         writeDataFile({ lastTransactionId: null });
      }
   }
};

const fetchTransactions = async () => {
   try {
      const { lastTransactionId } = readDataFile();
      const { data } = await axios.get(API_URL, {
         headers: { Authorization: `Bearer ${config.apiToken}` },
      });

      const latestTx = data.transactions.find(
         (tx) => parseFloat(tx.amount_in) > 0
      );
      if (!latestTx || latestTx.id === lastTransactionId) return;

      const amountReceived = Math.floor(parseFloat(latestTx.amount_in));
      console.log(
         `[GIAO DỊCH MỚI] +${amountReceived} VND - ID: ${latestTx.id} - Ref: ${latestTx.reference_number} - Date: ${latestTx.transaction_date}`
      );

      await playNotification(amountReceived);
      writeDataFile({ lastTransactionId: latestTx.id });
   } catch (error) {
      console.error("[ERROR] - Không thể lấy danh sách giao dịch:", error);
   }
};

const playNotification = async (amount) => {
   try {
      const ttsUrl = googleTTS.getAudioUrl(
         `Giao dịch thành công! Đã nhận ${amount} đồng!`,
         { lang: "vi" }
      );
      await execAsync(
         `ffplay -nodisp -autoexit -loglevel quiet "${NOTI_SOUND}"`
      );
      await execAsync(`ffplay -nodisp -autoexit -loglevel quiet "${ttsUrl}"`);
   } catch (error) {
      console.error("[ERROR] - Không thể phát âm thanh:", error);
   }
};

const pollTransactions = async () => {
   await fetchTransactions();
   setTimeout(pollTransactions, 5000);
};

(async () => {
   await initDataFile();
   pollTransactions();
})();
