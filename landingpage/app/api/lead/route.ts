import { NextResponse } from "next/server"
import { sendLeadEmail } from "@/lib/email"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // Gửi email thông báo lead mới (sử dụng Resend mặc định)
    try {
      const emailResult = await sendLeadEmail(body)
      console.log("Lead đã được gửi email thành công:", emailResult)
    } catch (emailError) {
      console.error("Lỗi gửi email:", emailError)
      // Vẫn trả về success cho user nhưng log lỗi email
    }
    
    // Trong ứng dụng thực tế, có thể lưu vào DB hoặc CRM
    console.log("Lead received:", body)
    
    return NextResponse.json({ 
      ok: true, 
      message: "Thông tin đã được gửi thành công. Chúng tôi sẽ liên hệ trong 24h." 
    })
  } catch (e) {
    console.error("Lỗi xử lý lead:", e)
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }
}
