# Đề Xuất Liên Kết Giữa Các Module Trong Hệ Thống

Tài liệu này tổng hợp đề xuất liên kết nghiệp vụ và dữ liệu giữa các module hiện có của hệ thống ERP nội bộ, với trọng tâm là kết nối giữa các phần cũ với hai khối mới: `Accounting ERP` và `Inventory`.

Mục tiêu của kiến trúc liên kết:
- Đồng nhất luồng dữ liệu từ chứng từ gốc đến tác nghiệp và hạch toán.
- Truy vết hai chiều giữa chứng từ, công nợ, kho, thu chi, bảng lương và sổ cái.
- Giữ patch nhỏ, bám cấu trúc hiện có, hạn chế tạo thêm module trung gian không cần thiết.
- Tạo nền mở rộng cho báo cáo quản trị theo khách hàng, nhà cung cấp, task và công trình.

---

## 1. Hiện Trạng Hệ Thống

Các khối chức năng hiện có trong codebase:
- Nhân sự chấm công và workpoint
- Bảng lương tổng hợp
- Thu chi hàng ngày
- Chứng từ kế toán và Trung tâm chứng từ
- Quản lý khách hàng
- Quản lý nhà cung cấp
- Task và công trình/workspace
- Vật liệu/kho cũ
- Inventory mới
- Accounting ERP mới

Các bảng và model quan trọng đã tồn tại:
- `task`
- `workspace`
- `customer`
- `user`
- `accounting_daily_cash`
- `accounting_document`
- `document_center_document`
- `chart_of_accounts`
- `journal_entries`
- `journal_entry_lines`
- `ar_invoices`
- `ap_bills`
- `fixed_assets`
- `accounting_links`
- `inventory_items`
- `warehouses`
- `inventory_balances`
- `stock_transactions`

Đánh giá ngắn:
- Trục `AccountingLink` và `source_type/source_id` đã đủ tốt để làm lớp traceability chung.
- `Document Center` đã có hình thái phù hợp để làm chứng từ gốc.
- `Inventory` mới đã có cấu trúc đúng hơn `materials` cũ và nên là nguồn dữ liệu chuẩn cho kho.
- `Workpoint` đã nối tới bảng lương ở mức tính toán, nhưng chưa chốt thành nghĩa vụ kế toán đầy đủ.

---

## 2. Nguyên Tắc Liên Kết Chung

Nguyên tắc nên áp dụng thống nhất:
- Mỗi nghiệp vụ phát sinh thực tế nên có `nguồn gốc`, `tham chiếu`, `đối tượng`, `ảnh hưởng kế toán`.
- Ưu tiên foreign key trực tiếp khi quan hệ rõ ràng 1-1 hoặc 1-n.
- Dùng `accounting_links` cho liên kết chéo nhiều chiều hoặc liên kết mềm.
- Mỗi bút toán cần có `source_type`, `source_id`, `reference_no`.
- Mỗi giao dịch kho cần có `reference_type`, `reference_id`, `source_type`, `source_id`.
- Mỗi chứng từ quan trọng nên truy được tới: đối tượng, task/công trình, thanh toán, công nợ, bút toán, giao dịch kho.

Danh mục `source_type/target_type` nên thống nhất:
- `document`
- `task`
- `workspace`
- `customer`
- `supplier`
- `ar_invoice`
- `ap_bill`
- `ar_payment`
- `ap_payment`
- `daily_cash`
- `journal_entry`
- `stock_transaction`
- `inventory_item`
- `fixed_asset`
- `fixed_asset_depreciation`
- `payroll_batch`

---

## 3. Document Center Làm Chứng Từ Gốc

`DocumentCenterDocument` nên là lớp đầu vào của phần lớn nghiệp vụ kế toán và kho.

Vai trò đề xuất:
- Lưu chứng từ gốc theo loại và trạng thái workflow.
- Là điểm khởi tạo hoặc điểm neo liên kết cho:
  - AR
  - AP
  - nhập kho
  - xuất kho
  - thanh toán
  - tài sản cố định
  - hồ sơ hợp đồng, nghiệm thu, bàn giao

Ánh xạ loại chứng từ đề xuất:
- `INVOICE_OUT` -> tạo hoặc liên kết `ARInvoice`
- `INVOICE_IN` -> tạo hoặc liên kết `APBill`
- `PURCHASE_ORDER` -> liên kết `APBill`, `StockTransaction(purchase_receipt)`
- `DELIVERY_NOTE` -> liên kết `StockTransaction(sales_issue)`
- `HANDOVER` -> liên kết `StockTransaction(task_issue)`
- `PAYMENT_REQUEST` -> liên kết `AccountingDailyCash` hoặc `APBill`
- `RECEIPT` -> liên kết `AccountingDailyCash` hoặc `ARInvoicePayment`
- `PAYMENT` -> liên kết `AccountingDailyCash` hoặc `APBillPayment`
- `CONTRACT_*` -> chứng từ nền cho task, khách hàng, công trình
- `ACCEPTANCE` -> chứng từ nền cho AR, xuất hóa đơn, đối chiếu khối lượng
- `LIQUIDATION` -> chứng từ chốt vòng đời hợp đồng hoặc công trình

Khuyến nghị UI:
- Trong chi tiết chứng từ, thêm block:
  - công nợ liên quan
  - giao dịch kho liên quan
  - phiếu thu/chi liên quan
  - bút toán liên quan
  - task/công trình liên quan

---

## 4. Liên Kết Với Task Và Công Trình

`Task` hiện là đối tượng tác nghiệp quan trọng, phù hợp để làm nơi tập hợp chi phí trực tiếp.

Liên kết nên có:
- `StockTransaction.task_id`
- `DocumentCenterDocument.taskId`
- `DocumentCenterDocument.projectId`
- `StockTransaction.project_id`
- `AccountingDailyCash.source_type = task`
- `AccountingLink(task -> document/ar/cash/journal/stock)`

Luồng nghiệp vụ đề xuất:
- Task nhận vật tư:
  - tạo `task_issue`
  - giảm tồn kho
  - sinh bút toán chi phí hoặc WIP theo mapping
- Task hoàn thành nghiệm thu:
  - tạo `ACCEPTANCE`
  - có thể tạo `INVOICE_OUT`
  - tạo `ARInvoice`
- Task thu tiền:
  - tạo `ARInvoicePayment`
  - sinh `AccountingDailyCash`
  - sinh `JournalEntry`

Báo cáo cần hỗ trợ:
- vật tư đã xuất theo task
- chi phí vật tư theo task
- hồ sơ liên quan theo task
- công nợ phải thu theo task/công trình
- thu tiền theo task/công trình

---

## 5. Liên Kết Với Customer

`Customer` nên là master data chuẩn cho phía phải thu.

Liên kết nên có:
- `ARInvoice.customer_id -> customer.id`
- `DocumentCenterDocument.partnerId -> customer.id`
- `JournalEntryLine.partner_type = customer`
- `JournalEntryLine.partner_id = customer.id`
- `StockTransaction.partner_id` cho nghiệp vụ bán hàng hoặc trả hàng bán

Luồng chuẩn:
- Khách hàng
- Chứng từ bán / nghiệm thu / hóa đơn đầu ra
- AR invoice
- thu tiền
- bút toán công nợ và tiền

Lợi ích:
- aging report theo khách hàng
- statement theo khách hàng
- đối chiếu giữa chứng từ, hóa đơn và thu tiền
- truy ra các giao dịch kho đã giao cho khách

---

## 6. Liên Kết Với Supplier

`Supplier` là master data chuẩn cho phía phải trả và nhập kho.

Liên kết nên có:
- `InventoryItem.default_supplier_id`
- `APBill.supplier_id -> supplier.id`
- `DocumentCenterDocument.partnerId -> supplier.id`
- `StockTransaction.partner_id` cho `purchase_receipt`
- `JournalEntryLine.partner_type = supplier`
- `JournalEntryLine.partner_id = supplier.id`

Luồng chuẩn:
- Nhà cung cấp
- PO / hóa đơn đầu vào
- nhập kho
- AP bill
- thanh toán NCC
- bút toán công nợ, VAT, tiền và hàng tồn

Lợi ích:
- đối chiếu nhập kho với hóa đơn NCC
- công nợ phải trả theo nhà cung cấp
- tổng mua theo NCC
- lịch sử vật tư nhập theo NCC

---

## 7. Liên Kết Giữa Inventory Và Accounting

### 7.1. Vai trò của Inventory

`Inventory` nên là nguồn dữ liệu chuẩn cho:
- danh mục vật tư/hàng hóa
- kho
- số lượng tồn
- giá trị tồn
- ledger giao dịch kho

`materials` cũ nên được giữ ở mức:
- UI tương thích
- preview vật liệu
- dữ liệu legacy

Không nên tiếp tục mở rộng nghiệp vụ chuẩn trên `material_transaction`.

### 7.2. Luồng nhập kho mua hàng

Luồng đề xuất:
- `DocumentCenterDocument(INVOICE_IN hoặc PURCHASE_ORDER)`
- `StockTransaction(purchase_receipt)`
- `APBill`
- `JournalEntry`

Liên kết chính:
- `stock_transaction.reference_type = document/ap_bill`
- `stock_transaction.reference_id = document_id hoặc bill_id`
- `stock_transaction.accounting_entry_id = journal_entry.id`
- `AccountingLink(document -> stock_transaction)`
- `AccountingLink(stock_transaction -> ap_bill)`
- `AccountingLink(stock_transaction -> journal_entry)`

Bút toán đề xuất:
- Nợ `152/156/155`
- Nợ `133` nếu có VAT
- Có `331` nếu mua công nợ
- Có `111/112` nếu thanh toán ngay

### 7.3. Luồng xuất kho bán hàng

Luồng đề xuất:
- `DocumentCenterDocument(DELIVERY_NOTE/INVOICE_OUT)`
- `StockTransaction(sales_issue)`
- `ARInvoice`
- `JournalEntry`

Bút toán:
- Nợ `632`
- Có `155/156`

### 7.4. Luồng xuất kho cho task/công trình

Luồng đề xuất:
- `DocumentCenterDocument(HANDOVER hoặc INTERNAL_REQUEST)`
- `StockTransaction(task_issue/internal_issue)`
- `JournalEntry`

Bút toán:
- Nợ `621/627/641/642` hoặc `154`
- Có `152/153/156`

### 7.5. Luồng điều chỉnh kho

Điều chỉnh tăng:
- Nợ tài khoản tồn kho
- Có `711` hoặc tài khoản gain mapping

Điều chỉnh giảm:
- Nợ `811` hoặc tài khoản loss mapping
- Có tài khoản tồn kho

### 7.6. Giá vốn và tồn kho

Nguyên tắc đã phù hợp trong module mới:
- moving average cost
- không âm kho mặc định
- xuất kho lấy giá vốn theo average cost hiện tại

Khuyến nghị:
- không cho nhập tay `unit_cost` cho xuất kho chuẩn
- chỉ cho nhập tay ở adjustment có kiểm soát

---

## 8. Liên Kết Giữa AR/AP Và Accounting

### 8.1. Accounts Receivable

Luồng chuẩn:
- `DocumentCenterDocument(INVOICE_OUT)`
- `ARInvoice`
- `ARInvoicePayment`
- `AccountingDailyCash`
- `JournalEntry`

Bút toán đề xuất:
- khi confirm invoice:
  - Nợ `131`
  - Có `511`
  - Có `3331` nếu có VAT đầu ra
- khi thu tiền:
  - Nợ `111/112`
  - Có `131`

Traceability cần có:
- document -> ar invoice
- ar invoice -> payments
- payment -> cash row
- cash row -> journal

### 8.2. Accounts Payable

Luồng chuẩn:
- `DocumentCenterDocument(INVOICE_IN)`
- `APBill`
- `APBillPayment`
- `AccountingDailyCash`
- `JournalEntry`

Bút toán đề xuất:
- khi confirm bill:
  - Nợ tài khoản chi phí hoặc tồn kho
  - Nợ `133` nếu có VAT đầu vào
  - Có `331`
- khi thanh toán:
  - Nợ `331`
  - Có `111/112`

Liên kết với inventory:
- bill mua hàng nếu có hàng hóa/vật tư nhập kho nên link tới `StockTransaction(purchase_receipt)`

---

## 9. Liên Kết Giữa Daily Cash Và Các Module Khác

`AccountingDailyCash` nên đóng vai trò sổ quỹ và sổ ngân hàng vận hành.

Nên liên kết với:
- `ARInvoicePayment`
- `APBillPayment`
- `payroll_batch`
- `fixed_asset`
- `document`
- `task`

Quy tắc:
- Không buộc mọi giao dịch kho đi trực tiếp vào thu chi.
- Thu chi chỉ phát sinh khi có dòng tiền thực tế.
- Nếu cùng một chứng từ tạo ra cả công nợ, kho và dòng tiền, cần truy được toàn chuỗi.

Các trường hiện có đã phù hợp:
- `source_type`
- `source_id`
- `doc_ref`
- `journal_entry_id`
- `account_code`

Khuyến nghị UI:
- Từ phiếu thu/chi detail cần mở được:
  - chứng từ gốc
  - công nợ liên quan
  - journal liên quan
  - task/công trình liên quan

---

## 10. Liên Kết Workpoint, Payroll Và Accounting

Hiện trạng:
- `Workpoint` đã liên kết sang payroll summary ở mức tính toán.
- `Task(REWARD)` và `Message` loại thưởng/phạt/tạm ứng đã tham gia tính lương.
- Chưa có `payroll_batch` chuẩn để chốt kỳ lương và hạch toán.

Liên kết đề xuất:
- `Workpoint` -> `payroll_batch`
- `payroll_batch` -> `JournalEntry`
- `payroll_batch` -> `AccountingDailyCash`
- `payroll_batch` -> `AccountingLink`

Luồng chuẩn:
- tổng hợp workpoint theo kỳ
- chốt kỳ lương
- sinh bút toán lương phải trả:
  - Nợ `622/627/641/642`
  - Có `334`
- khi chi lương:
  - Nợ `334`
  - Có `111/112`

Lợi ích:
- đối chiếu lương phải trả và đã chi
- truy ra từ bảng lương tới phiếu chi
- gắn chi phí nhân công vào đúng bộ phận hoặc loại công việc

---

## 11. Liên Kết Fixed Assets Với Accounting Và Document

`FixedAsset` hiện đã có `source_document_id`, đây là nền tốt để trace.

Luồng đề xuất:
- `DocumentCenterDocument(INVOICE_IN hoặc CONTRACT_ECONOMIC)`
- `FixedAsset`
- `JournalEntry`
- `FixedAssetDepreciation`
- `JournalEntry`

Bút toán:
- ghi nhận tài sản:
  - Nợ `211`
  - Có `331` hoặc `111/112`
- khấu hao:
  - Nợ `627/641/642`
  - Có `214`

Khuyến nghị:
- nếu mua tài sản qua NCC, nên link thêm `APBill`
- chưa cần đưa tài sản cố định vào `inventory` chuẩn

---

## 12. Vai Trò Của AccountingLink

`AccountingLink` nên là lớp liên kết mềm cho toàn hệ thống.

Nên dùng trong các trường hợp:
- một document tạo nhiều đối tượng nghiệp vụ
- một task liên kết nhiều document, stock transaction, cash row, journal
- một AP/AR liên kết thêm inventory hoặc fixed asset
- truy vết hai chiều mà không muốn sửa thêm nhiều FK cứng

Ví dụ link nên có:
- `document -> ar_invoice`
- `document -> ap_bill`
- `document -> stock_transaction`
- `stock_transaction -> journal_entry`
- `ar_invoice -> journal_entry`
- `ap_bill -> journal_entry`
- `payroll_batch -> journal_entry`
- `payroll_batch -> daily_cash`
- `task -> stock_transaction`
- `task -> ar_invoice`
- `task -> document`

---

## 13. Thứ Tự Ưu Tiên Triển Khai

### Giai đoạn 1: Chuẩn hóa liên kết và truy vết
- Thống nhất `source_type/source_id/reference_type/reference_id`
- Bổ sung API trace chung theo object
- Hiển thị block liên kết trong detail page của accounting, inventory, document

### Giai đoạn 2: Đẩy Document Center thành chứng từ gốc thật
- Từ document tạo được AR, AP, stock transaction
- Hiển thị liên kết hai chiều ở detail document

### Giai đoạn 3: Nối Task với Inventory và Accounting
- xuất vật tư cho task
- ghi nhận chi phí vật tư theo task
- link nghiệm thu, AR, thanh toán theo task

### Giai đoạn 4: Nối Payroll với accounting đầy đủ
- tạo `payroll_batch`
- hạch toán `334`
- đối chiếu đã chi và còn phải trả

### Giai đoạn 5: Dọn legacy materials
- giữ UI preview
- chuyển nghiệp vụ chuẩn sang `inventory`
- thêm mapping legacy nếu cần đọc dữ liệu cũ

---

## 14. Rủi Ro Và Lưu Ý

- Nếu để song song `materials` cũ và `inventory` mới cùng ghi giao dịch thật, số liệu tồn kho sẽ lệch.
- Nếu `Document Center` không được dùng làm chứng từ gốc hoặc điểm neo liên kết, traceability sẽ phân mảnh.
- Nếu chưa có `payroll_batch`, phần lương vẫn chỉ dừng ở báo cáo tổng hợp, không đối chiếu được với `334`.
- Nếu `customer` và `supplier` không được dùng thống nhất cho AR/AP/document/journal, báo cáo theo đối tượng sẽ kém tin cậy.
- Nếu thiếu chuẩn hóa enum `source_type/target_type`, lớp `accounting_links` sẽ nhanh chóng mất giá trị.

---

## 15. Kết Luận

Kiến trúc hiện tại đã có nền đủ tốt để xây dựng một trục liên kết thống nhất mà không cần viết lại toàn bộ hệ thống.

Mô hình liên kết phù hợp nhất:
- `Master data`
- `Document Center / Task / Workspace`
- `Inventory / AR / AP / Payroll / Fixed Assets / Daily Cash`
- `Journal Entries`
- `Reports`

Lớp triển khai nên kết hợp:
- foreign key trực tiếp cho quan hệ rõ ràng
- `AccountingLink` cho quan hệ chéo và truy vết hai chiều

Trọng tâm ngắn hạn nên là:
- chuẩn hóa liên kết chứng từ
- nối task với chi phí vật tư và công nợ
- chốt payroll thành nghĩa vụ kế toán
- quy hoạch `inventory` làm nguồn dữ liệu kho chuẩn

Tài liệu này phù hợp để dùng làm bản định hướng kỹ thuật cho các patch tiếp theo ở backend, database và UI traceability.
