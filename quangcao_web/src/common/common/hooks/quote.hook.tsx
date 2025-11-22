import { useMutation } from "@tanstack/react-query";
import { QuoteService, type QuoteDto } from "../../services/quote.service";

export const useQuote = () => {
  return useMutation({
    mutationFn: (dto: QuoteDto) => QuoteService.quotes(dto),
  });
};
