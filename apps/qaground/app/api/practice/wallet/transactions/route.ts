import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const TRANSACTIONS = [
  { id: 'tx-1', type: 'deposit', amount: 50000, balanceAfter: 150000, memo: '충전' },
  { id: 'tx-2', type: 'withdrawal', amount: 12000, balanceAfter: 138000, memo: '송금' },
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const data = type ? TRANSACTIONS.filter((tx) => tx.type === type) : TRANSACTIONS;
  return NextResponse.json({ balance: 138000, total: data.length, data });
}
