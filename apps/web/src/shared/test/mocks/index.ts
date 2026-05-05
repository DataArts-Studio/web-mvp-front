export const initMocks = async () => {
  if (typeof window === 'undefined') {
    // 서버 환경 (Node.js / SSR)
    const { server } = await import('./node');
    server.listen({ onUnhandledRequest: 'bypass' });
  } else {
    // 브라우저 환경 (CSR)
    const { worker } = await import('./browser');
    await worker.start({ onUnhandledRequest: 'bypass' });
  }
};
