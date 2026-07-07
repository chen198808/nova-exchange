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

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });
  } catch (fetchError: any) {
    throw new Error(`网络连接失败：${fetchError.message || '请检查网络连接'}`);
  }

  const contentType = response.headers.get('content-type') || '';
  
  let data: any;
  if (contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch (jsonError) {
      const text = await response.text().catch(() => '');
      throw new Error(`服务器返回了无效的响应（HTTP ${response.status}）：${text.slice(0, 200) || '空响应'}`);
    }
  } else {
    const text = await response.text().catch(() => '');
    if (!response.ok) {
      throw new Error(`请求失败（HTTP ${response.status}）：${text.slice(0, 200) || '服务器错误'}`);
    }
    throw new Error(`服务器返回了非 JSON 响应：${text.slice(0, 100) || '空响应'}`);
  }

  if (!response.ok) {
    const error: any = new Error(data.error || `请求失败（HTTP ${response.status}）`);
    if (data.debug) error.debug = data.debug;
    if (data.hotWalletAddress) error.hotWalletAddress = data.hotWalletAddress;
    throw error;
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

  okx: {
    getInstruments: (instType: string = 'SPOT') =>
      request(`/okx/instruments?instType=${instType}`),

    getTickers: (instType: string = 'SPOT') =>
      request(`/okx/tickers?instType=${instType}`),

    getTicker: (instId: string) =>
      request(`/okx/ticker/${instId}`),

    getCandles: (instId: string, bar: string = '1H', limit: number = 100) =>
      request(`/okx/candles/${instId}?bar=${bar}&limit=${limit}`),

    getOrderBook: (instId: string, sz: string = '20') =>
      request(`/okx/orderbook/${instId}?sz=${sz}`),

    getTrades: (instId: string, limit: number = 50) =>
      request(`/okx/trades/${instId}?limit=${limit}`),

    getBalance: () =>
      request('/okx/balance'),

    placeOrder: (params: {
      instId: string;
      tdMode: string;
      side: string;
      ordType: string;
      sz: string;
      px?: string;
    }) =>
      request('/okx/order', {
        method: 'POST',
        body: JSON.stringify(params),
      }),

    cancelOrder: (instId: string, ordId: string) =>
      request('/okx/cancel-order', {
        method: 'POST',
        body: JSON.stringify({ instId, ordId }),
      }),

    getOrder: (instId: string, ordId: string) =>
      request(`/okx/order/${instId}/${ordId}`),

    getOrdersHistory: (instType: string = 'SPOT', limit: number = 100) =>
      request(`/okx/orders-history?instType=${instType}&limit=${limit}`),

    getPositions: (instType: string = 'SWAP') =>
      request(`/okx/positions?instType=${instType}`),

    getStatus: () =>
      request('/okx/status'),
  },
};

export default api;
