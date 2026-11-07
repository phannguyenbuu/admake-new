# Vùng chữ của ảnh sản phẩm

Nguồn: toàn bộ 79 mẫu trong `~/Downloads/sản phẩm`, với 2 ảnh riêng cho mỗi mẫu.

- `frontend/public/product-references/text-annotations.json`: manifest frontend.
- `*-photo-before.text.json`, `*-photo-after.text.json`: dữ liệu riêng cạnh từng ảnh.
- Mỗi thư mục mẫu nguồn có `admake-text-bounds.json` chứa cả hai góc nhìn.
- `backend/config/product_text_overrides.json`: hiệu chỉnh theo đúng SHA-256 của ảnh.

Mỗi ảnh lưu kích thước và SHA-256. Mỗi vùng lưu nội dung nhận diện, bbox pixel
`[x, y, rộng, cao]`, tứ giác 4 đỉnh, phiên bản chuẩn hóa 0–1, độ tin cậy và trạng thái
kiểm tra. Gốc tọa độ ở trên trái. `slot_id` liên kết các vùng tương ứng giữa hai ảnh;
tọa độ luôn được đo riêng trên từng ảnh. Các dòng chỉ xuất hiện ở một ảnh vẫn có
slot riêng. Ảnh không có chữ có danh sách vùng rỗng, không dùng khung giả.

Nhận diện tự động có thể đọc sai chữ nhỏ/cách điệu. `review: pending` yêu cầu kiểm
tra lại, `automatic` chưa phải xác nhận thủ công, `verified` là vùng đã được hiệu
chỉnh. `image_reviewed` là kết quả đã đọc đối chiếu trực tiếp từ hình, không phải
xác nhận thủ công; bước này không cung cấp xác suất tin cậy đã hiệu chuẩn nên
`confidence` để null. Khung cam trên UI cho biết vùng cần kiểm tra. Không đốt khung
vào PNG gốc.

Toàn bộ 158 ảnh đã có kết quả trong `product_text_visual_review.json`. Dữ liệu
đọc đối chiếu được lưu theo SHA-256, gồm chữ thật và các vùng không có chữ. Công
cụ loại hoa văn/vương miện khỏi danh sách chữ và gộp các mảnh cùng dòng; các chữ
cách điệu đã đánh dấu mơ hồ vẫn giữ cờ kiểm tra. Mã slot dựa trên nội dung, có
`legacy_slot_ids` để giữ liên kết với các thay thế đã lưu trước khi rà lại.

Tạo lại bằng công cụ offline (không ghi DB production):

```powershell
python -m pip install -r backend/requirements-product-text.txt
python backend/scripts/annotate_product_text.py
python backend/scripts/annotate_product_text.py --rebuild
python -m pytest backend/tests/test_product_text_annotations.py -q
```

Chạy lại lượt đọc đối chiếu (dùng cấu hình dịch vụ riêng đã thiết lập tại máy):

```powershell
python backend/scripts/review_product_text.py --workers 2
python backend/scripts/annotate_product_text.py --rebuild
```

Kết quả được checkpoint cho từng ảnh ở `.codex_tmp/product-text-visual`; chạy
lại chỉ xử lý những ảnh chưa có kết quả. Không đưa credential hoặc định danh
dịch vụ xử lý vào manifest công khai.

Lần đầu cần chuẩn bị bộ dữ liệu nhận diện tiếng Việt/Anh trong cache của công cụ;
script chủ ý không tự tải dữ liệu khi chạy. `--refresh` chạy lại nhận diện. Cache
ở `.codex_tmp/product-text` gắn với hash ảnh. `--rebuild` chỉ hợp nhất cache và hiệu
chỉnh; sẽ lỗi nếu một ảnh chưa được nhận diện, không tự tạo tọa độ thay thế.

Frontend tải manifest cùng thư viện ảnh, cho chọn vùng chữ theo từng góc nhìn và
đính kèm đúng tọa độ ảnh đang gửi trong prompt. Trước khi tạo ảnh, SHA-256 được
kiểm tra lại. Chỉ lưu thay thế/correction đã chỉnh vào `brief.sign_content`; tọa độ
thư viện không nhét vào giới hạn 4 KB của brief trên backend hiện tại.
