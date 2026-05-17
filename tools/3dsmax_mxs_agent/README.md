# 3ds Max MXS Agent

Server-side agent nhỏ để biến câu lệnh tự nhiên thành MaxScript rồi cho 3ds Max tự chạy.

## Flow

1. User gửi lệnh tiếng Việt vào server, ví dụ `vẽ box 20x30x10`.
2. Server chuẩn hóa câu lệnh và ưu tiên rule engine rẻ token cho primitive cơ bản.
3. Nếu rule không hiểu và có cấu hình LLM, server gửi prompt JSON rất ngắn lên model.
4. Server sửa vài lỗi MXS phổ biến: code fence, `width=10` -> `width:10`, `box(...)` -> `box ...`.
5. 3ds Max client poll `/next.txt`, decode script base64 và `execute`.
6. Client gửi kết quả về `/result.txt`.

## Chạy server

```powershell
python tools/3dsmax_mxs_agent/server.py
```

Test không cần LLM:

```powershell
$body = @{ text = "vẽ box 20x30x10 tại 0 0 0" } | ConvertTo-Json
Invoke-RestMethod http://127.0.0.1:8787/ask -Method Post -ContentType "application/json" -Body $body
```

## Kết nối 3ds Max

Trong 3ds Max:

1. `Scripting > Run Script...`
2. Chọn `tools/3dsmax_mxs_agent/3dsmax_agent_client.ms`
3. Bấm `Start`

Sau đó POST lệnh vào `/ask`; Max sẽ poll và vẽ.

## Cấu hình LLM

Không bắt buộc. Nếu không cấu hình, agent vẫn xử lý rule cơ bản:

- box / hộp / lập phương
- sphere / hình cầu
- cylinder / hình trụ
- plane / mặt phẳng
- teapot / ấm trà

Nếu muốn dùng model OpenAI-compatible:

```powershell
$env:MXS_AGENT_API_KEY="..."
$env:MXS_AGENT_MODEL="gpt-4.1-mini"
$env:MXS_AGENT_CHAT_URL="https://api.openai.com/v1/chat/completions"
python tools/3dsmax_mxs_agent/server.py
```

`MXS_AGENT_CHAT_URL` có thể trỏ sang gateway hoặc local server miễn tương thích Chat Completions.

## Ví dụ lệnh

```powershell
Invoke-RestMethod http://127.0.0.1:8787/ask -Method Post -ContentType "application/json" -Body '{"text":"vẽ box dài 50 rộng 20 cao 10"}'
Invoke-RestMethod http://127.0.0.1:8787/ask -Method Post -ContentType "application/json" -Body '{"text":"vẽ sphere bán kính 15 tại 10 0 0"}'
Invoke-RestMethod http://127.0.0.1:8787/ask -Method Post -ContentType "application/json" -Body '{"text":"vẽ cylinder r 8 cao 60"}'
```

## Ghi chú tiết kiệm token

- Primitive cơ bản không gọi LLM.
- Prompt gửi model chỉ gồm schema ngắn và `{cmd: "..."}`
- MaxScript được repair bằng code trước khi gửi sang Max.
- Server không gửi scene context lên model mặc định.

## Safety

Validator chặn các lệnh nguy hiểm như `fileIn`, `shellLaunch`, `DOSCommand`, `loadMaxFile`, `saveMaxFile`, `resetMaxFile`, `quitMax`, và `System.Diagnostics.Process`.

Nếu cần agent làm tác vụ phá hủy scene như xóa hàng loạt object, nên thêm bước confirm riêng trước khi enqueue.
