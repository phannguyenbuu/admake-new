# Giới hạn sản xuất và giá tối thiểu

Đơn vị lưu kích thước: cm; giao diện báo giá hiển thị mm. Giá: VND, chưa VAT và chưa vận chuyển. Các ngưỡng dưới đây là cấu hình khởi tạo theo nhóm/quy cách, không phải bảng giá thị trường đã được chủ xưởng duyệt; admin có thể chỉnh từng mẫu trong trang Sản phẩm & Công thức BOM.

Không đặt giới hạn tối đa theo mẫu. API chỉ từ chối kích thước dưới mức tối thiểu. Giá bán sản phẩm trước thuế được so với max(giá tối thiểu mỗi sản phẩm × số lượng, mức tối thiểu mỗi đơn), không lấy tiền vận chuyển để bù mức tối thiểu. Khoản bù được hiển thị riêng; giá vốn BOM không thay đổi. Mã vật tư thiếu/giá 0 vẫn chặn chốt như trước.

Báo giá cũ giữ snapshot. Công thức tăng version khi thêm chính sách; bản nháp cũ phải lưu/tính lại trước khi xác nhận. Script không đổi trạng thái duyệt công thức.

Khởi tạo: `python backend/scripts/configure_product_limits.py --prepare`. Áp dụng trên đúng DB admake_chat: `python scripts/configure_product_limits.py --apply --backup-dir /var/backups/admake-product-limits`. Script chỉ thêm chính sách còn thiếu, sao lưu định nghĩa và version cũ, giữ mặc định đã chỉnh riêng nếu vẫn hợp lệ.

| Mẫu | Ngang tối thiểu (mm) | Cao tối thiểu (mm) | Sâu tối thiểu (mm) | Giá tối thiểu / SP | Tối thiểu / đơn |
|---|---:|---:|---:|---:|---:|
| Biển chức danh chân gỗ 30 x 15 | 150 | 50 | 10 | 200,000 | 0 |
| Biển chức danh chân gỗ in UV | 150 | 50 | 10 | 250,000 | 0 |
| bảng chức danh đế gỗ ăn mòn | 150 | 50 | 10 | 200,000 | 0 |
| Biển số nhà inox số nổi nền vân gỗ 30 x 20 | 100 | 80 | 2 | 200,000 | 0 |
| Biển số nhà mica | 100 | 80 | 2 | 150,000 | 0 |
| Biển số nhà nền alu chữ nổi đồng | 100 | 80 | 2 | 200,000 | 0 |
| Biển tên công ty inox ăn mòn 40 x 30 | 150 | 100 | 1 | 250,000 | 0 |
| Bảng mica tên phòng 20 x 10 | 80 | 40 | 2 | 50,000 | 0 |
| Bảng hiệu alu chữ nổi 450 x 160 | 600 | 300 | 30 | 600,000 | 0 |
| Bảng hiệu alu chữ nổi mica | 600 | 300 | 30 | 600,000 | 0 |
| Bảng hiệu alu dán decal chữ nổi 500 x 90 | 600 | 300 | 30 | 600,000 | 0 |
| Bảng hiệu tôn sóng chữ mica | 600 | 300 | 30 | 600,000 | 0 |
| Bảng hiệu alu chữ nổi mica đèn LED | 600 | 300 | 40 | 900,000 | 0 |
| Bảng hiệu chữ nổi mica LED viền full màu 400 x 140 | 600 | 300 | 40 | 900,000 | 0 |
| Bảng hiệu tôn sóng chữ nổi mica đèn LED | 600 | 300 | 40 | 900,000 | 0 |
| bảng hiệu bạt lot tôn 1300 x 120 | 400 | 300 | 20 | 250,000 | 0 |
| Bảng hiệu bạt lót tôn 330 x 330 | 400 | 300 | 20 | 250,000 | 0 |
| Bảng hiệu bạt lót tôn 400 x 130 | 400 | 300 | 20 | 250,000 | 0 |
| Bảng hiệu tôn dán decal 600 x 120 | 400 | 300 | 20 | 250,000 | 0 |
| Bảng hiệu bạt lót tôn 2 mặt có trụ 250 x 150 | 600 | 600 | 50 | 1,200,000 | 0 |
| Bảng hiệu bạt lót tôn 2 mặt có trụ 300 x 150 | 600 | 600 | 50 | 1,200,000 | 0 |
| bảng hiệu xinhan bạt 2 mặt có trụ 150 x 150 | 600 | 600 | 50 | 1,200,000 | 0 |
| Bảng hiệu chữ nổi thanh lam nhôm | 600 | 300 | 30 | 900,000 | 0 |
| Bảng hiệu vách PVC vân đá | 600 | 400 | 10 | 800,000 | 0 |
| Chữ chân nhôm không gờ | 50 | 80 | 20 | 150,000 | 0 |
| Chữ chân nhôm xước có gờ | 50 | 80 | 20 | 150,000 | 0 |
| Chữ inox 304  mặt mica | 50 | 50 | 2 | 250,000 | 0 |
| Chữ inox 304 gắn nền đá | 50 | 50 | 2 | 250,000 | 0 |
| Chữ inox vàng gương 304 | 50 | 50 | 2 | 250,000 | 0 |
| Chữ inox 304 Chân cháo LED | 100 | 100 | 20 | 350,000 | 0 |
| Chữ inox 304 sáng hắt chân | 100 | 100 | 20 | 350,000 | 0 |
| Chữ inox gắn đá arylic | 100 | 100 | 20 | 350,000 | 0 |
| Chữ inox hông lổ gắn đá arylic LED | 100 | 100 | 20 | 350,000 | 0 |
| Chữ inox hông lổ gắn đá LED | 100 | 100 | 20 | 350,000 | 0 |
| Chữ mica sáng hắt chân | 100 | 100 | 20 | 350,000 | 0 |
| Chữ mica sáng mặt chân đứng đơn | 100 | 100 | 20 | 350,000 | 0 |
| Chữ mica uốn nổi fom đèn LED | 100 | 100 | 20 | 350,000 | 0 |
| Chữ nổi alu đồng sáng hắt chân | 100 | 100 | 20 | 350,000 | 0 |
| Chữ tôn rỉ set gắn LED bub | 100 | 100 | 20 | 350,000 | 0 |
| Chữ nổi alu dán tường | 50 | 50 | 3 | 80,000 | 0 |
| Chữ nổi dán tường | 50 | 50 | 3 | 80,000 | 0 |
| Chữ nổi mica chân fomex | 50 | 50 | 3 | 80,000 | 0 |
| Chữ nổi mica khung sắt | 50 | 50 | 3 | 80,000 | 0 |
| Chữ nổi mặt alu chân fomex | 50 | 50 | 3 | 80,000 | 0 |
| decal bế dán kính | 100 | 100 | 0.05 | 50,000 | 150,000 |
| decal bế dán kính 1 | 100 | 100 | 0.05 | 50,000 | 150,000 |
| Giấy in Voucher | 30 | 20 | 0.1 | 1,000 | 100,000 |
| Phiếu bảo hành in giấy | 30 | 20 | 0.1 | 1,000 | 100,000 |
| Hagtags Fomex cán decal | 50 | 50 | 2 | 15,000 | 100,000 |
| Hagtags Fomex cán decal 5mm | 50 | 50 | 2 | 15,000 | 100,000 |
| Bản hiệu LED viền sáng mặt 60 x 80 | 200 | 200 | 40 | 600,000 | 0 |
| bảng hiệu xinhan bạt 2 mặt 80 x 120 | 200 | 200 | 40 | 600,000 | 0 |
| hộp đèn bạt in UV 1 mặt 400 x 90 | 200 | 200 | 40 | 600,000 | 0 |
| Hộp đèn bạt không gân in UV viền nhôm nhét cạnh | 200 | 200 | 40 | 600,000 | 0 |
| Hộp đèn chibi 2 mặt 60 x 140 | 300 | 400 | 40 | 650,000 | 0 |
| Hộp đèn chibi 2 mặt 80 x 160 | 300 | 400 | 40 | 650,000 | 0 |
| Hộp đèn chibi 2 mặt LED viền 120 x120 | 300 | 400 | 40 | 800,000 | 0 |
| Hộp đèn hút nổi tròn 60 | 200 | 200 | 40 | 350,000 | 0 |
| Hộp đèn hút nổi vuông 60 | 200 | 200 | 40 | 350,000 | 0 |
| Hộp đèn tròn xinhan 40 | 200 | 200 | 40 | 350,000 | 0 |
| Hộp đèn sáng 5 mặt | 200 | 200 | 50 | 1,200,000 | 0 |
| Hộp đèn tôn rỉ sét 45 x 25 | 150 | 150 | 30 | 300,000 | 0 |
| Hộp đèn đường xinhan đèn LED | 400 | 400 | 40 | 800,000 | 0 |
| Kiot, đèn led 140 x 160 x 200 | 800 | 1500 | 600 | 8,000,000 | 0 |
| Kiot, đèn led 240 x 160 x 200 | 800 | 1500 | 600 | 8,000,000 | 0 |
| Led neon nhiều màu 90 x 60 | 150 | 150 | 10 | 400,000 | 0 |
| Led xinhan mũi tên 120 x 50 | 400 | 200 | 40 | 600,000 | 0 |
| Menu A4 fomex cán decal | 100 | 100 | 2 | 35,000 | 50,000 |
| Menu cầm tay A4 Fomex cán decal | 100 | 100 | 2 | 35,000 | 50,000 |
| Mica hút nổi ngôi sao búa liềm | 100 | 100 | 10 | 200,000 | 0 |
| Quầy thu ngân mặt đá, lam nhựa | 600 | 700 | 300 | 3,500,000 | 0 |
| Standee chân chữ X 60 x 160 | 400 | 600 | 50 | 180,000 | 0 |
| Tem decal in bế | 10 | 10 | 0.05 | 500 | 100,000 |
| Tranh điện siêu mỏng | 150 | 150 | 8 | 400,000 | 0 |
| Tranh điện siêu mỏng 60 x 80 | 150 | 150 | 8 | 400,000 | 0 |
| Trần alu gương bóng BUB viền khung nhôm | 1000 | 1000 | 50 | 1,500,000 | 0 |
| Tấm QR để bàn mica | 60 | 80 | 20 | 80,000 | 0 |
| Xe bán hàng, đèn led + kính 60 x 140 x 200 | 500 | 1000 | 400 | 4,500,000 | 0 |
| Xe bán hàng, đèn led + kính 60 x 150 x 200 | 500 | 1000 | 400 | 4,500,000 | 0 |
