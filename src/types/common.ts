export interface Result<T> {
  code: number;
  message: string;
  data: T;
}

export interface PageResult<T> {
  list: T[];
  total: number;
  page: number;
  size: number;
}

export interface PageQuery {
  page?: number;
  size?: number;
}
