# Lồng tiếng Anh → Việt (Chrome extension)

Lồng tiếng Việt realtime cho video tiếng Anh: đọc phụ đề đang hiển thị, dịch sang tiếng Việt và đọc bằng giọng tiếng Việt của Chrome, đồng thời giảm âm lượng tiếng gốc. Không cần API key.

## Cài đặt

1. Mở `chrome://extensions`, bật **Developer mode**.
2. Bấm **Load unpacked**, chọn thư mục này.

## Sử dụng

1. Mở video (YouTube hoặc trang có phụ đề HTML5 `<track>`), **bật phụ đề tiếng Anh (CC)**. Phụ đề tự động của YouTube cũng dùng được.
2. Bấm biểu tượng extension → tick **Lồng tiếng Việt**, chỉnh **Âm lượng tiếng gốc** nếu muốn.

Pause video thì giọng đọc dừng, tua thì bỏ phần đang chờ đọc.

## Cách hoạt động

- `content.js` đọc phụ đề mỗi 250ms (`.ytp-caption-segment` trên YouTube, `video.textTracks` ở trang khác), lấy các từ mới (`captions.js`), gom thành câu rồi gửi đi.
- `background.js` dịch qua Google Translate và đọc bằng `chrome.tts` (`vi-VN`), giữ đúng thứ tự, đọc nhanh hơn khi bị chậm so với video.

## Giới hạn

- Video không có phụ đề thì không lồng tiếng được (chưa nhận dạng giọng nói từ âm thanh).
- Dùng endpoint dịch không chính thức của Google, có thể bị giới hạn số lượt.
- Giọng đọc trễ hơn hình khoảng 1–3 giây, vì phải đợi hết câu mới dịch.
- Cần có giọng đọc tiếng Việt trong Chrome (thường có sẵn "Google Tiếng Việt"); popup sẽ báo nếu thiếu.

## Test

```
node --test
```
