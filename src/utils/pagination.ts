import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '../config/constants';

export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

export const getPagination = (pageRaw: unknown, limitRaw: unknown): PaginationParams => {
  let page = Math.max(1, parseInt(String(pageRaw), 10) || 1);
  let limit = Math.min(parseInt(String(limitRaw), 10) || DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
  if (Number.isNaN(page)) page = 1;
  if (Number.isNaN(limit)) limit = DEFAULT_PAGE_SIZE;
  return { page, limit, offset: (page - 1) * limit };
};

export const buildPageMeta = (total: number, page: number, limit: number) => ({
  page,
  limit,
  total,
  totalPages: Math.max(1, Math.ceil(total / limit)),
  hasNextPage: page * limit < total,
  hasPrevPage: page > 1
});