import { Status } from "../enum/customer.enum";

export const statusOptions = [
  { label: "Đã cọc", value: Status.BOOKED },
  { label: "Đang thi công", value: Status.IN_PROGRESS },
  { label: "Đã hoàn thành", value: Status.COMPLETED },
  { label: "Đã huỷ", value: Status.CANCELLED },
];
