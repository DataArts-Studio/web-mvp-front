'use client';

import { useMemo, useState } from 'react';

/**
 * 실제 쇼핑몰형 e-commerce 샌드박스 (테스트 대상) — 쿠팡/네이버 쇼핑 스타일 라이트 테마.
 *
 * 흐름: 상품목록 → 상세(옵션·수량) → 장바구니(수량·삭제·쿠폰·배송비) → 결제(폼 검증) → 주문완료.
 * 규칙:
 * - 재고 0 상품은 "품절"로 담기 불가.
 * - 옵션(사이즈)이 있는 상품은 옵션 선택 후에만 담을 수 있다.
 * - 배송비 3,000원, 상품합계 50,000원 이상이면 무료배송.
 * - 쿠폰: SAVE10(10%), WELCOME20(20%). 그 외 코드는 거부.
 * - 결제 폼: 받는 사람·주소 필수, 전화번호는 010-0000-0000 형식.
 */

interface Product {
  id: number;
  name: string;
  brand: string;
  price: number;
  list?: number;
  category: '의류' | '전자' | '리빙';
  emoji: string;
  rating: number;
  reviews: number;
  stock: number;
  rocket?: boolean;
  sizes?: string[];
}

const PRODUCTS: Product[] = [
  {
    id: 1,
    name: '베이직 코튼 반팔 티셔츠',
    brand: '베이직스',
    price: 19000,
    list: 29000,
    category: '의류',
    emoji: '👕',
    rating: 4.5,
    reviews: 1240,
    stock: 12,
    rocket: true,
    sizes: ['S', 'M', 'L'],
  },
  {
    id: 2,
    name: '오버핏 워싱 데님 자켓',
    brand: '데일리룩',
    price: 59000,
    list: 79000,
    category: '의류',
    emoji: '🧥',
    rating: 4.7,
    reviews: 842,
    stock: 5,
    sizes: ['M', 'L', 'XL'],
  },
  {
    id: 3,
    name: '에어쿠션 러닝 스니커즈',
    brand: '런웨이',
    price: 78000,
    list: 99000,
    category: '의류',
    emoji: '👟',
    rating: 4.3,
    reviews: 2103,
    stock: 0,
    rocket: true,
    sizes: ['250', '260', '270'],
  },
  {
    id: 4,
    name: '노이즈캔슬링 무선 이어버드',
    brand: '사운드랩',
    price: 89000,
    list: 129000,
    category: '전자',
    emoji: '🎧',
    rating: 4.6,
    reviews: 5621,
    stock: 8,
    rocket: true,
  },
  {
    id: 5,
    name: '풀배열 기계식 게이밍 키보드',
    brand: '테크모아',
    price: 120000,
    list: 150000,
    category: '전자',
    emoji: '⌨️',
    rating: 4.8,
    reviews: 933,
    stock: 3,
  },
  {
    id: 6,
    name: 'GPS 스마트 워치 5세대',
    brand: '핏기어',
    price: 210000,
    list: 259000,
    category: '전자',
    emoji: '⌚',
    rating: 4.4,
    reviews: 417,
    stock: 0,
    rocket: true,
  },
  {
    id: 7,
    name: '우드심지 아로마 캔들',
    brand: '무드홈',
    price: 15000,
    category: '리빙',
    emoji: '🕯️',
    rating: 4.2,
    reviews: 288,
    stock: 30,
  },
  {
    id: 8,
    name: '북유럽 머그컵 2P 세트',
    brand: '키친데이',
    price: 24000,
    list: 30000,
    category: '리빙',
    emoji: '☕',
    rating: 4.1,
    reviews: 651,
    stock: 18,
    rocket: true,
  },
  {
    id: 9,
    name: '극세사 무릎 담요',
    brand: '포근하우스',
    price: 32000,
    list: 45000,
    category: '리빙',
    emoji: '🧣',
    rating: 4.9,
    reviews: 1820,
    stock: 7,
    rocket: true,
  },
];

const CATEGORIES = ['전체', '의류', '전자', '리빙'] as const;
const SHIPPING = 3000;
const FREE_OVER = 50000;
const COUPONS: Record<string, number> = { SAVE10: 0.1, WELCOME20: 0.2 };

interface CartLine {
  key: string;
  id: number;
  name: string;
  price: number;
  option: string;
  qty: number;
}

type View = 'catalog' | 'detail' | 'cart' | 'checkout' | 'complete';
const won = (n: number) => `${n.toLocaleString()}원`;
const dc = (p: Product) => (p.list ? Math.round((1 - p.price / p.list) * 100) : 0);
let orderSeq = 1000;

export const ShopSandbox = () => {
  const [view, setView] = useState<View>('catalog');
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState<(typeof CATEGORIES)[number]>('전체');
  const [sort, setSort] = useState<'default' | 'price-asc' | 'price-desc'>('default');
  const [selected, setSelected] = useState<Product | null>(null);
  const [size, setSize] = useState('');
  const [qty, setQty] = useState(1);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [coupon, setCoupon] = useState('');
  const [rate, setRate] = useState(0);
  const [couponMsg, setCouponMsg] = useState('');
  const [form, setForm] = useState({ name: '', address: '', phone: '', pay: '카드' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [orderNo, setOrderNo] = useState('');

  const listProducts = useMemo(() => {
    let r = PRODUCTS.filter(
      (p) =>
        (cat === '전체' || p.category === cat) &&
        p.name.toLowerCase().includes(search.trim().toLowerCase())
    );
    if (sort === 'price-asc') r = [...r].sort((a, b) => a.price - b.price);
    if (sort === 'price-desc') r = [...r].sort((a, b) => b.price - a.price);
    return r;
  }, [search, cat, sort]);

  const cartCount = cart.reduce((n, l) => n + l.qty, 0);
  const subtotal = cart.reduce((n, l) => n + l.price * l.qty, 0);
  const discount = Math.round(subtotal * rate);
  const shipping = subtotal === 0 || subtotal - discount >= FREE_OVER ? 0 : SHIPPING;
  const total = subtotal - discount + shipping;

  const openDetail = (p: Product) => {
    setSelected(p);
    setSize(p.sizes ? '' : '-');
    setQty(1);
    setView('detail');
  };

  const addToCart = (p: Product, opt: string, q: number) => {
    if (p.stock <= 0) return;
    const key = `${p.id}-${opt}`;
    setCart((c) => {
      const found = c.find((l) => l.key === key);
      if (found) return c.map((l) => (l.key === key ? { ...l, qty: l.qty + q } : l));
      return [...c, { key, id: p.id, name: p.name, price: p.price, option: opt, qty: q }];
    });
  };

  const applyCoupon = () => {
    const code = coupon.trim().toUpperCase();
    if (COUPONS[code]) {
      setRate(COUPONS[code]);
      setCouponMsg(`쿠폰 적용됨 (${Math.round(COUPONS[code] * 100)}% 할인)`);
    } else {
      setRate(0);
      setCouponMsg('유효하지 않은 쿠폰입니다.');
    }
  };

  const placeOrder = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = '받는 사람을 입력하세요.';
    if (!form.address.trim()) e.address = '주소를 입력하세요.';
    if (!/^010-\d{4}-\d{4}$/.test(form.phone.trim()))
      e.phone = '전화번호 형식은 010-0000-0000 입니다.';
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    setOrderNo(`ORD-${(orderSeq += 1)}`);
    setView('complete');
  };

  const field =
    'rounded-lg border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-[#03c75a] h-11 w-full px-3 text-sm outline-none';
  const card = 'rounded-xl border border-gray-200 bg-white';
  const primaryBtn =
    'rounded-lg bg-[#03c75a] text-white font-bold hover:brightness-95 transition disabled:cursor-not-allowed disabled:opacity-40';

  return (
    <main className="min-h-screen w-full bg-gray-100 font-sans text-gray-900">
      {/* 상단 헤더 + 검색 */}
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center gap-4 px-4">
          <button
            data-testid="shop-home"
            type="button"
            onClick={() => setView('catalog')}
            className="shrink-0 text-2xl font-extrabold tracking-tight"
          >
            qa<span className="text-[#03c75a]">shop</span>
          </button>
          <div className="relative flex flex-1 items-center">
            <input
              data-testid="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="상품명, 브랜드 검색"
              className="h-11 w-full rounded-full border-2 border-[#03c75a] bg-white pr-12 pl-4 text-sm text-gray-900 outline-none placeholder:text-gray-400"
            />
            <span className="absolute right-3 text-lg text-[#03c75a]">🔍</span>
          </div>
          <button
            data-testid="cart-button"
            type="button"
            onClick={() => setView('cart')}
            className="relative shrink-0 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700"
          >
            🛒 장바구니
            {cartCount > 0 && (
              <span
                data-testid="cart-count"
                className="absolute -top-2 -right-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-xs font-bold text-white"
              >
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </header>

      <div className="mx-auto w-full max-w-5xl px-4 py-5">
        {/* 상품목록 */}
        {view === 'catalog' && (
          <section>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((c) => (
                  <button
                    key={c}
                    data-testid={`cat-${c}`}
                    type="button"
                    onClick={() => setCat(c)}
                    className={`h-9 rounded-full px-4 text-sm font-medium transition ${
                      cat === c
                        ? 'bg-[#03c75a] text-white'
                        : 'border border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
              <select
                data-testid="sort-select"
                value={sort}
                onChange={(e) => setSort(e.target.value as typeof sort)}
                className="h-9 rounded-lg border border-gray-300 bg-white px-2 text-sm"
              >
                <option value="default">추천순</option>
                <option value="price-asc">낮은 가격순</option>
                <option value="price-desc">높은 가격순</option>
              </select>
            </div>
            <p data-testid="result-count" className="mb-3 text-xs text-gray-500">
              총 <b className="text-gray-900">{listProducts.length}</b>개 상품
            </p>

            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {listProducts.map((p) => (
                <li
                  key={p.id}
                  data-testid="product-card"
                  className={`group flex flex-col overflow-hidden ${card} transition hover:shadow-md`}
                >
                  <button
                    type="button"
                    data-testid="view-detail"
                    onClick={() => openDetail(p)}
                    className="relative flex aspect-square items-center justify-center bg-gray-50 text-5xl"
                  >
                    {p.emoji}
                    {p.rocket && (
                      <span className="absolute top-2 left-2 rounded bg-blue-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                        로켓배송
                      </span>
                    )}
                    {p.stock <= 0 && (
                      <span className="absolute inset-0 flex items-center justify-center bg-white/70 text-sm font-bold text-gray-500">
                        품절
                      </span>
                    )}
                  </button>
                  <div className="flex flex-1 flex-col p-3">
                    <span className="text-xs text-gray-400">{p.brand}</span>
                    <span
                      data-testid="product-name"
                      className="line-clamp-2 text-sm leading-snug text-gray-800"
                    >
                      {p.name}
                    </span>
                    <div className="mt-1 flex items-baseline gap-1">
                      {dc(p) > 0 && (
                        <span className="text-sm font-extrabold text-red-600">{dc(p)}%</span>
                      )}
                      <span
                        data-testid="product-price"
                        className="text-base font-extrabold text-gray-900"
                      >
                        {won(p.price)}
                      </span>
                    </div>
                    {p.list && (
                      <span className="text-xs text-gray-400 line-through">{won(p.list)}</span>
                    )}
                    <span className="mt-0.5 text-xs text-gray-500">
                      ★ {p.rating}{' '}
                      <span className="text-gray-400">({p.reviews.toLocaleString()})</span>
                    </span>
                    <span className="mt-0.5 text-[11px] font-medium text-gray-500">무료배송</span>
                    <div className="mt-2">
                      {p.stock <= 0 ? (
                        <span
                          data-testid="stock-badge"
                          className="block h-9 rounded-lg border border-dashed border-gray-300 text-center text-xs leading-9 text-gray-400"
                        >
                          품절
                        </span>
                      ) : (
                        <button
                          data-testid="add-to-cart"
                          type="button"
                          onClick={() => (p.sizes ? openDetail(p) : addToCart(p, '-', 1))}
                          className={`h-9 w-full text-xs ${primaryBtn}`}
                        >
                          담기
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
              {listProducts.length === 0 && (
                <li
                  data-testid="empty-state"
                  className="col-span-full py-16 text-center text-sm text-gray-500"
                >
                  검색 결과가 없습니다.
                </li>
              )}
            </ul>
          </section>
        )}

        {/* 상세 */}
        {view === 'detail' && selected && (
          <section className={`${card} p-6`}>
            <button
              type="button"
              onClick={() => setView('catalog')}
              className="mb-4 text-sm text-gray-500 hover:text-gray-900"
            >
              ← 목록
            </button>
            <div className="flex flex-col gap-6 sm:flex-row">
              <div className="flex aspect-square w-full items-center justify-center rounded-xl bg-gray-50 text-7xl sm:w-64">
                {selected.emoji}
              </div>
              <div className="flex-1">
                <span className="text-sm text-gray-400">{selected.brand}</span>
                <h1 className="text-xl font-bold">{selected.name}</h1>
                <p className="mt-1 text-sm text-gray-500">
                  ★ {selected.rating} ({selected.reviews.toLocaleString()} 리뷰)
                </p>
                <div className="mt-3 flex items-baseline gap-2">
                  {dc(selected) > 0 && (
                    <span className="text-xl font-extrabold text-red-600">{dc(selected)}%</span>
                  )}
                  <span data-testid="detail-price" className="text-2xl font-extrabold">
                    {won(selected.price)}
                  </span>
                  {selected.list && (
                    <span className="text-sm text-gray-400 line-through">{won(selected.list)}</span>
                  )}
                </div>

                {selected.sizes && (
                  <div className="mt-5">
                    <p className="mb-1.5 text-xs text-gray-500">사이즈</p>
                    <div className="flex flex-wrap gap-2">
                      {selected.sizes.map((s) => (
                        <button
                          key={s}
                          data-testid={`size-${s}`}
                          type="button"
                          onClick={() => setSize(s)}
                          className={`h-10 rounded-lg border px-4 text-sm ${
                            size === s
                              ? 'border-[#03c75a] font-bold text-[#03c75a]'
                              : 'border-gray-300 text-gray-600'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-5 flex items-center gap-2">
                  <span className="text-xs text-gray-500">수량</span>
                  <button
                    data-testid="qty-minus"
                    type="button"
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="h-9 w-9 rounded-lg border border-gray-300 text-sm"
                  >
                    −
                  </button>
                  <span data-testid="qty-value" className="w-8 text-center text-sm">
                    {qty}
                  </span>
                  <button
                    data-testid="qty-plus"
                    type="button"
                    onClick={() => setQty((q) => q + 1)}
                    className="h-9 w-9 rounded-lg border border-gray-300 text-sm"
                  >
                    +
                  </button>
                </div>

                {selected.sizes && !size && (
                  <p data-testid="option-error" className="mt-3 text-xs text-red-600">
                    사이즈를 선택하세요.
                  </p>
                )}
                <button
                  data-testid="add-detail"
                  type="button"
                  disabled={!!selected.sizes && !size}
                  onClick={() => {
                    addToCart(selected, selected.sizes ? size : '-', qty);
                    setView('cart');
                  }}
                  className={`mt-5 h-12 w-full text-sm ${primaryBtn}`}
                >
                  장바구니 담기
                </button>
              </div>
            </div>
          </section>
        )}

        {/* 장바구니 */}
        {view === 'cart' && (
          <section className={`${card} p-6`}>
            <h1 className="mb-4 text-xl font-bold">장바구니</h1>
            {cart.length === 0 ? (
              <p data-testid="empty-cart" className="py-16 text-center text-sm text-gray-500">
                장바구니가 비어 있습니다.
              </p>
            ) : (
              <>
                <ul className="mb-4 divide-y divide-gray-100 rounded-xl border border-gray-200">
                  {cart.map((l) => (
                    <li
                      key={l.key}
                      data-testid="cart-item"
                      className="flex items-center justify-between gap-3 px-4 py-3"
                    >
                      <span className="min-w-0">
                        <span className="text-sm font-medium">{l.name}</span>
                        {l.option !== '-' && (
                          <span className="ml-2 text-xs text-gray-400">{l.option}</span>
                        )}
                        <span className="block text-xs text-gray-500">{won(l.price)}</span>
                      </span>
                      <span className="flex items-center gap-2">
                        <button
                          data-testid="line-minus"
                          type="button"
                          onClick={() =>
                            setCart((c) =>
                              c.map((x) =>
                                x.key === l.key ? { ...x, qty: Math.max(1, x.qty - 1) } : x
                              )
                            )
                          }
                          className="h-7 w-7 rounded-lg border border-gray-300 text-sm"
                        >
                          −
                        </button>
                        <span data-testid="line-qty" className="w-6 text-center text-sm">
                          {l.qty}
                        </span>
                        <button
                          data-testid="line-plus"
                          type="button"
                          onClick={() =>
                            setCart((c) =>
                              c.map((x) => (x.key === l.key ? { ...x, qty: x.qty + 1 } : x))
                            )
                          }
                          className="h-7 w-7 rounded-lg border border-gray-300 text-sm"
                        >
                          +
                        </button>
                        <button
                          data-testid="line-remove"
                          type="button"
                          onClick={() => setCart((c) => c.filter((x) => x.key !== l.key))}
                          className="ml-1 text-xs text-gray-400 hover:text-red-600"
                        >
                          삭제
                        </button>
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="mb-4 flex gap-2">
                  <input
                    data-testid="coupon-input"
                    value={coupon}
                    onChange={(e) => setCoupon(e.target.value)}
                    placeholder="쿠폰 코드 (SAVE10)"
                    className={`flex-1 ${field}`}
                  />
                  <button
                    data-testid="coupon-apply"
                    type="button"
                    onClick={applyCoupon}
                    className="h-11 shrink-0 rounded-lg border border-gray-300 px-4 text-sm font-medium"
                  >
                    적용
                  </button>
                </div>
                {couponMsg && (
                  <p
                    data-testid="coupon-msg"
                    className={`mb-3 text-xs ${rate > 0 ? 'text-[#03c75a]' : 'text-red-600'}`}
                  >
                    {couponMsg}
                  </p>
                )}

                <div className="flex flex-col gap-1 border-t border-gray-200 pt-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">상품 합계</span>
                    <span data-testid="subtotal">{won(subtotal)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>할인</span>
                      <span data-testid="discount">-{won(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-500">배송비</span>
                    <span data-testid="shipping-fee">
                      {shipping === 0 ? '무료' : won(shipping)}
                    </span>
                  </div>
                  <div className="mt-1 flex justify-between text-base font-bold">
                    <span>결제 예정</span>
                    <span data-testid="cart-total" className="text-red-600">
                      {won(total)}
                    </span>
                  </div>
                </div>

                <button
                  data-testid="checkout-button"
                  type="button"
                  onClick={() => {
                    setErrors({});
                    setView('checkout');
                  }}
                  className={`mt-5 h-12 w-full text-sm ${primaryBtn}`}
                >
                  주문하기
                </button>
              </>
            )}
          </section>
        )}

        {/* 결제 */}
        {view === 'checkout' && (
          <section className={`${card} p-6`}>
            <h1 className="mb-4 text-xl font-bold">결제</h1>
            <div className="flex flex-col gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-sm text-gray-600">받는 사람</span>
                <input
                  data-testid="ship-name"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className={field}
                />
                {errors.name && (
                  <span data-testid="error-name" className="text-xs text-red-600">
                    {errors.name}
                  </span>
                )}
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm text-gray-600">주소</span>
                <input
                  data-testid="ship-address"
                  value={form.address}
                  onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                  className={field}
                />
                {errors.address && (
                  <span data-testid="error-address" className="text-xs text-red-600">
                    {errors.address}
                  </span>
                )}
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm text-gray-600">전화번호</span>
                <input
                  data-testid="ship-phone"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="010-0000-0000"
                  className={field}
                />
                {errors.phone && (
                  <span data-testid="error-phone" className="text-xs text-red-600">
                    {errors.phone}
                  </span>
                )}
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm text-gray-600">결제 수단</span>
                <select
                  data-testid="pay-method"
                  value={form.pay}
                  onChange={(e) => setForm((f) => ({ ...f, pay: e.target.value }))}
                  className={field}
                >
                  <option>카드</option>
                  <option>계좌이체</option>
                  <option>휴대폰</option>
                </select>
              </label>
            </div>

            <div className="mt-4 flex justify-between border-t border-gray-200 pt-3 text-base font-bold">
              <span>결제 금액</span>
              <span data-testid="pay-total" className="text-red-600">
                {won(total)}
              </span>
            </div>

            <button
              data-testid="place-order"
              type="button"
              onClick={placeOrder}
              className={`mt-5 h-12 w-full text-sm ${primaryBtn}`}
            >
              {won(total)} 결제하기
            </button>
          </section>
        )}

        {/* 주문 완료 */}
        {view === 'complete' && (
          <section
            data-testid="order-complete"
            className={`flex flex-col items-center gap-3 ${card} p-12 text-center`}
          >
            <span className="text-5xl">🎉</span>
            <h1 className="text-xl font-bold">주문이 완료되었습니다</h1>
            <p className="text-sm text-gray-600">
              주문번호{' '}
              <span data-testid="order-number" className="font-mono font-bold text-[#03c75a]">
                {orderNo}
              </span>
            </p>
            <p data-testid="paid-amount" className="text-sm text-gray-500">
              결제 금액 {won(total)}
            </p>
            <button
              data-testid="continue-shopping"
              type="button"
              onClick={() => {
                setCart([]);
                setRate(0);
                setCoupon('');
                setCouponMsg('');
                setForm({ name: '', address: '', phone: '', pay: '카드' });
                setView('catalog');
              }}
              className="mt-2 h-11 rounded-lg border border-gray-300 px-6 text-sm"
            >
              쇼핑 계속하기
            </button>
          </section>
        )}
      </div>
    </main>
  );
};
