import 'server-only';

import { getChallenge } from './registry';
import type { ChallengeSolution } from './solution-types';

const SOLUTIONS: Record<string, ChallengeSolution> = {
  'rest-api-products': {
    approach: [
      '엔드포인트별로 pm.sendRequest를 분리해 목록, 상세, 404, 로그인, 생성, 삭제 흐름을 각각 검증합니다.',
      '상태 코드는 res.code로 먼저 확인하고, JSON 응답이 있는 경우에만 res.json()으로 본문 필드를 검증합니다.',
      '무효 로그인, 토큰 없는 생성, 잘못된 생성 본문처럼 요구사항의 실패 경로를 성공 경로와 함께 검증합니다.',
      '인증이 필요한 상품 생성과 삭제 요청에는 Authorization 헤더를 포함해 실제 보호 API 흐름을 검증합니다.',
      '204 응답은 본문이 없으므로 res.json()을 호출하지 않고 상태 코드만 검증합니다.',
    ],
    code: `const baseUrl = '/api/practice';
const token = 'qaground-demo-token';

pm.sendRequest(
  { url: baseUrl + '/products?page=1&limit=5', method: 'GET' },
  (err, res) => {
    pm.test('상품 목록은 200과 페이지 메타데이터를 반환한다', () => {
      pm.expect(err).to.eql(null);
      pm.expect(res.code).to.eql(200);

      const json = res.json();
      pm.expect(json.page).to.eql(1);
      pm.expect(json.limit).to.eql(5);
      pm.expect(json.total).to.eql(12);
      pm.expect(json.totalPages).to.eql(3);
      pm.expect(json.data.length).to.eql(5);
    });
  }
);

pm.sendRequest(
  { url: baseUrl + '/products/1', method: 'GET' },
  (err, res) => {
    pm.test('상품 상세는 200과 상품 필드를 반환한다', () => {
      pm.expect(err).to.eql(null);
      pm.expect(res.code).to.eql(200);

      const json = res.json();
      pm.expect(json.id).to.eql(1);
      pm.expect(json.name).to.eql('무선 키보드');
      pm.expect(json.category).to.eql('주변기기');
      pm.expect(json.price).to.eql(39000);
      pm.expect(json.inStock).to.eql(true);
    });
  }
);

pm.sendRequest(
  { url: baseUrl + '/products/9999', method: 'GET' },
  (err, res) => {
    pm.test('존재하지 않는 상품은 404를 반환한다', () => {
      pm.expect(err).to.eql(null);
      pm.expect(res.code).to.eql(404);

      const json = res.json();
      pm.expect(json.error).to.eql('상품을 찾을 수 없습니다.');
    });
  }
);

pm.sendRequest(
  {
    url: baseUrl + '/auth/login',
    method: 'POST',
    header: { 'Content-Type': 'application/json' },
    body: {
      mode: 'raw',
      raw: JSON.stringify({
        email: 'tester@qaground.dev',
        password: 'qaground123',
      }),
    },
  },
  (err, res) => {
    pm.test('로그인은 200과 토큰을 반환한다', () => {
      pm.expect(err).to.eql(null);
      pm.expect(res.code).to.eql(200);

      const json = res.json();
      pm.expect(json.token).to.eql(token);
    });
  }
);
pm.sendRequest(
  {
    url: baseUrl + '/auth/login',
    method: 'POST',
    header: { 'Content-Type': 'application/json' },
    body: {
      mode: 'raw',
      raw: JSON.stringify({
        email: 'tester@qaground.dev',
        password: 'wrong-password',
      }),
    },
  },
  (err, res) => {
    pm.test('무효 로그인은 401을 반환한다', () => {
      pm.expect(err).to.eql(null);
      pm.expect(res.code).to.eql(401);

      const json = res.json();
      pm.expect(json.error).to.eql('자격증명이 올바르지 않습니다.');
    });
  }
);

pm.sendRequest(
  {
    url: baseUrl + '/products',
    method: 'POST',
    header: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token,
    },
    body: {
      mode: 'raw',
      raw: JSON.stringify({
        name: '테스트 상품',
        price: 12000,
        category: '기타',
      }),
    },
  },
  (err, res) => {
    pm.test('상품 생성은 201과 생성된 상품을 반환한다', () => {
      pm.expect(err).to.eql(null);
      pm.expect(res.code).to.eql(201);

      const json = res.json();
      pm.expect(json.name).to.eql('테스트 상품');
      pm.expect(json.price).to.eql(12000);
      pm.expect(json.category).to.eql('기타');
    });
  }
);
pm.sendRequest(
  {
    url: baseUrl + '/products',
    method: 'POST',
    header: { 'Content-Type': 'application/json' },
    body: {
      mode: 'raw',
      raw: JSON.stringify({
        name: '토큰 없는 상품',
        price: 1000,
      }),
    },
  },
  (err, res) => {
    pm.test('토큰 없는 상품 생성은 401을 반환한다', () => {
      pm.expect(err).to.eql(null);
      pm.expect(res.code).to.eql(401);

      const json = res.json();
      pm.expect(json.error).to.eql('인증이 필요합니다.');
    });
  }
);

pm.sendRequest(
  {
    url: baseUrl + '/products',
    method: 'POST',
    header: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token,
    },
    body: {
      mode: 'raw',
      raw: JSON.stringify({ price: 0 }),
    },
  },
  (err, res) => {
    pm.test('잘못된 상품 생성 본문은 400을 반환한다', () => {
      pm.expect(err).to.eql(null);
      pm.expect(res.code).to.eql(400);

      const json = res.json();
      pm.expect(json.error).to.eql('입력이 올바르지 않습니다.');
      pm.expect(Array.isArray(json.issues)).to.eql(true);
    });
  }
);

pm.sendRequest(
  {
    url: baseUrl + '/products/1',
    method: 'DELETE',
    header: { Authorization: 'Bearer ' + token },
  },
  (err, res) => {
    pm.test('상품 삭제는 204를 반환한다', () => {
      pm.expect(err).to.eql(null);
      pm.expect(res.code).to.eql(204);
    });
  }
);

pm.sendRequest(
  {
    url: baseUrl + '/products/9999',
    method: 'DELETE',
    header: { Authorization: 'Bearer ' + token },
  },
  (err, res) => {
    pm.test('없는 상품 삭제는 404를 반환한다', () => {
      pm.expect(err).to.eql(null);
      pm.expect(res.code).to.eql(404);

      const json = res.json();
      pm.expect(json.error).to.eql('상품을 찾을 수 없습니다.');
    });
  }
);

pm.sendRequest(
  { url: baseUrl + '/products/1', method: 'DELETE' },
  (err, res) => {
    pm.test('토큰 없는 상품 삭제는 401을 반환한다', () => {
      pm.expect(err).to.eql(null);
      pm.expect(res.code).to.eql(401);

      const json = res.json();
      pm.expect(json.error).to.eql('인증이 필요합니다.');
    });
  }
);
`,
    notes: [
      'Postman 테스트 스크립트에서는 request.get 같은 Playwright 문법 대신 pm.sendRequest를 사용합니다.',
      '여러 엔드포인트를 검증하는 문제는 하나의 제출 스크립트 안에 요청별 pm.sendRequest 블록을 나눠 작성합니다.',
      '본문이 없는 204 응답에서는 JSON 파싱을 하지 않는 것이 안정적입니다.',
    ],
  },
  'login-basic': {
    approach: [
      '성공 경로와 실패 경로를 별도 테스트로 분리해 원인을 빠르게 찾을 수 있게 한다.',
      '입력과 클릭 같은 사용자 행동은 await로 기다리고, 결과는 expect로 명시적으로 단언한다.',
      '필수 입력 경계는 아이디만 빈 경우, 비밀번호만 빈 경우, 둘 다 빈 경우를 각각 확인한다.',
      '에러 상태 이후 재로그인처럼 상태 전환이 있는 흐름은 이전 메시지가 사라지는지도 함께 확인한다.',
    ],
    code: `import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('유효한 자격증명으로 로그인하면 환영 메시지가 보인다', async ({ page }) => {
  await page.getByTestId('username').fill('tester');
  await page.getByTestId('password').fill('qaground123');
  await page.getByTestId('login-submit').click();

  await expect(page.getByTestId('login-success')).toHaveText(
    /환영합니다, tester님. 로그인에 성공했습니다./
  );
  await expect(page.getByTestId('login-error')).not.toBeVisible();
});

test('잘못된 자격증명으로는 에러가 출력되고 성공 메시지가 출력되지 않는다', async ({ page }) => {
  await page.getByTestId('username').fill('tester');
  await page.getByTestId('password').fill('wrong-password');
  await page.getByTestId('login-submit').click();

  await expect(page.getByTestId('login-error')).toHaveText(
    /아이디 또는 비밀번호가 올바르지 않습니다./
  );
  await expect(page.getByTestId('login-success')).not.toBeVisible();
});

test('아이디만 비우면 필수 입력 에러가 출력된다', async ({ page }) => {
  await page.getByTestId('password').fill('qaground123');
  await page.getByTestId('login-submit').click();

  await expect(page.getByTestId('login-error')).toHaveText(
    /아이디와 비밀번호를 모두 입력하세요./
  );
  await expect(page.getByTestId('login-success')).not.toBeVisible();
});

test('비밀번호만 비우면 필수 입력 에러가 출력된다', async ({ page }) => {
  await page.getByTestId('username').fill('tester');
  await page.getByTestId('login-submit').click();

  await expect(page.getByTestId('login-error')).toHaveText(
    /아이디와 비밀번호를 모두 입력하세요./
  );
  await expect(page.getByTestId('login-success')).not.toBeVisible();
});

test('아이디와 비밀번호를 모두 비우면 필수 입력 에러가 출력된다', async ({ page }) => {
  await page.getByTestId('login-submit').click();

  await expect(page.getByTestId('login-error')).toHaveText(
    /아이디와 비밀번호를 모두 입력하세요./
  );
  await expect(page.getByTestId('login-success')).not.toBeVisible();
});

test('에러 상태에서 다시 올바르게 로그인하면 성공할 수 있다', async ({ page }) => {
  await page.getByTestId('username').fill('tester');
  await page.getByTestId('login-submit').click();

  await expect(page.getByTestId('login-error')).toHaveText(
    /아이디와 비밀번호를 모두 입력하세요./
  );

  await page.getByTestId('password').fill('qaground123');
  await page.getByTestId('login-submit').click();

  await expect(page.getByTestId('login-success')).toHaveText(
    /환영합니다, tester님. 로그인에 성공했습니다./
  );
  await expect(page.getByTestId('login-error')).not.toBeVisible();
});
`,
    notes: [
      '정상 로그인만 검증하면 실제 서비스에서 자주 깨지는 검증 메시지와 재시도 흐름을 놓칩니다.',
      'toHaveText는 요소가 기대 문구가 될 때까지 기다리므로 비동기 UI 검증에 적합합니다.',
    ],
  },
};

function getPomChallengeSolution(slug: string): ChallengeSolution | undefined {
  const challenge = getChallenge(slug);
  if (!challenge || challenge.category !== 'pom') return undefined;

  if (slug.includes('profile')) {
    return {
      approach: challenge.requirement,
      code: `import { test, expect, type Locator, type Page } from '@playwright/test';

class ProfilePage {
  readonly nameInput: Locator;
  readonly phoneInput: Locator;
  readonly ageInput: Locator;
  readonly termsCheckbox: Locator;
  readonly submitButton: Locator;
  readonly successMessage: Locator;

  constructor(private readonly page: Page) {
    this.nameInput = page.locator('[data-testid="name"]');
    this.phoneInput = page.locator('[data-testid="phone"]');
    this.ageInput = page.locator('[data-testid="age"]');
    this.termsCheckbox = page.locator('[data-testid="terms"]');
    this.submitButton = page.locator('[data-testid="profile-submit"]');
    this.successMessage = page.locator('[data-testid="profile-success"]');
  }

  async open() {
    await this.page.goto('/sandbox/profile-form');
  }

  async registerProfile(name: string, phone: string, age: string) {
    await this.nameInput.fill(name);
    await this.phoneInput.fill(phone);
    await this.ageInput.fill(age);
    await this.termsCheckbox.check();
    await this.submitButton.click();
  }

  async assertRegistered() {
    await expect(this.successMessage).toBeVisible();
  }
}

test('user can register profile through page object', async ({ page }) => {
  const profilePage = new ProfilePage(page);
  await profilePage.open();
  await profilePage.registerProfile('김테스터', '010-0000-0000', '30');
  await profilePage.assertRegistered();
});
`,
      notes: [
        '필드가 많은 폼은 입력 순서와 selector가 테스트마다 반복되기 쉬우므로 Page Object로 묶는 효과가 큽니다.',
        '정상 등록 흐름은 registerProfile 같은 액션 메서드 하나로 읽히게 만들고, 성공 검증은 별도 단언 메서드로 분리합니다.',
      ],
    };
  }

  if (slug.includes('async-load')) {
    return {
      approach: challenge.requirement,
      code: `import { test, expect, type Locator, type Page } from '@playwright/test';

class OrdersPage {
  readonly loadButton: Locator;
  readonly loadingSpinner: Locator;
  readonly loadedContent: Locator;

  constructor(private readonly page: Page) {
    this.loadButton = page.locator('[data-testid="load-btn"]');
    this.loadingSpinner = page.locator('[data-testid="loading-spinner"]');
    this.loadedContent = page.locator('[data-testid="loaded-content"]');
  }

  async open() {
    await this.page.goto('/sandbox/async-load');
  }

  async loadOrders() {
    await this.loadButton.click();
  }

  async assertLoading() {
    await expect(this.loadingSpinner).toBeVisible();
  }

  async assertLoaded() {
    await expect(this.loadedContent).toBeVisible();
    await expect(this.loadingSpinner).not.toBeVisible();
  }
}

test('order list loads after request', async ({ page }) => {
  const ordersPage = new OrdersPage(page);
  await ordersPage.open();
  await ordersPage.loadOrders();
  await ordersPage.assertLoading();
  await ordersPage.assertLoaded();
});
`,
      notes: [
        '비동기 화면에서는 waitForTimeout 대신 expect의 자동 대기를 Page Object 단언 메서드에 넣는 편이 안정적입니다.',
        '테스트 본문은 loadOrders, assertLoading, assertLoaded처럼 상태 전환만 드러나게 유지합니다.',
      ],
    };
  }
  if (slug.includes('product-options')) {
    return {
      approach: challenge.requirement,
      code: `import { test, expect, type Locator, type Page } from '@playwright/test';

class ProductOptionsPage {
  readonly mediumSize: Locator;
  readonly blackColor: Locator;
  readonly summary: Locator;
  readonly addToCartButton: Locator;
  readonly addedConfirm: Locator;

  constructor(private readonly page: Page) {
    this.mediumSize = page.locator('[data-testid="size-m"]');
    this.blackColor = page.locator('[data-testid="color-black"]');
    this.summary = page.locator('[data-testid="selected-summary"]');
    this.addToCartButton = page.locator('[data-testid="add-to-cart"]');
    this.addedConfirm = page.locator('[data-testid="added-confirm"]');
  }

  async open() { await this.page.goto('/sandbox/product-options'); }
  async selectRequiredOptions() { await this.mediumSize.click(); await this.blackColor.click(); }
  async addToCart() { await this.addToCartButton.click(); }
  async assertSelected() { await expect(this.summary).toContainText('M / 블랙'); }
  async assertAdded() { await expect(this.addedConfirm).toBeVisible(); }
}

test('user can select options and add product to cart', async ({ page }) => {
  const productPage = new ProductOptionsPage(page);
  await productPage.open();
  await productPage.selectRequiredOptions();
  await productPage.assertSelected();
  await productPage.addToCart();
  await productPage.assertAdded();
});
`,
      notes: [
        '상품 옵션 화면은 선택 액션과 선택 결과 검증이 반복되기 쉬우므로 ProductOptionsPage로 묶기 좋습니다.',
        '옵션 누락 에러 케이스를 추가할 때도 같은 Page Object에 실패 단언 메서드만 확장하면 됩니다.',
      ],
    };
  }

  if (slug.includes('wishlist')) {
    return {
      approach: challenge.requirement,
      code: `import { test, expect, type Locator, type Page } from '@playwright/test';

class WishlistPage {
  readonly firstWishButton: Locator;
  readonly secondWishButton: Locator;
  readonly wishCount: Locator;

  constructor(private readonly page: Page) {
    this.firstWishButton = page.locator('[data-testid="wish-1"]');
    this.secondWishButton = page.locator('[data-testid="wish-2"]');
    this.wishCount = page.locator('[data-testid="wish-count"]');
  }

  async open() { await this.page.goto('/sandbox/wishlist'); }
  async toggleFirstItem() { await this.firstWishButton.click(); }
  async toggleSecondItem() { await this.secondWishButton.click(); }
  async assertFirstItemWished() { await expect(this.firstWishButton).toHaveAttribute('aria-pressed', 'true'); }
  async assertWishCount(count: number) { await expect(this.wishCount).toContainText(String(count)); }
}

test('user can toggle wishlist items', async ({ page }) => {
  const wishlistPage = new WishlistPage(page);
  await wishlistPage.open();
  await wishlistPage.toggleFirstItem();
  await wishlistPage.assertFirstItemWished();
  await wishlistPage.toggleSecondItem();
  await wishlistPage.assertWishCount(2);
});
`,
      notes: [
        '위시리스트는 버튼 텍스트보다 aria-pressed와 카운트가 핵심 상태입니다.',
        '토글 UI는 상태 단언을 Page Object 안에 두면 테스트 본문이 훨씬 읽기 쉬워집니다.',
      ],
    };
  }

  if (slug.includes('order-cancel')) {
    return {
      approach: challenge.requirement,
      code: `import { test, expect, type Locator, type Page } from '@playwright/test';

class OrderCancelPage {
  readonly setPaidButton: Locator;
  readonly setShippingButton: Locator;
  readonly orderStatus: Locator;
  readonly cancelButton: Locator;
  readonly cancelNotice: Locator;
  readonly refundAmount: Locator;

  constructor(private readonly page: Page) {
    this.setPaidButton = page.locator('[data-testid="set-paid"]');
    this.setShippingButton = page.locator('[data-testid="set-shipping"]');
    this.orderStatus = page.locator('[data-testid="order-status"]');
    this.cancelButton = page.locator('[data-testid="cancel-button"]');
    this.cancelNotice = page.locator('[data-testid="cancel-notice"]');
    this.refundAmount = page.locator('[data-testid="refund-amount"]');
  }

  async open() { await this.page.goto('/sandbox/order-cancel'); }
  async setPaid() { await this.setPaidButton.click(); }
  async setShipping() { await this.setShippingButton.click(); }
  async cancelOrder() { await this.cancelButton.click(); }
  async assertCancelled() { await expect(this.orderStatus).toHaveText('취소됨'); await expect(this.refundAmount).toContainText('50,000원'); }
  async assertCannotCancelShipping() { await expect(this.cancelButton).toBeDisabled(); await expect(this.cancelNotice).toBeVisible(); }
}

test('order can be cancelled only before shipping', async ({ page }) => {
  const orderPage = new OrderCancelPage(page);
  await orderPage.open();
  await orderPage.setPaid();
  await orderPage.cancelOrder();
  await orderPage.assertCancelled();
});
`,
      notes: [
        '상태 기반 기능은 상태 전환 액션과 결과 단언을 Page Object에 나누면 시나리오가 명확해집니다.',
        '배송중 취소 불가 같은 반대 경로는 같은 Page Object 메서드를 재사용해 별도 테스트로 확장하면 됩니다.',
      ],
    };
  }

  if (slug.includes('file-upload')) {
    return {
      approach: challenge.requirement,
      code: `import { test, expect, type Locator, type Page } from '@playwright/test';

class FileUploadPage {
  readonly fileInput: Locator;
  readonly fileName: Locator;
  readonly uploadButton: Locator;
  readonly uploadResult: Locator;

  constructor(private readonly page: Page) {
    this.fileInput = page.locator('[data-testid="file-input"]');
    this.fileName = page.locator('[data-testid="file-name"]');
    this.uploadButton = page.locator('[data-testid="upload-submit"]');
    this.uploadResult = page.locator('[data-testid="upload-result"]');
  }

  async open() { await this.page.goto('/sandbox/file-upload'); }
  async selectFile(name: string) { await this.fileInput.setInputFiles({ name, mimeType: 'application/pdf', buffer: Buffer.from('test') }); }
  async upload() { await this.uploadButton.click(); }
  async assertSelected(name: string) { await expect(this.fileName).toContainText(name); }
  async assertUploaded(name: string) { await expect(this.uploadResult).toContainText(name); }
}

test('user can upload evidence file', async ({ page }) => {
  const uploadPage = new FileUploadPage(page);
  await uploadPage.open();
  await uploadPage.selectFile('receipt.pdf');
  await uploadPage.assertSelected('receipt.pdf');
  await uploadPage.upload();
  await uploadPage.assertUploaded('receipt.pdf');
});
`,
      notes: [
        '파일 업로드는 setInputFiles 같은 구현 세부를 Page Object 내부에 숨기면 테스트 본문이 업무 흐름처럼 읽힙니다.',
        '파일명 표시와 업로드 완료 메시지를 분리해서 검증하면 실패 지점을 더 쉽게 파악할 수 있습니다.',
      ],
    };
  }
  if (slug.includes('cart-checkout')) {
    return {
      approach: challenge.requirement,
      code: `import { test, expect, type Locator, type Page } from '@playwright/test';

class CartCheckoutPage {
  readonly increaseMouseButton: Locator;
  readonly mouseQuantity: Locator;
  readonly couponInput: Locator;
  readonly applyCouponButton: Locator;
  readonly subtotal: Locator;
  readonly shipping: Locator;
  readonly discount: Locator;
  readonly total: Locator;

  constructor(private readonly page: Page) {
    this.increaseMouseButton = page.locator('[data-testid="inc-mouse"]');
    this.mouseQuantity = page.locator('[data-testid="qty-mouse"]');
    this.couponInput = page.locator('[data-testid="coupon-input"]');
    this.applyCouponButton = page.locator('[data-testid="apply-coupon"]');
    this.subtotal = page.locator('[data-testid="subtotal"]');
    this.shipping = page.locator('[data-testid="shipping"]');
    this.discount = page.locator('[data-testid="discount"]');
    this.total = page.locator('[data-testid="total"]');
  }

  async open() {
    await this.page.goto('/sandbox/cart-checkout');
  }

  async increaseMouseQuantity(times: number) {
    for (let i = 0; i < times; i += 1) {
      await this.increaseMouseButton.click();
    }
  }

  async applyCoupon(code: string) {
    await this.couponInput.fill(code);
    await this.applyCouponButton.click();
  }

  async assertSummary(expected: { qty: string; subtotal: string; shipping: string; discount: string; total: string }) {
    await expect(this.mouseQuantity).toHaveText(expected.qty);
    await expect(this.subtotal).toHaveText(expected.subtotal);
    await expect(this.shipping).toHaveText(expected.shipping);
    await expect(this.discount).toHaveText(expected.discount);
    await expect(this.total).toHaveText(expected.total);
  }
}

test('cart total changes after quantity and coupon updates', async ({ page }) => {
  const cartPage = new CartCheckoutPage(page);
  await cartPage.open();
  await cartPage.increaseMouseQuantity(2);
  await cartPage.applyCoupon('SAVE10');
  await cartPage.assertSummary({
    qty: '3',
    subtotal: '60,000원',
    shipping: '무료',
    discount: '-6,000원',
    total: '54,000원',
  });
});
`,
      notes: [
        '장바구니는 수량, 쿠폰, 배송비, 합계가 연쇄로 바뀌므로 Page Object가 도메인 규칙을 읽기 쉽게 숨겨주는 효과가 큽니다.',
        '테스트 본문은 수량 변경 → 쿠폰 적용 → 금액 검증이라는 구매자 관점의 시나리오만 남기는 것이 좋습니다.',
      ],
    };
  }
  if (slug.includes('signup')) {
    return {
      approach: challenge.requirement,
      code: `import { test, expect, type Locator, type Page } from '@playwright/test';

class SignupPage {
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly submitButton: Locator;
  readonly successMessage: Locator;

  constructor(private readonly page: Page) {
    this.emailInput = page.locator('[data-testid="email"]');
    this.passwordInput = page.locator('[data-testid="password"]');
    this.confirmPasswordInput = page.locator('[data-testid="confirm-password"]');
    this.submitButton = page.locator('[data-testid="signup-submit"]');
    this.successMessage = page.locator('[data-testid="signup-success"]');
  }

  async open() {
    await this.page.goto('/sandbox/signup-validation');
  }

  async signUp(email: string, password: string, confirmPassword = password) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.confirmPasswordInput.fill(confirmPassword);
    await this.submitButton.click();
  }

  async assertSignedUp() {
    await expect(this.successMessage).toBeVisible();
  }
}

test('new user can sign up through page object', async ({ page }) => {
  const signupPage = new SignupPage(page);
  await signupPage.open();
  await signupPage.signUp('tester@example.com', 'qaground123');
  await signupPage.assertSignedUp();
});
`,
      notes: [
        '회원가입처럼 입력 필드가 늘어나는 화면일수록 locator를 Page Object 필드로 모아두는 편이 유지보수에 유리합니다.',
        '테스트 본문은 open, signUp, assertSignedUp처럼 사용자 흐름만 읽히게 두고 세부 selector는 SignupPage 내부에 둡니다.',
        '검증 메시지까지 다루는 다음 단계에서는 성공 단언과 실패 단언 메서드를 분리해 확장하면 됩니다.',
      ],
    };
  }

  return {
    approach: challenge.requirement,
    code: `import { test, expect, type Locator, type Page } from '@playwright/test';

class LoginPage {
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly successMessage: Locator;

  constructor(private readonly page: Page) {
    this.usernameInput = page.locator('[data-testid="username"]');
    this.passwordInput = page.locator('[data-testid="password"]');
    this.submitButton = page.locator('[data-testid="login-submit"]');
    this.successMessage = page.locator('[data-testid="login-success"]');
  }

  async open() {
    await this.page.goto('/sandbox/login-basic');
  }

  async signIn(username: string, password: string) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async assertSignedIn() {
    await expect(this.successMessage).toBeVisible();
  }
}

test('valid user can sign in through page object', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.open();
  await loginPage.signIn('tester', 'qaground123');
  await loginPage.assertSignedIn();
});
`,
    notes: [
      '메서드 이름 자체보다 테스트 본문에서 사용자 시나리오만 읽히는지가 중요합니다.',
      'locator와 expect는 Page Object 내부로 숨기고, 스펙은 의도 기반 메서드만 호출하게 정리합니다.',
      '실제 Playwright API는 page.locator(...)입니다. page.locators(...)는 실행 시 실패합니다.',
    ],
  };
}
export function getChallengeSolution(slug: string): ChallengeSolution | undefined {
  return SOLUTIONS[slug] ?? getPomChallengeSolution(slug);
}
