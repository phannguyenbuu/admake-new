import type { BaseEntity } from "./common.type";

export type Material = BaseEntity & {
  name: string;
  quantity: number;
  unit: string;
  price: number;
  image: string;
  description: string;
  supplier: string;
};

export type MaterialFormValues = {
  name: string;
  quantity: number;
  unit: string;
  price: number;
  image: string;
  description: string;
  supplier: string;
};
