import { downloadFromBlob } from "../utils/download.util";
import axiosClient from "./axiosClient";

export interface QuoteDto {
  staff_ids: string[];
  coefficient: number;
  materials: {
    id: string;
    quantity: number;
  }[];
  totalDay: number;
}

export const QuoteService = {
  quotes: async (dto: QuoteDto) => {
    const res = await axiosClient.post("/app/quote", dto, {
      responseType: "blob",
    });
    const contentType = res.headers?.["content-type"] || "";
    if (contentType.includes("application/json")) {
      const text = await res.data.text?.();
      throw new Error(text || "Quote error");
    }

    downloadFromBlob(res);
    return true;
  },
};
