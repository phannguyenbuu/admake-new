import type { BaseEntity } from "./common.type";

export type Material = BaseEntity & {
  id: number;
  name: string;
  quantity: number;
  unit: string;
  price: number;
  image: string;
  description: string;
  supplier: string;
};

export type MaterialFormValues = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  price: number;
  image: string;
  description: string;
  supplier: string;
};
