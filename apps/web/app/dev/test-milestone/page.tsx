'use client';

import { useQuery } from '@tanstack/react-query';
import { milestoneByIdQueryOptions } from '@/features/milestones/api/query';

export default function TestMilestonePage() {
  const milestoneId = '019c38ab-fa86-756e-adac-0cba5985c360';
  const { data, isLoading, isError, error } = useQuery(milestoneByIdQueryOptions(milestoneId));

  return (
    <div style={{ padding: 20, color: 'white', background: '#1a1a1a', minHeight: '100vh' }}>
      <h1>Milestone Test Page</h1>
      <p>MilestoneId: {milestoneId}</p>
      <p>isLoading: {String(isLoading)}</p>
      <p>isError: {String(isError)}</p>
      {error && <p style={{ color: 'red' }}>Error: {String(error)}</p>}
      {data && (
        <div>
          <p>data.success: {String(data.success)}</p>
          {data.success && <p>Title: {data.data.title}</p>}
          {!data.success && <pre style={{ color: 'red' }}>{JSON.stringify(data.errors, null, 2)}</pre>}
          <pre style={{ fontSize: 12, maxHeight: 400, overflow: 'auto' }}>{JSON.stringify(data, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
