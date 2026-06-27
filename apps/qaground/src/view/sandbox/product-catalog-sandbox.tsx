'use client';

import { useState } from 'react';

/**
 * 상품 필터·정렬 샌드박스 (테스트 대상).
 *
 * 카테고리 필터 + 가격 정렬 + 검색으로 상품 목록을 좁힌다. 필터·검색은 교집합으로
 * 적용되고, 결과 개수와 빈 상태가 함께 갱신된다.
 */

type Category = 'electronics' | 'clothing' | 'books';
type CategoryFilter = 'all' | Category;
type Sort = 'asc' | 'desc';

interface Product {
  id: string;
  name: string;
  price: number;
  category: Category;
}

const PRODUCTS: Product[] = [
  { id: 'mouse', name: '무선 마우스', price: 20000, category: 'electronics' },
  { id: 'monitor', name: '4K 모니터', price: 320000, category: 'electronics' },
  { id: 'tshirt', name: '면 티셔츠', price: 15000, category: 'clothing' },
  { id: 'jacket', name: '겨울 자켓', price: 95000, category: 'clothing' },
  { id: 'novel', name: '추리 소설', price: 13000, category: 'books' },
  { id: 'guide', name: 'QA 입문서', price: 28000, category: 'books' },
];

const CATEGORY_FILTERS: { key: CategoryFilter; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'electronics', label: '전자' },
  { key: 'clothing', label: '의류' },
  { key: 'books', label: '도서' },
];

const filterBtn = (active: boolean) =>
  `rounded-button h-button-md border px-3 text-sm transition-colors ${
    active ? 'border-primary text-primary' : 'border-line-3 text-text-2 hover:text-text-1'
  }`;

export const ProductCatalogSandbox = () => {
  const [category, setCategory] = useState<CategoryFilter>('all');
  const [sort, setSort] = useState<Sort>('asc');
  const [query, setQuery] = useState('');

  const results = PRODUCTS.filter((p) => category === 'all' || p.category === category)
    .filter((p) => p.name.toLowerCase().includes(query.trim().toLowerCase()))
    .sort((a, b) => (sort === 'asc' ? a.price - b.price : b.price - a.price));

  return (
    <main className="bg-bg-1 text-text-1 flex min-h-screen w-full justify-center px-4 py-10 font-sans">
      <div className="border-line-2 bg-bg-2 w-full max-w-lg rounded-2xl border p-8">
        <h1 className="mb-4 text-xl font-bold">상품 목록</h1>

        <div className="mb-3 flex flex-wrap gap-2">
          {CATEGORY_FILTERS.map((c) => (
            <button
              key={c.key}
              data-testid={`filter-${c.key === 'all' ? 'all' : c.key}`}
              type="button"
              onClick={() => setCategory(c.key)}
              className={filterBtn(category === c.key)}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="mb-3 flex flex-wrap items-center gap-2">
          <input
            data-testid="search-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="상품 검색"
            className="border-line-3 bg-bg-3 rounded-button text-text-1 focus:border-primary h-button-md flex-1 border px-3 text-sm outline-none"
          />
          <button
            data-testid="sort-asc"
            type="button"
            onClick={() => setSort('asc')}
            className={filterBtn(sort === 'asc')}
          >
            가격 낮은순
          </button>
          <button
            data-testid="sort-desc"
            type="button"
            onClick={() => setSort('desc')}
            className={filterBtn(sort === 'desc')}
          >
            가격 높은순
          </button>
        </div>

        <p data-testid="result-count" className="text-text-3 mb-3 text-xs">
          결과 {results.length}개
        </p>

        {results.length === 0 ? (
          <p data-testid="empty-state" className="text-text-3 py-8 text-center text-sm">
            조건에 맞는 상품이 없습니다.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {results.map((p) => (
              <li
                key={p.id}
                data-testid="product-item"
                className="border-line-3 flex justify-between rounded-xl border px-4 py-3 text-sm"
              >
                <span>{p.name}</span>
                <span className="text-text-3">{p.price.toLocaleString()}원</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
};
