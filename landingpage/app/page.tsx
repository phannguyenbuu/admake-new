"use client"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  CheckCircle2,
  Factory,
  LineChart,
  Users,
  PhoneCall,
  BookOpen,
  Boxes,
  ClipboardList,
  Wrench,
  Building2,
  BarChart2,
  ShieldCheck,
  Layers3,
  Cog,
  Calculator,
  FileText,
  MessageSquare,
  Heart,
  Gift,
  FileCheck,
  Star,
  Megaphone,
  Calendar,
  Sofa,
  PanelsTopLeft, 
  Zap,
  Building,
  Layers
} from "lucide-react"
import LeadForm from "@/components/lead-form"

const categories = [
  {label: "Quảng cáo", icon: Megaphone},
  {label: "Sự kiện", icon: Calendar},
  {label: "Nội thất", icon: Sofa},
  {label: "Nhôm kính", icon: PanelsTopLeft},
  {label: "Cơ khí", icon: Cog},
  {label: "Điện nước", icon: Zap},
  {label: "Xây dựng", icon: Building},
  {label: "Thạch cao", icon: Layers},
];

export default function Page() {


  const handleClick = () => {
    const leadForm = document.getElementById('dang-ky');
    if (leadForm) {
      leadForm.scrollIntoView({ behavior: 'smooth' });
    }
  }
  return (
    <main className="min-h-dvh w-full">
      {/* Header */}
      <header className="w-full border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
        <div className="flex items-center">
          <div className="flex items-center justify-center">
            <Image  width={50} height={50} alt="logo" className="w-13 h-13 mr-3" src="/logo.png"/>
            <Image width={154} height={30} alt="ADMAKE" className="h-8" src="/ADMAKE.svg"/> 
          </div>
          </div>
          <nav className="hidden items-center gap-6 text-sm md:flex">
            <Link href="#tong-quan" className="hover:text-brand-600">
              Tổng quan
            </Link>
            <Link href="#phan-he" className="hover:text-brand-600">
              Phân hệ
            </Link>
            <Link href="#bang-gia" className="hover:text-brand-600">
              Bảng giá
            </Link>
            <Link href="#ly-do" className="hover:text-brand-600">
              Lý do chọn
            </Link>
            <Link href="#hieu-qua" className="hover:text-brand-600">
              Hiệu quả
            </Link>
            <Link href="#case-study" className="hover:text-brand-600">
              Khách hàng
            </Link>
            <Link href="#lien-he" className="hover:text-brand-600">
              Liên hệ
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Button asChild size="sm" className="bg-brand-500 text-white hover:bg-brand-400">
              <Link href="#dang-ky" className="text-white hover:text-brand-400">DÙNG THỬ</Link>
            </Button>
          </div>
        </div>
      </header>
      {/* Hero */}
      <section className="relative isolate">
        <script data-name-bot="bot lộc"
	        src="https://app.preny.ai/embed-global.js"
	        data-button-style="width:300px;height:300px;"
	        data-language="vi"
	        async
	        defer
	        data-preny-bot-id="69016558d7775fd3ed4c5ed8"
        ></script>
        <div className="absolute inset-0 -z-10">
          <Image
            src="/industrial-factory-workers-machinery.png"
            alt="Ảnh nền nhà máy công nghiệp"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/40 to-black/55" />
        </div>

        <div className="container mx-auto grid grid-cols-1 gap-8 px-4 py-12 md:grid-cols-[1.2fr_1fr] md:py-16 lg:py-20">
          <div className="text-white">
            <p className="mb-2 inline-block rounded bg-brand-500 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-white">
            Phần mềm giải pháp cho người làm nghề thời đại số
              </p>
              {/* <div className="flex items-center gap-2 ">
              <Image src="/logo.png" alt="ADMAKE Company Management" width={200} height={200} />
              </div> */}
            <p className="mt-4 max-w-2xl text-sm/6 md:text-base/7 text-white/90">
              ADMAKE không chỉ là một phần mềm quản lý, mà là giải pháp đột phá dành riêng cho các xưởng sản xuất và đội nhóm thi công. Sinh ra từ kinh nghiệm thực chiến trong ngành, ADMAKE giải quyết triệt để những bài toán kinh doanh, giúp bạn quản lý vững vàng, phát triển bền vững và thảnh thơi sáng tạo.
            </p>
            <ul className="mt-6 grid max-w-2xl grid-cols-1 gap-3 text-sm md:grid-cols-2 font-bold">
              {[
                { title: "Quản lý công việc chuyên nghiệp", desc: "Sắp xếp, phân việc và theo dõi tiến độ khoa học" },
                { title: "Chấm công linh hoạt & Tính lương tự động", desc: "Chấm công GPS, nhận diện khuôn mặt, tự động cập nhật lương" },
                { title: "Báo giá 3D & Tối ưu vật tư", desc: "Bóc tách định mức vật tư từ bản vẽ 2D/3D, tối ưu chi phí" },
                { title: "Chat nhóm chuyên nghiệp", desc: "Giao tiếp nội bộ, phối hợp chăm sóc khách hàng hiệu quả" },
                { title: "Minh bạch từ Chấm sao khách hàng", desc: "Khách hàng đánh giá trực tiếp, tích hợp vào lương thưởng" },
                { title: "Quản lý giấy tờ thuế quan", desc: "Lưu trữ giấy tờ pháp lý, báo cáo thuế chuẩn xác" },
              ].map((item) => (
                <li key={item.title} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-brand-400" />
                  <div>
                    <div className="font-semibold text-white">{item.title}</div>
                    <div className="text-xs text-white/80">{item.desc}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <Card id="dang-ky" className="bg-white/95">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl">Đăng ký DÙNG THỬ miễn phí</CardTitle>
              <CardDescription>Nhập thông tin để nhận tư vấn trong 24h</CardDescription>
            </CardHeader>
            <CardContent>
              <LeadForm />
            </CardContent>
          </Card>
        </div>

        {/* Lĩnh vực áp dụng */}

        <div className="bg-neutral-800/80 py-10">
          <div className="container mx-auto px-4">
            <div className="mx-auto mb-6 flex h-32 w-32 items-center justify-center rounded-full border-4 border-brand-400 text-center text-[11px] font-semibold uppercase tracking-wide text-white">
              Lĩnh vực <br />
              áp dụng
            </div>
            <div className="mx-auto grid max-w-3xl grid-cols-2 gap-3 text-xs sm:grid-cols-3 md:grid-cols-4 lg:text-sm">
              {categories.map(({ label, icon: Icon }) => (
                  <button
                    key={label}
                    className="flex items-center gap-3 rounded-full bg-brand-500 px-4 py-2 font-medium text-white shadow hover:bg-brand-400"
                  >
                    <Icon size={16} />
                    {label}
                  </button>
                
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Tổng quan */}
      <section id="tong-quan" className="bg-brand-400 py-14 text-white">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-2xl font-bold md:text-3xl">Tổng quan phần mềm ADMAKE</h2>
            <p className="mt-2 font-bold text-white/80">Bộ giải pháp linh hoạt, đáp ứng đa dạng mô hình doanh nghiệp sản xuất.</p>
          </div>

          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 font-bold">
            {[
              {
                icon: Cog,
                title: "Quản lý & Vận hành",
                desc: "Điều phối và sắp xếp công việc một cách khoa học.",
              },
              { 
                icon: Users, 
                title: "Nhân sự & Lương bổng", 
                desc: "Quản lý đội ngũ và tính toán lương thưởng minh bạch." 
              },
              {
                icon: Calculator,
                title: "Báo giá & Vật tư",
                desc: "Tối ưu chi phí và quản lý vật liệu hiệu quả.",
              },
              {
                icon: FileText,
                title: "Kế toán & Pháp lý",
                desc: "Đơn giản hóa các thủ tục giấy tờ và tuân thủ pháp luật.",
              },
              { 
                icon: MessageSquare, 
                title: "Giao tiếp nội bộ", 
                desc: "Tăng cường sự phối hợp và giao tiếp trong đội ngũ." 
              },
              {
                icon: Heart,
                title: "Khách hàng",
                desc: "Quản lý thông tin và nâng cao sự hài lòng của khách hàng.",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <Card key={title} className="border-0 bg-white text-foreground shadow gap-0">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500 text-white">
                      <Icon className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-base">{title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 text-sm text-muted-foreground">{desc}</CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Button variant="default" className="bg-brand-500 text-white hover:bg-brand-400" onClick={handleClick}>
              Tôi muốn được tư vấn
            </Button>
          </div>
        </div>
      </section>

      {/* Các phân hệ */}
      <section id="phan-he" className="relative overflow-hidden bg-gradient-to-b from-brand-300 to-brand-100 py-14">
        <div className="container mx-auto px-4">
          <h2 className="text-center text-2xl font-bold md:text-3xl">Tính năng đột phá của ADMAKE
          </h2>
         
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 font-bold">
            {[
              { icon: ClipboardList, title: "Quản lý Công việc chuyên nghiệp", desc: "Sắp xếp, phân việc và theo dõi tiến độ theo từng cột riêng biệt, giúp công việc không bị trôi hay lẫn lộn trong các dòng tin nhắn." },
              { icon: Users, title: "Chấm công linh hoạt & Chính xác", desc: "Chấm công tức thì qua GPS và nhận diện khuôn mặt, ngay cả khi nhân viên ở công trình, không cần máy móc cồng kềnh." },
              { icon: Calculator, title: "Tự động tính lương & Minh bạch", desc: "Dữ liệu chấm công và các khoản thưởng phạt sẽ tự động cập nhật vào bảng lương theo thời gian thực, đảm bảo sự chính xác tuyệt đối." },
              { icon: FileText, title: "Báo giá thông minh & Sát thực", desc: "Dựa trên những công thức được đúc kết từ kinh nghiệm thực tiễn, giúp bạn lập báo giá chuẩn xác, hạn chế rủi ro thất thoát." },
              { icon: Boxes, title: "Bóc tách vật tư 3D", desc: "Tự động bóc tách định mức vật tư chính xác từ bản vẽ 2D được diễn họa 3D, loại bỏ sai sót thủ công." },
              { icon: Gift, title: "Cơ chế Khoán đơn hàng", desc: "Tự động thưởng thêm cho nhân viên khi hoàn thành công việc sớm hơn dự kiến, tạo động lực mạnh mẽ để nâng cao hiệu suất làm việc." },
              { icon: FileCheck, title: "Quản lý giấy tờ thuế quan", desc: "Hỗ trợ lưu trữ đầy đủ các giấy tờ pháp lý như hợp đồng, hóa đơn điện tử, giúp việc báo cáo thuế trở nên dễ dàng và chuẩn xác." },
              { icon: MessageSquare, title: "Chat nhóm chuyên nghiệp", desc: "Nền tảng giao tiếp nội bộ giúp toàn đội ngũ cùng phối hợp chăm sóc khách hàng và phân chia nhiệm vụ theo từng chuyên môn một cách gọn gàng." },
              { icon: Star, title: "Minh bạch từ Chấm sao khách hàng", desc: "Hệ thống độc quyền cho phép khách hàng trực tiếp đánh giá. Phần mềm sẽ tự động tích hợp điểm đánh giá vào lương thưởng của nhân viên, tạo động lực làm việc bứt phá." },
            ].map(({ icon: Icon, title, desc }) => (
              <Card key={title} className="border-0 bg-white shadow gap-0">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-brand-500 text-white">
                      <Icon className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-base">{title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 text-sm text-neutral-600">{desc}</CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Button variant="default" className="bg-brand-500 text-white hover:bg-brand-400" onClick={handleClick}>
              Tôi muốn được tư vấn
            </Button>
          </div>
        </div>
      </section>

      {/* Phân hệ mở rộng
      <section className="bg-white py-14">
        <div className="container mx-auto grid items-center gap-8 px-4 md:grid-cols-[1.1fr_1fr]">
          <div>
            <div className="inline-block rounded bg-neutral-100 px-3 py-1 text-xs font-medium">Phân hệ mở rộng</div>
            <h3 className="mt-3 text-2xl font-bold">Tài chính & Kế toán quản trị</h3>
            <p className="mt-2 text-neutral-600">
              Hệ thống sổ sách, bút toán, báo cáo linh hoạt: phân tích theo trung tâm chi phí, mã sản phẩm, khách hàng,
              dự án.
            </p>
            <ul className="mt-4 grid gap-2 text-sm text-neutral-700">
              {[
                "Chuẩn hoá COA, chuẩn IFRS/VAS",
                "Tự động phân bổ chi phí đa tiêu thức",
                "Đối soát công nợ, dòng tiền dự báo",
                "Báo cáo quản trị đa chiều theo vai trò",
              ].map((t) => (
                <li key={t} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-brand-500" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
            <div className="mt-5 flex gap-3">
              <Button className="bg-brand-500 text-white hover:bg-brand-400">Tải brochure</Button>
              <Button variant="outline" asChild>
                <Link href="#giao-dien" className="text-white hover:text-brand-400">Xem giao diện mẫu</Link>
              </Button>
            </div>
          </div>
          <div className="relative mx-auto aspect-video w-full max-w-[560px] overflow-hidden rounded-lg border">
            <Image src="/erp-analytics-dashboard.png" alt="Biểu đồ báo cáo quản trị" fill className="object-cover" />
          </div>
        </div>
      </section> */}

      {/* Giao diện mẫu */}
      <section id="bang-gia" className="bg-brand-300 py-14 text-white">
        <div className="container mx-auto px-4">
          <h2 className="text-center text-2xl font-bold md:text-3xl">Giao diện mẫu của ADMAKE</h2>
          <div className="mx-auto mt-8 aspect-[16/7] w-full max-w-5xl overflow-hidden rounded-xl border-4 border-black/10 bg-white shadow">
            <Image
              src="/image.png"
              alt="Ảnh chụp giao diện phần mềm"
              width={1040}
              height={420}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="mt-6 flex justify-center gap-3">
            <Button variant="default" className="bg-brand-500 text-white hover:bg-brand-400" onClick={handleClick}>
              Tôi muốn được tư vấn
            </Button>
              </div>
        </div>
      </section>

      {/* Lý do chọn */}
      <section id="ly-do" className="bg-white py-14">
        <div className="container mx-auto px-4">
          <h2 className="text-center text-2xl font-bold md:text-3xl">Tại sao nên lựa chọn giải pháp ADMAKE?</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3 font-bold">
            {[
              {
                title: "Quản lý minh bạch toàn diện, từ A đến Z",
                items: [
                  "Hệ sinh thái tích hợp giải quyết triệt để các vấn đề cốt lõi",
                  "Chấm công linh hoạt qua GPS cho nhân viên đi công trình",
                  "Tự động cập nhật vào bảng lương và tích hợp đánh giá khách hàng",
                  "Tạo sự tin tưởng và động lực làm việc mạnh mẽ"
                ],
              },
              {
                title: "Tối ưu chi phí và hạn chế rủi ro thất thoát",
                items: [
                  "Báo giá thông minh dựa trên các công thức thực tế",
                  "Bóc tách vật tư 3D giúp tính toán chính xác nguyên vật liệu",
                  "Loại bỏ sai sót thủ công, nâng cao tính chuyên nghiệp",
                  "Tiết kiệm chi phí và phát triển bền vững"
                ],
              },
              {
                title: "Nâng cao hiệu suất và phát triển đội ngũ",
                items: [
                  "Chuyển đổi từ làm việc thủ công sang quy trình hiện đại",
                  "Phân công và theo dõi tiến độ gọn gàng trên một nền tảng",
                  "Cơ chế tự động thưởng thêm khi hoàn thành công việc sớm",
                  "Nền tảng chat nhóm chuyên nghiệp giúp phối hợp ăn ý"
                ],
              },
            ].map((col) => (
              <Card key={col.title} className="border-0 bg-neutral-50">
                <CardHeader>
                  <CardTitle className="text-lg">{col.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-neutral-700">
                  <ul className="space-y-2">
                    {col.items.map((i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 text-brand-500" />
                        <span>{i}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Hiệu quả sử dụng */}
      <section id="hieu-qua" className="bg-brand-400 py-14 text-white">
        <div className="container mx-auto px-4">
          <h2 className="text-center text-2xl font-bold md:text-3xl">Hiệu quả sau triển khai</h2>
          <div className="mx-auto mt-8 grid max-w-5xl grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {[
              { value: "75%", label: "Giảm thời gian lập báo cáo" },
              { value: "29%", label: "Tối ưu tồn kho bình quân" },
              { value: "16%", label: "Giảm chi phí vận hành" },
              { value: "14%", label: "Tăng năng suất lao động" },
              { value: "x2.9", label: "Tốc độ truy xuất số liệu" },
              { value: "22%", label: "Tăng tỷ lệ hoàn thành đúng hạn" },
            ].map((kpi) => (
              <div key={kpi.value} className="flex items-center justify-center">
                <div
                  className="flex h-28 w-28 flex-col items-center justify-center bg-white text-center text-neutral-900 shadow"
                  style={{
                    clipPath: "polygon(25% 6.7%, 75% 6.7%, 100% 50%, 75% 93.3%, 25% 93.3%, 0% 50%)",
                  }}
                  aria-label={`Chỉ số ${kpi.value}`}
                >
                  <div className="text-xl font-extrabold">{kpi.value}</div>
                  <div className="px-2 text-[10px] text-neutral-600">{kpi.label}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 flex justify-center gap-3">
            <Button variant="default" className="bg-brand-500 text-white hover:bg-brand-400" onClick={handleClick}>
              Tôi muốn được tư vấn
            </Button>
              </div>
        </div>
      </section>

      {/* Case studies
      <section id="case-study" className="bg-white py-14">
        <div className="container mx-auto px-4">
          <h2 className="text-center text-2xl font-bold md:text-3xl">CÂU CHUYỆN KHÁCH HÀNG</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="overflow-hidden border-0 bg-neutral-50">
                <div className="relative h-40 w-full">
                  <Image
                    src={`/manufacturing-case-study.png?height=160&width=300&query=manufacturing%20case%20study%20${i + 1}`}
                    alt={`Case study ${i + 1}`}
                    fill
                    className="object-cover"
                  />
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Doanh nghiệp #{i + 1}</CardTitle>
                  <CardDescription>Triển khai ADMAKE Company Management</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button size="sm" variant="outline" className="w-full bg-transparent">
                    Xem chi tiết
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Button className="bg-brand-500 text-white hover:bg-brand-400" onClick={handleClick}>Đặt lịch tư vấn</Button>
          </div>
        </div>
      </section> */}

      {/* Footer */}
      <footer id="lien-he" className="relative bg-neutral-900 py-14 text-neutral-200">
        <div className="absolute inset-0 -z-10 opacity-20">
          <Image src="/industrial-city-night.png" alt="" fill className="object-cover" />
        </div>

        <div className="container mx-auto grid gap-10 px-4 md:grid-cols-[1.1fr_1fr]">
          <div>
            <h3 className="text-2xl font-bold text-white">Liên hệ ADMAKE Việt Nam</h3>
            <p className="mt-2 max-w-xl text-neutral-300">
              Tư vấn giải pháp phù hợp với mô hình của bạn. Đội ngũ chuyên gia triển khai nhiều dự án sản xuất đa ngành.
            </p>
            <dl className="mt-6 space-y-2 text-sm">
              <div className="grid grid-cols-[80px_1fr] gap-2">
                <dt className="text-neutral-400">Hotline</dt>
                <dd>
                  <a href="tel:19000047" className="hover:underline">
                  19000047
                  </a>
                </dd>
              </div>
              <div className="grid grid-cols-[80px_1fr] gap-2">
                <dt className="text-neutral-400">Tư Vấn</dt>
                <dd>
                  <a href="tel:0837884477" className="hover:underline">
                  0837 884477
                  </a>
                </dd>
              </div>
              <div className="grid grid-cols-[80px_1fr] gap-2">
                <dt className="text-neutral-400">Kỹ thuật</dt>
                <dd>
                  <a href="tel:0852884477" className="hover:underline">
                  0852 884477
                  </a>
                </dd>
              </div>
              <div className="grid grid-cols-[80px_1fr] gap-2">
                <dt className="text-neutral-400">Kinh Doanh</dt>
                <dd>
                  <a href="tel:0877884477" className="hover:underline">
                  0877 884477
                  </a>
                </dd>
              </div>
              <div className="grid grid-cols-[80px_1fr] gap-2">
                <dt className="text-neutral-400">Email</dt>
                <dd>
                  <a href="mailto:admakeapp@gmail.com" className="hover:underline">
                  admakeapp@gmail.com
                  </a>
                </dd>
              </div>
              <div className="grid grid-cols-[80px_1fr] gap-2">
                <dt className="text-neutral-400">Địa chỉ</dt>
                <dd>45 Đặng Thái Thân – Phường Buôn Ma Thuột – Tỉnh Đắk Lắk
                </dd>
              </div>
            </dl>
            <div className="mt-6 flex gap-3">
              <Button asChild className="bg-brand-500 text-white hover:bg-brand-400" onClick={handleClick}>
                <Link href="#dang-ky">
                  <PhoneCall className="mr-2 h-4 w-4" /> Nhận tư vấn
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="#giao-dien" className="text-black hover:text-brand-400">Xem giao diện</Link>
              </Button>
            </div>
          </div>
        </div>
        <div className="container mx-auto mt-10 px-4 text-center text-xs text-neutral-400">
          © {new Date().getFullYear()} ADMAKE Việt Nam. A Product of B-One Viet Nam
        </div>
      </footer>
    </main>
  )
}
