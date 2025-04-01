import axios from "axios";
import fs from "fs/promises";
import { existsSync } from "fs";
import googleTTS from "google-tts-api";
import { exec } from "child_process";
import { promisify } from "util";
import moment from "moment";
import config from "./config.js";

const execAsync = promisify(exec);
const DATA_FILE = "./data.json";
const NOTI_SOUND = "./assets/tingting.mp3";
const API_URL = "https://my.sepay.vn/userapi/transactions/list";

const formatDateTime = (datestring) => {
   return moment(datestring, "YYYY-MM-DD HH:mm:ss").format(
      "DD/MM/YYYY HH:mm:ss"
   );
};

const readDataFile = async () => {
   try {
      const content = await fs.readFile(DATA_FILE, "utf8");
      return JSON.parse(content);
   } catch {
      console.warn(
         "[WARNING] - Không tìm thấy hoặc không thể đọc tệp dữ liệu. Sử dụng giá trị mặc định."
      );
      return { lastTransactionId: null };
   }
};

const writeDataFile = async (data) => {
   try {
      await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
   } catch (error) {
      console.error("[LỖI] - Ghi dữ liệu không thành công:", error);
   }
};

const initDataFile = async () => {
   if (!existsSync(DATA_FILE)) {
      try {
         console.info("[INFO] - Tệp dữ liệu không tồn tại, đang khởi tạo...");
         const { data } = await axios.get(API_URL, {
            headers: { Authorization: `Bearer ${config.apiToken}` },
         });
         const txId = data.transactions[0]?.id || null;
         await writeDataFile({ lastTransactionId: txId });
         console.info("[INFO] - Khởi tạo tệp dữ liệu thành công.");
      } catch (error) {
         console.error("[LỖI] - Không thể khởi tạo tệp dữ liệu:", error);
         await writeDataFile({ lastTransactionId: null });
      }
   }
};

const fetchTransactions = async () => {
   try {
      const { lastProcessedTransactionId = null } = await readDataFile();
      const { data } = await axios.get(API_URL, {
         headers: { Authorization: `Bearer ${config.apiToken}` },
      });

      const latestTx = data.transactions.find(
         (tx) =>
            parseFloat(tx.amount_in) > 0 && tx.sub_account === config.subAccount
      );

      if (!latestTx) return;

      const latestTxId = String(latestTx.id);
      if (latestTxId === lastProcessedTransactionId) return;

      const amountReceived = Math.floor(parseFloat(latestTx.amount_in));
      const formattedDate = formatDateTime(latestTx.transaction_date);

      console.info(
         `\n🔔 [THÔNG BÁO - VA: ${config.subAccount}] 🔔\n` +
            `Thời gian:      ${formattedDate}\n` +
            `Số tiền nhận:   +${amountReceived} VND\n` +
            `Mã tham chiếu:  ${latestTx.reference_number}\n` +
            `------------------------------------------`
      );

      await playNotification(amountReceived);
      await writeDataFile({ lastProcessedTransactionId: latestTxId });
   } catch (error) {
      console.error("[LỖI] - Không thể truy xuất giao dịch:", error);
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
      console.error("[LỖI] - Phát thông báo âm thanh không thành công:", error);
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
