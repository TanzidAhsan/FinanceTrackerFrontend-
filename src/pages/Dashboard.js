import { useEffect, useState } from "react";
import API from "../api/api";
import StatCard from "../components/StatCard";
import ExpenseChart from "../components/ExpenseChart";
import AddTransaction from "../components/AddTransaction";
import "../styles/dashboard-modern.css";

const Dashboard = () => {
  const [summary, setSummary] = useState([]);
  const [recent, setRecent] = useState([]);

  const loadData = async () => {
    const { data: s } = await API.get("/summary/type");
    const { data: t } = await API.get("/transactions?limit=10");
    setSummary(s);
    setRecent(t.transactions || t);
  };

  useEffect(() => {
    loadData();
  }, []);

  const income = summary.find(s => s._id === "income")?.total || 0;
  const expense = summary.find(s => s._id === "expense")?.total || 0;
  const balance = income - expense;

  return (
    <div className="dashboard">
      <div className="dashboard-background"></div>
      
      <div className="dashboard-content-wrapper">
        <div className="dashboard-header">
          <div className="header-content">
            <h1 className="dashboard-title">💼 Financial Dashboard</h1>
            <p className="header-subtitle">Track your income, expenses, and balance at a glance</p>
          </div>
          <div className="header-action">
            <AddTransaction onTransactionAdded={loadData} />
          </div>
        </div>

        <div className="stats-grid">
          <StatCard title="Total Income" value={income} type="income" icon="📈" />
          <StatCard title="Total Expense" value={expense} type="expense" icon="📉" />
          <StatCard title="Balance" value={balance} type="balance" icon="💰" />
        </div>

        <div className="dashboard-main">
          <div className="chart-section">
            <div className="section-header">
              <div>
                <h3>📊 Expense Breakdown</h3>
                <p className="section-subtitle">Category-wise expense distribution</p>
              </div>
            </div>
            <ExpenseChart />
          </div>

          <div className="recent-section">
            <div className="section-header">
              <div>
                <h3>⏱️ Recent Transactions</h3>
                <p className="section-subtitle">{recent.length} latest transactions</p>
              </div>
            </div>
            <div className="recent-list">
              {recent.length > 0 ? (
                recent.map((t) => (
                  <div key={t._id} className={`recent-item ${t.type}`}>
                    <div className="recent-info">
                      <div className="recent-category">
                        <span className={`category-icon ${t.type}`}>
                          {t.type === "income" ? "📈" : "📉"}
                        </span>
                        <div>
                          <p className="category-name">{t.category}</p>
                          <p className="transaction-date">
                            {new Date(t.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className={`recent-amount ${t.type}`}>
                      <span className="amount-sign">{t.type === "income" ? "+" : "-"}</span>
                      <span className="amount-value">৳ {t.amount}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <div className="empty-icon">💳</div>
                  <p>No transactions yet</p>
                  <span className="empty-hint">Start by adding your first transaction</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
