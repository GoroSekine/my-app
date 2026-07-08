import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function App() {
  const [transactions, setTransactions] = useState([]);
  const [trends, setTrends] = useState({ labels: [], data: [] });
  const [ranking, setRanking] = useState([]);
  
  const userId = 1; // デモ用
  const budgetLimit = 100000; // 予算上限

  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('食費');
  const [type, setType] = useState('expense');

  const fetchData = async () => {
    await fetch('/api/seed', { method: 'POST' });

    const resTx = await fetch('/api/transactions');
    const dataTx = await resTx.json();
    setTransactions(dataTx);

    const resTrends = await fetch('/api/analysis/trends');
    const dataTrends = await resTrends.json();
    setTrends(dataTrends);

    const resRank = await fetch('/api/ranking');
    const dataRank = await resRank.json();
    setRanking(dataRank);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount) return;

    await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, amount, category, type })
    });

    setAmount('');
    fetchData();
  };

  const currentMonthStr = new Array(new Date().getFullYear(), String(new Date().getMonth() + 1).padStart(2, '0')).join('-');
  const thisMonthExpense = transactions
    .filter(t => t.type === 'expense' && t.date.startsWith(currentMonthStr))
    .reduce((sum, t) => sum + t.amount, 0);

  const chartData = {
    labels: trends.labels,
    datasets: [
      {
        label: '月別支出 (円)',
        data: trends.data,
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
      }
    ]
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
      <h1>💰 簡単家計簿アプリ</h1>

      <div style={{ padding: '15px', background: thisMonthExpense > budgetLimit ? '#ffebee' : '#e8f5e9', borderRadius: '5px', marginBottom: '20px' }}>
        <h3>今月の予算ステータス ({currentMonthStr})</h3>
        <p>今月の支出: <strong>{thisMonthExpense.toLocaleString()} 円</strong> / 予算上限: {budgetLimit.toLocaleString()} 円</p>
        {thisMonthExpense > budgetLimit ? (
          <span style={{ color: 'red', fontWeight: 'bold' }}>⚠️ 予算オーバーです！節約しましょう。</span>
        ) : (
          <span style={{ color: 'green', fontWeight: 'bold' }}>✅ 予算内に収まっています。ナイス！</span>
        )}
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="expense">支出</option>
          <option value="income">収入</option>
        </select>
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="食費">食費</option>
          <option value="交際費">交際費</option>
          <option value="固定費">固定費</option>
          <option value="その他">その他</option>
        </select>
        <input type="number" placeholder="金額" value={amount} onChange={(e) => setAmount(e.target.value)} required />
        <button type="submit">記録する</button>
      </form>

      <div style={{ marginBottom: '30px' }}>
        <h3>📊 月別支出推移</h3>
        {trends.labels.length > 0 ? <Bar data={chartData} /> : <p>データがまだありません</p>}
      </div>

      <div style={{ display: 'flex', gap: '20px' }}>
        <div style={{ flex: 1 }}>
          <h3>🏆 節約ランキング (総支出が少ない順)</h3>
          <ul>
            {ranking.map((user, idx) => (
              <li key={user.id}>{idx + 1}位: {user.name} ({user.totalExpense.toLocaleString()}円)</li>
            ))}
          </ul>
        </div>
        <div style={{ flex: 1 }}>
          <h3>📜 直近の履歴</h3>
          <ul style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {transactions.slice(0, 5).map(t => (
              <li key={t.id} style={{ color: t.type === 'income' ? 'green' : 'red' }}>
                {t.date.substring(0, 10)} [{t.category}] {t.type === 'income' ? '+' : '-'}{t.amount.toLocaleString()}円
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default App;