import React, { useState } from "react";
import { 
  FileTextOutlined, 
  FileDoneOutlined, 
  FileProtectOutlined, 
  CheckCircleOutlined,
  ClockCircleOutlined,
  SearchOutlined
} from "@ant-design/icons";

const recordTabs = [
  { key: "hop-dong", label: "Hợp đồng & Báo giá", icon: <FileProtectOutlined /> },
  { key: "nghiem-thu", label: "Nghiệm thu & Bàn giao", icon: <FileDoneOutlined /> },
  { key: "thanh-toan", label: "Thanh toán & Thanh lý", icon: <FileTextOutlined /> },
];

const mockRecords: Record<string, any[]> = {
  "hop-dong": [
    { name: "HỢP ĐỒNG", type: "docx", file: "HỢP ĐỒNG.docx", folder: "HỒ SƠ ĐƯA AMAKE" },
    { name: "BÁO GIÁ", type: "xlsx", file: "BÁO GIÁ.xlsx", folder: "HỒ SƠ ĐƯA AMAKE" },
  ],
  "nghiem-thu": [
    { name: "4.BBNT- đợt 1", type: "doc", file: "4.BBNT- đợt 1.doc", folder: "HỒ SƠ DRAY BHĂNG" },
    { name: "4.BBNT - đợt 2", type: "doc", file: "4.BBNT - đợt 2.doc", folder: "HỒ SƠ DRAY BHĂNG" },
    { name: "4.BBNT - đợt 3", type: "doc", file: "4.BBNT - đợt 3.doc", folder: "HỒ SƠ DRAY BHĂNG" },
    { name: "4.BBNT - đợt 4", type: "doc", file: "4.BBNT - đợt 4.doc", folder: "HỒ SƠ DRAY BHĂNG" },
    { name: "BBNT ĐƯA VÀO SỬ DỤNG", type: "doc", file: "BBNT ĐƯA VÀO SỬ DỤNG.doc", folder: "HỒ SƠ DRAY BHĂNG" },
    { name: "BIÊN BẢN BÀN GIAO", type: "doc", file: "BIÊN BẢN BÀN GIAO.doc", folder: "HỒ SƠ ĐƯA AMAKE" },
    { name: "NGHIỆM THU VÀ THANH LÝ", type: "doc", file: "NGHIỆM THU VÀ THANH LÝ.doc", folder: "HỒ SƠ ĐƯA AMAKE" },
  ],
  "thanh-toan": [
    { name: "TẠM ỨNG", type: "doc", file: "TẠM ỨNG.doc", folder: "HỒ SƠ ĐƯA AMAKE" },
    { name: "5. BB THANH LÝ", type: "doc", file: "5. BB THANH LÝ.doc", folder: "HỒ SƠ DRAY BHĂNG" },
    { name: "PHU LUC 08", type: "doc", file: "PHU LUC 08.doc", folder: "HỒ SƠ DRAY BHĂNG" },
  ],
};

export default function RecordsTab() {
  const [activeSubTab, setActiveSubTab] = useState(recordTabs[0].key);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredRecords = mockRecords[activeSubTab].filter(record => 
    record.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getDownloadUrl = (fileName: string) => {
    // encodeURIComponent để xử lý khoảng trắng và ký tự tiếng Việt
    return `https://admake.vn/static/records/${encodeURIComponent(fileName)}`;
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="text-sm text-slate-500">
        Quản lý và phân loại các hồ sơ kế toán, bao gồm hợp đồng, báo giá, biên bản nghiệm thu và thanh lý.
      </div>

      {/* Sub-tabs selection */}
      <div className="flex flex-wrap gap-2 border-b border-slate-100 pb-4">
        {recordTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveSubTab(tab.key)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              activeSubTab === tab.key
                ? "bg-teal-50 text-teal-600 shadow-sm"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search and Filter */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <SearchOutlined className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm kiếm hồ sơ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-slate-200 py-2 pl-10 pr-4 text-sm focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-100"
          />
        </div>
      </div>

      {/* Records List Table */}
      <div className="overflow-hidden rounded-xl border border-slate-100 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600 uppercase text-xs font-semibold">
            <tr>
              <th className="px-6 py-4">Tên hồ sơ</th>
              <th className="px-6 py-4">Loại</th>
              <th className="px-6 py-4">Thư mục nguồn</th>
              <th className="px-6 py-4">Trạng thái</th>
              <th className="px-6 py-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredRecords.length > 0 ? (
              filteredRecords.map((record, index) => (
                <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-700">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded bg-teal-50 flex items-center justify-center text-teal-600">
                        {activeSubTab === "hop-dong" ? <FileProtectOutlined /> : 
                         activeSubTab === "nghiem-thu" ? <FileDoneOutlined /> : <FileTextOutlined />}
                      </div>
                      {record.name}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 uppercase">
                      {record.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                    {record.folder}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-teal-600">
                      <CheckCircleOutlined className="text-xs" />
                      <span className="text-xs font-medium">Sẵn sàng</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <a 
                      href={getDownloadUrl(record.file)} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-teal-600 hover:text-teal-700 font-medium"
                    >
                      Tải về
                    </a>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-slate-400">
                  Không tìm thấy hồ sơ nào
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
