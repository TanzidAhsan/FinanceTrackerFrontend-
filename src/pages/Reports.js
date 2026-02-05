import { useEffect, useState } from "react";
import API from "../api/api";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";
import "../styles/reports.css";

const Reports = () => {
  const [monthlyData, setMonthlyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    totalIncome: 0,
    totalExpense: 0,
    netSavings: 0,
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data } = await API.get("/summary/monthly");
        
        // Transform data for chart
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const chartData = {};

        data.forEach((item) => {
          const key = `${item._id.month}/${item._id.year}`;
          const monthLabel = `${monthNames[item._id.month - 1]} ${item._id.year}`;
          
          if (!chartData[key]) {
            chartData[key] = { month: monthLabel, income: 0, expense: 0 };
          }
          
          if (item._id.type === "income") {
            chartData[key].income = item.total;
          } else {
            chartData[key].expense = item.total;
          }
        });

        const formattedData = Object.values(chartData).sort((a, b) => {
          const [aMonth, aYear] = a.month.split(" ");
          const [bMonth, bYear] = b.month.split(" ");
          if (aYear !== bYear) return aYear - bYear;
          return monthNames.indexOf(aMonth) - monthNames.indexOf(bMonth);
        });

        setMonthlyData(formattedData);

        // Calculate summary
        let totalIncome = 0;
        let totalExpense = 0;
        data.forEach((item) => {
          if (item._id.type === "income") {
            totalIncome += item.total;
          } else {
            totalExpense += item.total;
          }
        });

        setSummary({
          totalIncome,
          totalExpense,
          netSavings: totalIncome - totalExpense,
        });
      } catch (err) {
        console.error("Failed to load monthly data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const SummaryCard = ({ title, value, type }) => (
    <div className={`summary-card ${type}`}>
      <h3>{title}</h3>
      <p className="amount">৳ {value.toFixed(2)}</p>
    </div>
  );

  return (
    <div className="reports-container">
      <div className="reports-header">
        <div>
          <h1>Reports</h1>
          <p className="header-subtitle">Analyze your financial trends</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="summary-grid">
        <SummaryCard title="Total Income" value={summary.totalIncome} type="income" />
        <SummaryCard title="Total Expense" value={summary.totalExpense} type="expense" />
        <SummaryCard title="Net Savings" value={summary.netSavings} type="balance" />
      </div>

      {/* Charts Section */}
      {loading ? (
        <div className="loading">Loading reports...</div>
      ) : monthlyData.length > 0 ? (
        <>
          {/* Bar Chart */}
          <div className="chart-container">
            <div className="chart-header">
              <h2>Income vs Expense</h2>
              <span className="chart-badge">Monthly Comparison</span>
            </div>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                  }}
                  formatter={(value) => `৳ ${value.toFixed(2)}`}
                />
                <Legend />
                <Bar dataKey="income" fill="#16a34a" radius={[8, 8, 0, 0]} />
                <Bar dataKey="expense" fill="#dc2626" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Trend Line Chart */}
          <div className="chart-container">
            <div className="chart-header">
              <h2>Savings Trend</h2>
              <span className="chart-badge">Monthly Net Savings</span>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                  }}
                  formatter={(value) => `৳ ${value.toFixed(2)}`}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="income"
                  stroke="#16a34a"
                  strokeWidth={3}
                  dot={{ fill: "#16a34a", r: 5 }}
                  activeDot={{ r: 7 }}
                />
                <Line
                  type="monotone"
                  dataKey="expense"
                  stroke="#dc2626"
                  strokeWidth={3}
                  dot={{ fill: "#dc2626", r: 5 }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Data Table */}
          <div className="table-container">
            <div className="table-header">
              <h2>Monthly Breakdown</h2>
            </div>
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Month</th>
                    <th>Income</th>
                    <th>Expense</th>
                    <th>Net Savings</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyData.map((item, idx) => (
                    <tr key={idx}>
                      <td className="month-cell">{item.month}</td>
                      <td className="income">৳ {item.income.toFixed(2)}</td>
                      <td className="expense">৳ {item.expense.toFixed(2)}</td>
                      <td className={item.income - item.expense >= 0 ? "savings positive" : "savings negative"}>
                        ৳ {(item.income - item.expense).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="empty-state">
          <p>No data available. Start adding transactions to see your reports!</p>
        </div>
      )}
    </div>
  );
};

export default Reports;
