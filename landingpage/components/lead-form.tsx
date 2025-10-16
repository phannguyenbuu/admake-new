"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

type LeadPayload = {
  name: string
  company: string
  email: string
  phone: string
  nhuCau: string
  industry: string
  companySize: string
}

export default function LeadForm() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [message, setMessage] = useState<string>("")
  const industries = [
    "Quảng cáo",
    "Sự kiện",
    "Nội thất",
    "Nhôm kính",
    "Cơ khí",
    "Điện nước",
    "Xây dựng",
    "Thạch cao",
    "Nghành cửa",
    "khác",
  ]
  const companySizes = [
    "01 - 10 người",
    "10 - 50 người",
    "50 - 100 người",
    "100 - 200 người",
    "200 người trở lên",
  ]

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus("loading")
    setMessage("")
    const form = new FormData(e.currentTarget)
    const payload: LeadPayload = {
      name: String(form.get("name") || ""),
      company: String(form.get("company") || ""),
      email: String(form.get("email") || ""),
      phone: String(form.get("phone") || ""),
      description: String(form.get("description") || ""),
      industry: String(form.get("industry") || ""),
      companySize: String(form.get("companySize") || ""),
    }

    try {
      const res = await fetch("/api/lead/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Có lỗi xảy ra")
      setStatus("success")
      setMessage("Đã gửi thông tin. Chúng tôi sẽ liên hệ trong 24h.")
      try {
        (e.target as HTMLFormElement).reset()
      } catch (err) {
        console.error(err)
      }
    } catch (err: any) {
      setStatus("error")
      setMessage(err?.message || "Không thể gửi yêu cầu")
    }
  }

  return (
    <form id="lead-form" onSubmit={onSubmit} className="space-y-3">
      <Input name="name" placeholder="Họ và tên" required />
      <Input name="company" placeholder="Công ty" required />
      <div className="grid gap-3 sm:grid-cols-2">
        <Input name="email" type="email" placeholder="Email" required />
        <Input name="phone" type="tel" placeholder="Điện thoại" required />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <select
          name="industry"
          required
          className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 dark:bg-input/30 flex h-9 w-full rounded-md border bg-transparent px-3 text-sm outline-none focus-visible:ring-[3px]"
          defaultValue=""
        >
          <option value="" disabled>
            Ngành nghề
          </option>
          {industries.map((i) => (
            <option key={i} value={i} className="text-foreground">
              {i}
            </option>
          ))}
        </select>
        <select
          name="companySize"
          required
          className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 dark:bg-input/30 flex h-9 w-full rounded-md border bg-transparent px-3 text-sm outline-none focus-visible:ring-[3px]"
          defaultValue=""
        >
          <option value="" disabled>
            Quy mô nhân sự
          </option>
          {companySizes.map((s) => (
            <option key={s} value={s} className="text-foreground">
              {s}
            </option>
          ))}
        </select>
      </div>
      <Textarea name="nhuCau" placeholder="Nhu cầu / Ghi chú" />
      <Button disabled={status === "loading"} className="w-full bg-brand-500 text-white hover:bg-brand-400">
        {status === "loading" ? "Đang gửi..." : "Đăng ký DÙNG THỬ"}
      </Button>
      {message && <p className={`text-sm ${status === "success" ? "text-green-600" : "text-red-600"}`}>{message}</p>}
      <p className="text-xs text-muted-foreground">Bấm gửi nghĩa là bạn đồng ý với Chính sách bảo mật.</p>
    </form>
  )
}
