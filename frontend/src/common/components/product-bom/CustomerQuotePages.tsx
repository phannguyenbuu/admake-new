import type { Ref } from "react";
import { CompanyBrand } from "./CompanyDetails";
import { money, type Draft, type Product, type Result } from "./types";

const formatNumber = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 4 });
const preTax = (result: Result) => result.price_before_tax ?? result.total - result.tax;
const size = ({ L, H, W, F }: Draft["dimensions"]) =>
  `${formatNumber.format(L * 10)} × ${formatNumber.format(H * 10)} × ${formatNumber.format(W * 10)} mm (ngang × cao × sâu), ${F} mặt`;

export function CustomerQuotePages({ product, draft, result, image, imageRef, quoteRef }: {
  product: Product; draft: Draft; result: Result; image: string;
  imageRef: Ref<HTMLElement>; quoteRef: Ref<HTMLElement>;
}) {
  const { brief, dimensions, vat } = draft;
  const area = dimensions.L * dimensions.H / 10000;
  const cell = "border border-slate-300 p-2 align-top";
  const title = "my-3 text-center text-lg font-bold text-slate-900";
  const dimensionsText = size(dimensions);
  return <div aria-hidden="true" style={{ position: "fixed", left: "-12000px", top: 0, width: 714, pointerEvents: "none" }}>
    <section ref={imageRef} className="bg-white text-sm text-slate-800">
      <CompanyBrand brief={brief} />
      <h2 className={title}>PHỐI CẢNH SẢN PHẨM</h2>
      <img src={image} data-bom-product-image alt={product.name} className="h-[320px] w-full object-contain" />
      <div className="text-center font-semibold">{product.name}</div>
      <div className="mt-1 text-center">{dimensionsText}</div>
    </section>
    <section ref={quoteRef} className="bg-white text-sm text-slate-800">
      <CompanyBrand brief={brief} />
      <h2 className={title}>BẢNG BÁO GIÁ</h2>
      <div className="mb-4 space-y-1">
        <div><strong>Kính gửi:</strong> {brief?.customer_name || "Quý khách"}</div>
        {brief?.customer_phone && <div>Điện thoại: {brief.customer_phone}</div>}
        {brief?.customer_address && <div>Địa chỉ: {brief.customer_address}</div>}
        <div>Ngày lập: {new Date().toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}</div>
      </div>
      <table className="w-full border-collapse text-left text-xs">
        <thead className="bg-slate-100"><tr>{["Hạng mục và quy cách", "Kích thước", "SL", "Diện tích / SP", "Đơn giá", "Thành tiền"].map(label =>
          <th key={label} className={cell}>{label}</th>)}</tr></thead>
        <tbody><tr>
          <td className={`${cell} w-[31%] break-words`}><strong>{product.name}</strong>{brief?.materials && <div className="mt-1 whitespace-pre-wrap break-words">{brief.materials}</div>}</td>
          <td className={`${cell} w-[22%]`}>{dimensionsText}</td>
          <td className={cell}>{dimensions.count}</td>
          <td className={cell}>{formatNumber.format(area)} m²</td>
          <td className={`${cell} whitespace-nowrap text-right`}>{money(preTax(result) / dimensions.count)}</td>
          <td className={`${cell} whitespace-nowrap text-right`}>{money(preTax(result))}</td>
        </tr></tbody>
      </table>
      <dl className="ml-auto mt-4 w-[310px] space-y-2">
        <div className="flex justify-between gap-2"><dt>Tiền hàng trước thuế</dt><dd className="m-0">{money(preTax(result))}</dd></div>
        <div className="flex justify-between gap-2"><dt>Thuế VAT ({vat}%)</dt><dd className="m-0">{money(result.tax)}</dd></div>
        <div className="flex justify-between gap-2 border-t border-slate-300 pt-2 font-bold"><dt>Tổng thanh toán</dt><dd className="m-0">{money(result.total)}</dd></div>
      </dl>
      <div className="mt-8 grid grid-cols-2 text-center text-xs font-semibold">
        <div>ĐẠI DIỆN KHÁCH HÀNG</div><div>ĐẠI DIỆN CÔNG TY</div>
      </div>
    </section>
  </div>;
}

