import React from "react";

export interface IPage {
  Component: React.ComponentType<any>;
  loader?<T>(): Promise<T>;
}

export type BaseEntity = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
};

export type PaginationDto = {
  page: number;
  limit: number;
  search: string;
};
