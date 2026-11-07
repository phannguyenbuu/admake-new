# Sản phẩm và công thức BOM

## Cài đặt

Chạy migration trước khi khởi động backend mới:

```sh
cd backend
psql -d admake_chat -f migrations/20261101_product_formulas.sql
python scripts/import_product_formulas.py --apply
```

Import tạo 79 sản phẩm **nháp**, không ghi đè công thức đã chỉnh. Ảnh đã chuẩn bị tại
`backend/static/product-bom/`, dữ liệu tại `product_formula_seed.json`.
Muốn tạo lại seed từ nguồn ảnh:

```powershell
python scripts/import_product_formulas.py --source "C:\Users\nguyenbuu.DESKTOP-TOEFTR1\Downloads\sản phẩm"
```

Phải triển khai cả ảnh, migration, dữ liệu seed, Python API và frontend. Chưa có migration
thì API không tự tạo bảng hoặc tự seed khi request.

## Quản trị

`/lead-manage/#product-formulas` hoặc `/lead-manage/product-formulas`.
Tài khoản role `-2`, lead `243` có quyền sửa thư viện chung. Có thể đổi lead quản trị qua
`PRODUCT_FORMULA_ADMIN_LEAD`. Mọi API yêu cầu đăng nhập và quyền `view_invoice`.
Vật tư lấy từ master 243 và mã riêng của lead hiện tại, ưu tiên mã master, giống inventory.

Admin chọn sản phẩm → chỉnh tham số và dòng → tính thử → xác nhận áp dụng.
Thêm nhanh bằng sao chép hoặc thêm nhiều ảnh (kế thừa công thức sản phẩm đang chọn).
Mỗi lần lưu công thức có version; các phiên chỉnh cùng lúc không được ghi đè nhau.

Seed là phương án cấu tạo sơ bộ theo ảnh/nhóm sản phẩm, **không phải định mức đã duyệt**.
Cần xác nhận mật độ LED, công suất/điện áp nguồn, bước xương, đường cắt vector, diện tích
chữ và mã vật liệu. Dòng nhập tay hoặc vật tư đặc biệt có giá 0 bắt buộc bổ sung trước
khi áp dụng. Hiện 31/79 sản phẩm có ít nhất một dòng cần định giá riêng.

## Công thức

Kích thước đầu vào cm: `L` dài, `W` rộng/sâu, `H` cao. Engine chuyển sang m trước khi tính.
`A=L*H`, `P=2*(L+H)`, `V=L*W*H`, `F` số mặt (1 hoặc 2). Tham số riêng do admin khai báo.
Công thức cho **một sản phẩm**; hệ thống nhân với số sản phẩm. Vận chuyển mặc định bỏ tick;
khi bật, kiểm tra số chuyến toàn đơn và chỉnh lượng nếu dùng chung chuyến.

Hỗ trợ `+ - * /`, `ceil`, `floor`, `min`, `max`, `round`, `sqrt`, `abs`, `pi`.
Không dùng eval, truy cập thuộc tính, indexing hoặc thực thi mã.
Khối lượng theo ĐVT database: `A/2.9768` tấm 1,22×2,44m; `P/6` cây 6m;
`ceil(P/0.02)/100` dây 100 bóng. Công thức phân bổ vật tư từ kho, không phải nesting
hoặc lệnh mua nguyên tấm. Đổi vật tư phải kiểm tra lại quy cách và công thức.

## Báo giá

`/invoices` và phần báo giá cũ cùng dùng component `ProductBomQuote`.
Luồng xác nhận: kích thước → vật tư → chốt BOM → báo giá. Backend xác nhận tuần tự,
lưu người xác nhận và thời điểm. Sửa kích thước/tham số yêu cầu xác nhận lại từ đầu;
sửa BOM từ vật tư; sửa tỷ lệ cộng giá/thuế chỉ yêu cầu chốt giá lại.

Báo giá lưu snapshot công thức, giá và kết quả; mở lại/in không tự đổi theo thư viện.
Lưu bản điều chỉnh có chủ ý tính lại theo thư viện hiện tại và yêu cầu xác nhận lại.
Chỉ công thức đã được admin áp dụng mới chốt báo giá cuối. Giá 0 hoặc mã thiếu chặn chốt.
Nhập tay trong báo giá chỉ thêm dòng cho báo giá đó; không tự tạo inventory item.

## Kiểm tra

```sh
python -m pytest tests/test_product_formula_engine.py tests/test_product_bom_api.py -q
cd ../frontend
npm run build
```

API tests dùng SQLite cô lập, kiểm tra phân quyền, snapshot và thứ tự xác nhận.
Không thay đổi database production.

## Ảnh thư viện

79 sản phẩm có cặp ảnh màu: Before tách nền trắng, After nhìn chếch từ trên xuống
trên grid mờ. File tại `frontend/public/product-references/*-photo-before.png`
và `*-photo-after.png`; ánh xạ theo ID trong `photo-views.json`.
Ảnh được xử lý bằng công cụ imagegen tích hợp; prompt từng ảnh lưu tại
`backend/config/product_photo_prompts.json`. Ảnh góc nhìn là ảnh minh họa,
không cung cấp dữ liệu hình học để tính BOM.
