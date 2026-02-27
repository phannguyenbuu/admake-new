import dayjs from "dayjs";

export const converTime = (time: string) => {
  return dayjs(time).format("DD/MM/YYYY");
};

export const converTimeToTime = (time: string) => {
  return dayjs(time).format(" HH:mm");
};
