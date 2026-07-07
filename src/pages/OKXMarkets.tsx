import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Search, Activity } from 'lucide-react';
import api from '../services/api';

interface Ticker {
  instId: string;
  last: string;
  open24h: string;
  high24h: string;
  low24h: string;
  vol24h: string;
  volCcy24h: string;
  sodUtc0: string;
  ts: string;
}

export default function OKXMarkets() {
  const [tickers, setTickers] = useState<Ticker[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInstType, setSelectedInstType] = useState('SPOT');

  useEffect(() => {
    loadTickers();
    const interval = setInterval(loadTickers, 5000);
    return () => clearInterval(interval);
  }, [selectedInstType]);

  const loadTickers = async () => {
    try {
      const data: any = await api.okx.getTickers(selectedInstType);
      setTickers(data.tickers || []);
    } catch (error) {
      console.error('Failed to load tickers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTickers = tickers.filter((t) =>
    t.instId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getChangePercent = (last: string, open24h: string) => {
    const lastPrice = parseFloat(last);
    const openPrice = parseFloat(open24h);
    if (openPrice === 0) return 0;
    return ((lastPrice - openPrice) / openPrice) * 100;
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Activity className="w-8 h-8 text-blue-500" />
          <h1 className="text-2xl font-bold">OKX 行情</h1>
        </div>

        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex gap-2">
            {['SPOT', 'SWAP', 'FUTURES'].map((type) => (
              <button
                key={type}
                onClick={() => setSelectedInstType(type)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  selectedInstType === type
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {type === 'SPOT' ? '现货' : type === 'SWAP' ? '永续合约' : '期货'}
              </button>
            ))}
          </div>

          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                placeholder="搜索交易对..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">加载中...</div>
        ) : (
          <div className="bg-gray-800 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-900">
                <tr className="text-gray-400 text-sm">
                  <th className="text-left p-4">交易对</th>
                  <th className="text-right p-4">最新价</th>
                  <th className="text-right p-4">24h涨跌</th>
                  <th className="text-right p-4">24h最高</th>
                  <th className="text-right p-4">24h最低</th>
                  <th className="text-right p-4">24h成交量</th>
                </tr>
              </thead>
              <tbody>
                {filteredTickers.slice(0, 50).map((ticker, index) => {
                  const change = getChangePercent(ticker.last, ticker.open24h);
                  const isPositive = change >= 0;
                  return (
                    <tr
                      key={ticker.instId}
                      className="border-t border-gray-700 hover:bg-gray-700/50 cursor-pointer"
                    >
                      <td className="p-4">
                        <div className="font-medium">{ticker.instId}</div>
                      </td>
                      <td className="text-right p-4">
                        <span className={isPositive ? 'text-green-500' : 'text-red-500'}>
                          {parseFloat(ticker.last).toLocaleString()}
                        </span>
                      </td>
                      <td className="text-right p-4">
                        <div className={`flex items-center justify-end gap-1 ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                          {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                          <span>{isPositive ? '+' : ''}{change.toFixed(2)}%</span>
                        </div>
                      </td>
                      <td className="text-right p-4 text-gray-400">
                        {parseFloat(ticker.high24h).toLocaleString()}
                      </td>
                      <td className="text-right p-4 text-gray-400">
                        {parseFloat(ticker.low24h).toLocaleString()}
                      </td>
                      <td className="text-right p-4 text-gray-400">
                        {parseFloat(ticker.vol24h).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
