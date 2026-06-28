'use client';

import { useMemo, useState } from 'react';

/**
 * 실제 쇼핑몰형 e-commerce 샌드박스 (테스트 대상).
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
  price: number;
  category: '의류' | '전자' | '리빙';
  emoji: string;
  rating: number;
  stock: number;
  sizes?: string[];
}

const PRODUCTS: Product[] = [
  {
    id: 1,
    name: '베이직 티셔츠',
    price: 19000,
    category: '의류',
    emoji: '👕',
    rating: 4.5,
    stock: 12,
    sizes: ['S', 'M', 'L'],
  },
  {
    id: 2,
    name: '데님 자켓',
    price: 59000,
    category: '의류',
    emoji: '🧥',
    rating: 4.7,
    stock: 5,
    sizes: ['M', 'L', 'XL'],
  },
  {
    id: 3,
    name: '러닝 스니커즈',
    price: 78000,
    category: '의류',
    emoji: '👟',
    rating: 4.3,
    stock: 0,
    sizes: ['250', '260', '270'],
  },
  {
    id: 4,
    name: '무선 이어버드',
    price: 89000,
    category: '전자',
    emoji: '🎧',
    rating: 4.6,
    stock: 8,
  },
  {
    id: 5,
    name: '기계식 키보드',
    price: 120000,
    category: '전자',
    emoji: '⌨️',
    rating: 4.8,
    stock: 3,
  },
  {
    id: 6,
    name: '스마트 워치',
    price: 210000,
    category: '전자',
    emoji: '⌚',
    rating: 4.4,
    stock: 0,
  },
  {
    id: 7,
    name: '아로마 캔들',
    price: 15000,
    category: '리빙',
    emoji: '🕯️',
    rating: 4.2,
    stock: 30,
  },
  {
    id: 8,
    name: '머그컵 세트',
    price: 24000,
    category: '리빙',
    emoji: '☕',
    rating: 4.1,
    stock: 18,
  },
  { id: 9, name: '무릎 담요', price: 32000, category: '리빙', emoji: '🧣', rating: 4.9, stock: 7 },
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

  const list = useMemo(() => {
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
    'border-line-3 bg-bg-3 rounded-button text-text-1 placeholder:text-text-3 focus:border-primary h-button-md w-full border px-3 text-sm outline-none';

  return (
    <main className="bg-bg-1 text-text-1 min-h-screen w-full font-sans">
      {/* 헤더 */}
      <header className="border-line-2 bg-bg-1/90 sticky top-0 z-10 border-b backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-4xl items-center justify-between px-4">
          <button
            data-testid="shop-home"
            type="button"
            onClick={() => setView('catalog')}
            className="text-lg font-bold"
          >
            qa<span className="text-primary">shop</span>
          </button>
          <button
            data-testid="cart-button"
            type="button"
            onClick={() => setView('cart')}
            className="border-line-3 rounded-button relative h-9 border px-3 text-sm"
          >
            장바구니
            {cartCount > 0 && (
              <span
                data-testid="cart-count"
                className="bg-primary absolute -top-2 -right-2 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs font-bold text-white"
              >
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </header>

      <div className="mx-auto w-full max-w-4xl px-4 py-6">
        {/* 상품목록 */}
        {view === 'catalog' && (
          <section>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <input
                data-testid="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="상품 검색"
                className={`min-w-0 flex-1 ${field}`}
              />
              <select
                data-testid="sort-select"
                value={sort}
                onChange={(e) => setSort(e.target.value as typeof sort)}
                className={`w-32 ${field}`}
              >
                <option value="default">기본순</option>
                <option value="price-asc">가격 낮은순</option>
                <option value="price-desc">가격 높은순</option>
              </select>
            </div>
            <div className="mb-4 flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  data-testid={`cat-${c}`}
                  type="button"
                  onClick={() => setCat(c)}
                  className={`rounded-button h-9 border px-3 text-sm transition-colors ${
                    cat === c
                      ? 'border-primary text-primary'
                      : 'border-line-3 text-text-2 hover:text-text-1'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
            <p data-testid="result-count" className="text-text-3 mb-3 text-xs">
              상품 {list.length}개
            </p>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {list.map((p) => (
                <li
                  key={p.id}
                  data-testid="product-card"
                  className="border-line-2 bg-bg-2 flex flex-col rounded-2xl border p-3"
                >
                  <button
                    type="button"
                    data-testid="view-detail"
                    onClick={() => openDetail(p)}
                    className="bg-bg-3 mb-2 flex h-24 items-center justify-center rounded-xl text-4xl"
                  >
                    {p.emoji}
                  </button>
                  <span className="text-text-3 text-[11px]">{p.category}</span>
                  <span data-testid="product-name" className="truncate text-sm font-medium">
                    {p.name}
                  </span>
                  <span className="text-text-3 text-xs">★ {p.rating}</span>
                  <span data-testid="product-price" className="mt-1 text-sm font-semibold">
                    {won(p.price)}
                  </span>
                  {p.stock <= 0 ? (
                    <span
                      data-testid="stock-badge"
                      className="text-system-red rounded-button border-line-3 mt-2 h-9 border border-dashed text-center text-xs leading-9"
                    >
                      품절
                    </span>
                  ) : (
                    <button
                      data-testid="add-to-cart"
                      type="button"
                      onClick={() => (p.sizes ? openDetail(p) : addToCart(p, '-', 1))}
                      className="bg-primary rounded-button mt-2 h-9 text-xs font-medium text-white"
                    >
                      담기
                    </button>
                  )}
                </li>
              ))}
              {list.length === 0 && (
                <li
                  data-testid="empty-state"
                  className="text-text-3 col-span-full py-10 text-center text-sm"
                >
                  검색 결과가 없습니다.
                </li>
              )}
            </ul>
          </section>
        )}

        {/* 상세 */}
        {view === 'detail' && selected && (
          <section className="border-line-2 bg-bg-2 rounded-2xl border p-6">
            <button
              type="button"
              onClick={() => setView('catalog')}
              className="text-text-3 hover:text-text-1 mb-4 text-sm"
            >
              ← 목록
            </button>
            <div className="flex flex-col gap-5 sm:flex-row">
              <div className="bg-bg-3 flex h-40 w-full items-center justify-center rounded-2xl text-6xl sm:w-48">
                {selected.emoji}
              </div>
              <div className="flex-1">
                <span className="text-text-3 text-xs">{selected.category}</span>
                <h1 className="text-xl font-bold">{selected.name}</h1>
                <p className="text-text-3 text-sm">★ {selected.rating}</p>
                <p data-testid="detail-price" className="mt-2 text-lg font-bold">
                  {won(selected.price)}
                </p>

                {selected.sizes && (
                  <div className="mt-4">
                    <p className="text-text-3 mb-1.5 text-xs">사이즈</p>
                    <div className="flex flex-wrap gap-2">
                      {selected.sizes.map((s) => (
                        <button
                          key={s}
                          data-testid={`size-${s}`}
                          type="button"
                          onClick={() => setSize(s)}
                          className={`rounded-button h-9 border px-3 text-sm ${
                            size === s ? 'border-primary text-primary' : 'border-line-3 text-text-2'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-4 flex items-center gap-2">
                  <span className="text-text-3 text-xs">수량</span>
                  <button
                    data-testid="qty-minus"
                    type="button"
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="border-line-3 h-8 w-8 rounded-lg border text-sm"
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
                    className="border-line-3 h-8 w-8 rounded-lg border text-sm"
                  >
                    +
                  </button>
                </div>

                {selected.sizes && !size && (
                  <p data-testid="option-error" className="text-system-red mt-3 text-xs">
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
                  className="bg-primary rounded-button h-button-md mt-4 w-full text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  장바구니 담기
                </button>
              </div>
            </div>
          </section>
        )}

        {/* 장바구니 */}
        {view === 'cart' && (
          <section className="border-line-2 bg-bg-2 rounded-2xl border p-6">
            <h1 className="mb-4 text-xl font-bold">장바구니</h1>
            {cart.length === 0 ? (
              <p data-testid="empty-cart" className="text-text-3 py-10 text-center text-sm">
                장바구니가 비어 있습니다.
              </p>
            ) : (
              <>
                <ul className="border-line-2 divide-line-2 mb-4 divide-y rounded-xl border">
                  {cart.map((l) => (
                    <li
                      key={l.key}
                      data-testid="cart-item"
                      className="flex items-center justify-between gap-3 px-4 py-3"
                    >
                      <span className="min-w-0">
                        <span className="text-sm font-medium">{l.name}</span>
                        {l.option !== '-' && (
                          <span className="text-text-3 ml-2 text-xs">{l.option}</span>
                        )}
                        <span className="text-text-3 block text-xs">{won(l.price)}</span>
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
                          className="border-line-3 h-7 w-7 rounded-lg border text-sm"
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
                          className="border-line-3 h-7 w-7 rounded-lg border text-sm"
                        >
                          +
                        </button>
                        <button
                          data-testid="line-remove"
                          type="button"
                          onClick={() => setCart((c) => c.filter((x) => x.key !== l.key))}
                          className="text-text-3 hover:text-system-red ml-1 text-xs"
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
                    className="border-line-3 rounded-button h-button-md shrink-0 border px-4 text-sm"
                  >
                    적용
                  </button>
                </div>
                {couponMsg && (
                  <p
                    data-testid="coupon-msg"
                    className={`mb-3 text-xs ${rate > 0 ? 'text-primary' : 'text-system-red'}`}
                  >
                    {couponMsg}
                  </p>
                )}

                <div className="border-line-2 flex flex-col gap-1 border-t pt-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-text-3">상품 합계</span>
                    <span data-testid="subtotal">{won(subtotal)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="text-primary flex justify-between">
                      <span>할인</span>
                      <span data-testid="discount">-{won(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-text-3">배송비</span>
                    <span data-testid="shipping-fee">
                      {shipping === 0 ? '무료' : won(shipping)}
                    </span>
                  </div>
                  <div className="mt-1 flex justify-between text-base font-bold">
                    <span>결제 예정</span>
                    <span data-testid="cart-total">{won(total)}</span>
                  </div>
                </div>

                <button
                  data-testid="checkout-button"
                  type="button"
                  onClick={() => {
                    setErrors({});
                    setView('checkout');
                  }}
                  className="bg-primary rounded-button h-button-md mt-5 w-full text-sm font-medium text-white"
                >
                  주문하기
                </button>
              </>
            )}
          </section>
        )}

        {/* 결제 */}
        {view === 'checkout' && (
          <section className="border-line-2 bg-bg-2 rounded-2xl border p-6">
            <h1 className="mb-4 text-xl font-bold">결제</h1>
            <div className="flex flex-col gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-text-2 text-sm">받는 사람</span>
                <input
                  data-testid="ship-name"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className={field}
                />
                {errors.name && (
                  <span data-testid="error-name" className="text-system-red text-xs">
                    {errors.name}
                  </span>
                )}
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-text-2 text-sm">주소</span>
                <input
                  data-testid="ship-address"
                  value={form.address}
                  onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                  className={field}
                />
                {errors.address && (
                  <span data-testid="error-address" className="text-system-red text-xs">
                    {errors.address}
                  </span>
                )}
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-text-2 text-sm">전화번호</span>
                <input
                  data-testid="ship-phone"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="010-0000-0000"
                  className={field}
                />
                {errors.phone && (
                  <span data-testid="error-phone" className="text-system-red text-xs">
                    {errors.phone}
                  </span>
                )}
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-text-2 text-sm">결제 수단</span>
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

            <div className="border-line-2 mt-4 flex justify-between border-t pt-3 text-base font-bold">
              <span>결제 금액</span>
              <span data-testid="pay-total">{won(total)}</span>
            </div>

            <button
              data-testid="place-order"
              type="button"
              onClick={placeOrder}
              className="bg-primary rounded-button h-button-md mt-5 w-full text-sm font-medium text-white"
            >
              {won(total)} 결제하기
            </button>
          </section>
        )}

        {/* 주문 완료 */}
        {view === 'complete' && (
          <section
            data-testid="order-complete"
            className="border-line-2 bg-bg-2 flex flex-col items-center gap-3 rounded-2xl border p-10 text-center"
          >
            <span className="text-5xl">🎉</span>
            <h1 className="text-xl font-bold">주문이 완료되었습니다</h1>
            <p className="text-text-2 text-sm">
              주문번호{' '}
              <span data-testid="order-number" className="text-primary font-mono">
                {orderNo}
              </span>
            </p>
            <p data-testid="paid-amount" className="text-text-3 text-sm">
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
              className="border-line-3 rounded-button h-button-md mt-2 border px-5 text-sm"
            >
              쇼핑 계속하기
            </button>
          </section>
        )}
      </div>
    </main>
  );
};
