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

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'member';
  active: boolean;
}

export const USERS: User[] = [
  { id: 1, name: '김지원', email: 'jiwon@qaground.dev', role: 'admin', active: true },
  { id: 2, name: '박서준', email: 'seojun@qaground.dev', role: 'member', active: true },
  { id: 3, name: '이하늘', email: 'haneul@qaground.dev', role: 'member', active: false },
  { id: 4, name: '최민지', email: 'minji@qaground.dev', role: 'member', active: true },
  { id: 5, name: '정우성', email: 'woosung@qaground.dev', role: 'admin', active: true },
  { id: 6, name: '한가람', email: 'garam@qaground.dev', role: 'member', active: true },
  { id: 7, name: '오세린', email: 'serin@qaground.dev', role: 'member', active: false },
  { id: 8, name: '배도윤', email: 'doyun@qaground.dev', role: 'member', active: true },
];

export function findUser(id: number): User | undefined {
  return USERS.find((u) => u.id === id);
}

export interface Order {
  id: number;
  customer: string;
  items: { name: string; qty: number; price: number }[];
  total: number;
  status: 'created' | 'paid' | 'shipped';
}

export const ORDERS: Order[] = [
  {
    id: 1001,
    customer: '김지원',
    items: [{ name: '무선 키보드', qty: 1, price: 39000 }],
    total: 39000,
    status: 'paid',
  },
  {
    id: 1002,
    customer: '박서준',
    items: [
      { name: '무선 마우스', qty: 2, price: 29000 },
      { name: 'USB-C 허브', qty: 1, price: 49000 },
    ],
    total: 107000,
    status: 'shipped',
  },
];

export function findOrder(id: number): Order | undefined {
  return ORDERS.find((o) => o.id === id);
}
export type TicketStatus = 'open' | 'pending' | 'resolved';
export type TicketPriority = 'low' | 'medium' | 'high';

export interface Ticket {
  id: number;
  title: string;
  customerEmail: string;
  status: TicketStatus;
  priority: TicketPriority;
  assignee: string | null;
  createdAt: string;
}

export const TICKETS: Ticket[] = [
  {
    id: 501,
    title: '로그인 인증 메일이 오지 않아요',
    customerEmail: 'minji@example.com',
    status: 'open',
    priority: 'high',
    assignee: null,
    createdAt: '2026-06-01T09:00:00.000Z',
  },
  {
    id: 502,
    title: '결제 영수증 재발급 요청',
    customerEmail: 'billing@example.com',
    status: 'pending',
    priority: 'medium',
    assignee: 'support-a',
    createdAt: '2026-06-02T10:30:00.000Z',
  },
  {
    id: 503,
    title: '프로젝트 멤버 초대 오류',
    customerEmail: 'lead@example.com',
    status: 'open',
    priority: 'medium',
    assignee: 'support-b',
    createdAt: '2026-06-03T14:20:00.000Z',
  },
  {
    id: 504,
    title: 'CSV 내보내기 파일이 깨져요',
    customerEmail: 'qa@example.com',
    status: 'resolved',
    priority: 'low',
    assignee: 'support-a',
    createdAt: '2026-06-04T08:15:00.000Z',
  },
  {
    id: 505,
    title: '자동화 실행 결과가 지연됩니다',
    customerEmail: 'runner@example.com',
    status: 'pending',
    priority: 'high',
    assignee: null,
    createdAt: '2026-06-05T16:45:00.000Z',
  },
];

export function findTicket(id: number): Ticket | undefined {
  return TICKETS.find((ticket) => ticket.id === id);
}
