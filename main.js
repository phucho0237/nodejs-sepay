import axios from "axios";
import fs from "fs/promises";
import { existsSync } from "fs";
import googleTTS from "google-tts-api";
import { exec } from "child_process";
import { promisify } from "util";
import config from "./config.js";

const execAsync = promisify(exec);
const DATA_FILE = "./data.json";
const NOTI_SOUND = "./assets/tingting.mp3";
const API_URL = "https://my.sepay.vn/userapi/transactions/list";

const readDataFile = async () => {
   try {
      const content = await fs.readFile(DATA_FILE, "utf8");
      return JSON.parse(content);
   } catch {
      return { lastTransactionId: null };
   }
};

const writeDataFile = async (data) => {
   try {
      await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
   } catch (error) {
      console.error("[ERROR] - Không thể ghi file data:", error);
   }
};

const initDataFile = async () => {
   if (!existsSync(DATA_FILE)) {
      try {
         const { data } = await axios.get(API_URL, {
            headers: { Authorization: `Bearer ${config.apiToken}` },
         });
         const txId = data.transactions[0]?.id || null;
         await writeDataFile({ lastTransactionId: txId });
      } catch {
         await writeDataFile({ lastTransactionId: null });
      }
   }
};

const fetchTransactions = async () => {
   try {
      const { lastTransactionId } = await readDataFile();
      const { data } = await axios.get(API_URL, {
         headers: { Authorization: `Bearer ${config.apiToken}` },
      });

      const latestTx = data.transactions.find(
         (tx) => parseFloat(tx.amount_in) > 0
      );
      if (!latestTx) return;

      const latestTxId = String(latestTx.id);
      if (latestTxId === String(lastTransactionId)) return;

      const amountReceived = Math.floor(parseFloat(latestTx.amount_in));
      console.log(
         `[GIAO DỊCH MỚI] +${amountReceived} VND - ID: ${latestTxId} - Ref: ${latestTx.reference_number} - Date: ${latestTx.transaction_date}`
      );

      await playNotification(amountReceived);
      await writeDataFile({ lastTransactionId: latestTxId });
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
