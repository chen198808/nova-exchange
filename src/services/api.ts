const API_BASE = '/api';

function getToken(): string | null {
  return localStorage.getItem('token');
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }

  return data;
}

export const api = {
  auth: {
    register: (username: string, password: string, email?: string) =>
      request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username, password, email }),
      }),

    login: (username: string, password: string) =>
      request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      }),

    getProfile: () =>
      request('/auth/profile'),
  },

  assets: {
    getBalances: () =>
      request('/assets/balances'),

    getDepositAddress: () =>
      request('/assets/deposit-address'),

    verifyDeposit: (txId: string, asset: string) =>
      request('/assets/deposit/verify', {
        method: 'POST',
        body: JSON.stringify({ txId, asset }),
      }),

    withdraw: (asset: string, amount: number, toAddress: string) =>
      request('/assets/withdraw', {
        method: 'POST',
        body: JSON.stringify({ asset, amount, toAddress }),
      }),

    getDeposits: () =>
      request('/assets/deposits'),

    getWithdrawals: () =>
      request('/assets/withdrawals'),
  },

  trading: {
    getPrice: (pair: string) =>
      request(`/trading/price/${pair}`),

    getQuote: (inputAsset: string, outputAsset: string, amount: number, slippage?: number) =>
      request('/trading/quote', {
        method: 'POST',
        body: JSON.stringify({ inputAsset, outputAsset, amount, slippage }),
      }),

    swap: (inputAsset: string, outputAsset: string, amount: number, slippage?: number) =>
      request('/trading/swap', {
        method: 'POST',
        body: JSON.stringify({ inputAsset, outputAsset, amount, slippage }),
      }),

    getOrders: () =>
      request('/trading/orders'),
  },
};

export default api;
