# Lồng tiếng Anh → Việt (Chrome extension)

Lồng tiếng Việt realtime cho video tiếng Anh, khớp thời điểm với giọng gốc: lấy phụ đề của video, dịch sang tiếng Việt và đọc bằng giọng Google Translate, đồng thời giảm âm lượng tiếng gốc. Không cần API key.

## Cài đặt

1. Mở `chrome://extensions`, bật **Developer mode**.
2. Bấm **Load unpacked**, chọn thư mục này.

## Sử dụng

1. Mở video (YouTube hoặc trang có phụ đề HTML5 `<track>`), **bật phụ đề tiếng Anh (CC)**. Phụ đề tự động của YouTube cũng dùng được.
2. Bấm biểu tượng extension → tick **Lồng tiếng Việt**, chỉnh **Âm lượng tiếng gốc** nếu muốn.

Giọng Việt bắt đầu cùng lúc với câu gốc (lệch khoảng 0,1 giây) và được tăng tốc vừa đủ để đọc xong trước câu kế tiếp. Pause video thì giọng đọc dừng, tua thì đọc tiếp từ vị trí mới.

## Cách hoạt động

- `youtube.js` chạy trong trang YouTube, bắt bản phụ đề (json3) mà chính player tải về; tự tải thì YouTube trả về rỗng vì thiếu token. Trang khác thì đọc `video.textTracks`.
- `captions.js` ghép phụ đề thành câu kèm mốc thời gian (`toSentences`).
- `content.js` dịch và tải giọng trước 20 giây, phát mỗi câu đúng lúc câu gốc bắt đầu, khung thời gian là đến câu kế tiếp. Nếu chưa có phụ đề kèm thời gian thì đọc phụ đề đang hiện trên màn hình (trễ 1–3 giây).
- `background.js` dịch qua Google Translate; `offscreen.js` phát giọng đọc tiếng Việt của Google Translate (service worker MV3 không phát được âm thanh), chỉnh tốc độ 1–2x cho vừa khung.

## Giới hạn

- Video không có phụ đề thì không lồng tiếng được (chưa nhận dạng giọng nói từ âm thanh).
- Dịch và giọng đọc dùng endpoint không chính thức của Google Translate, có thể bị giới hạn số lượt. Không cần cài giọng đọc trên máy.
- Câu gốc quá ngắn so với bản dịch thì giọng đọc tối đa 2x, phần còn lại bị cắt khi câu kế tiếp bắt đầu.
- Trên YouTube cần bật CC để player tải phụ đề; phụ đề bật lên giữa chừng vẫn được bắt.

## Test

```
node --test
```
