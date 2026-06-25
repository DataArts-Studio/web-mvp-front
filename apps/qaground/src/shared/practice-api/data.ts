/**
 * 연습용 가짜 REST API 데이터 (API 트랙).
 *
 * - 예측 가능하고 상태가 없는(stateless) 응답을 준다(reqres.in 스타일).
 *   쓰기(POST/DELETE)는 성공 응답을 돌려주되 실제로 영속하지 않는다.
 *   여러 학습자가 동시에 써도 데이터가 흔들리지 않아 테스트가 안정적이다.
 */

export interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  inStock: boolean;
}

export const PRODUCTS: Product[] = [
  { id: 1, name: '무선 키보드', category: '주변기기', price: 39000, inStock: true },
  { id: 2, name: '기계식 키보드', category: '주변기기', price: 89000, inStock: true },
  { id: 3, name: '무선 마우스', category: '주변기기', price: 29000, inStock: true },
  { id: 4, name: '27인치 모니터', category: '모니터', price: 259000, inStock: false },
  { id: 5, name: '34인치 울트라와이드', category: '모니터', price: 590000, inStock: true },
  { id: 6, name: '노트북 거치대', category: '액세서리', price: 35000, inStock: true },
  { id: 7, name: 'USB-C 허브', category: '액세서리', price: 49000, inStock: true },
  { id: 8, name: '웹캠 1080p', category: '주변기기', price: 69000, inStock: false },
  { id: 9, name: '게이밍 노트북', category: '노트북', price: 1890000, inStock: true },
  { id: 10, name: '경량 노트북', category: '노트북', price: 1290000, inStock: true },
  { id: 11, name: '노이즈캔슬링 헤드셋', category: '주변기기', price: 159000, inStock: true },
  { id: 12, name: '모니터 암', category: '액세서리', price: 79000, inStock: false },
];

export function findProduct(id: number): Product | undefined {
  return PRODUCTS.find((p) => p.id === id);
}
