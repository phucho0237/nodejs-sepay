# From @phucho0237 w/ help of [ChatGPT](https://chatgpt.com)

# SePay Transaction Tracker

SePay Transaction Tracker là một công cụ theo dõi giao dịch tự động cho tài khoản SePay. Phần mềm này giúp bạn nhận thông báo ngay lập tức khi có giao dịch mới.

## 🚀 Tính năng

-  **Tự động theo dõi giao dịch**: Kiểm tra danh sách giao dịch từ tài khoản VA tại SePay mỗi 5 giây.
-  **Thông báo bằng âm thanh**: Phát tiếng chuông khi có giao dịch mới.
-  **Đọc số tiền nhận được**: Sử dụng Google TTS để đọc số tiền bằng tiếng Việt.
-  **Lưu trạng thái giao dịch**: Ghi lại dữ liệu giao dịch cuối cùng vào file `data.json` để tránh thông báo trùng lặp.

## 🛠 Cài đặt

### Yêu cầu

-  Node.js (>=16)
-  ffmpeg (để phát âm thanh) sử dụng ffplay

### Cách cài đặt

1. Clone repository:
   ```sh
   git clone https://github.com/phucho0237/sepay-transaction-tracker.git
   cd nodejs-sepay
   ```
2. Cài đặt các dependencies:
   ```sh
   npm install
   ```
3. Cấu hình API Token và số tài khoản VA:
   -  Tạo file `.env` và thêm token SePay của bạn:
      ```js
      TOKEN = sepaytoken;
      SUB_ACCOUNT = sotaikhoanVA;
      ```

## ▶️ Sử dụng

Chạy chương trình bằng lệnh:

```sh
node main.js
```

Khi có giao dịch mới, chương trình sẽ phát âm thanh và đọc số tiền nhận được.

## 🛠 Công nghệ sử dụng

-  Node.js
-  Axios (gửi request API)
-  Google TTS API (đọc số tiền)
-  FFmpeg (phát âm thanh thông báo)
-  Moment (định dạng ngày - giờ)

## 🆓 Dự án hoàn toàn miễn phí để sử dụng
