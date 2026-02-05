import { useEffect, useState } from "react";
import API from "../api/api";
import TransactionRow from "../components/TransactionRow";
import Pagination from "../components/Pagination";
import "../styles/transactions.css";

const Transactions = () => {
  const [data, setData] = useState({});
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    type: "",
    category: "",
    startDate: "",
    endDate: "",
  });

  const expenseCategories = ["Food", "Transport", "Entertainment", "Utilities", "Health", "Education", "Shopping", "Other"];
  const incomeCategories = ["Salary", "Freelance", "Investment", "Bonus", "Gift", "Refund", "Other Income"];
  const categories = filters.type === "income" ? incomeCategories : filters.type === "expense" ? expenseCategories : [...incomeCategories, ...expenseCategories];

  const load = async () => {
    const params = new URLSearchParams({
      page,
      search,
      ...(filters.type && { type: filters.type }),
      ...(filters.category && { category: filters.category }),
      ...(filters.startDate && { startDate: filters.startDate }),
      ...(filters.endDate && { endDate: filters.endDate }),
    });

    const res = await API.get(`/transactions?${params.toString()}`);
    setData(res.data);
  };

  useEffect(() => {
    setPage(1); // Reset to page 1 when filters change
  }, [filters, search]);

  useEffect(() => {
    load();
  }, [page, search, filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const clearFilters = () => {
    setFilters({
      type: "",
      category: "",
      startDate: "",
      endDate: "",
    });
    setSearch("");
  };

  const deleteTx = async (id) => {
    if (window.confirm("Are you sure you want to delete this transaction?")) {
      await API.delete(`/transactions/${id}`);
      load();
    }
  };

  const hasActiveFilters = search || filters.type || filters.category || filters.startDate || filters.endDate;

  return (
    <div className="transactions-container">
      <div className="transactions-header">
        <div>
          <h1>Transactions</h1>
          <p className="header-subtitle">Manage and track your spending</p>
        </div>
      </div>

      {/* Filters Section */}
      <div className="filters-section">
        <div className="filter-group">
          <input
            className="search-input"
            placeholder="🔍 Search by note..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="filters-row">
          <div className="filter-group">
            <label>Type</label>
            <select name="type" value={filters.type} onChange={handleFilterChange}>
              <option value="">All Types</option>
              <option value="income">📈 Income</option>
              <option value="expense">📉 Expense</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Category</label>
            <select name="category" value={filters.category} onChange={handleFilterChange}>
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Start Date</label>
            <input
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
            />
          </div>

          <div className="filter-group">
            <label>End Date</label>
            <input
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
            />
          </div>

          {hasActiveFilters && (
            <button className="clear-filters-btn" onClick={clearFilters}>
              ✕ Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Transactions Table */}
      <div className="transactions-table-wrapper">
        <table className="transactions-table">
          <thead>
            <tr>
              <th>Category</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.transactions && data.transactions.length > 0 ? (
              data.transactions.map((t) => (
                <TransactionRow key={t._id} t={t} onDelete={deleteTx} onUpdate={load} />
              ))
            ) : (
              <tr>
                <td colSpan="5" className="empty-state">
                  No transactions found. Try adjusting your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data.pages && data.pages > 1 && (
        <Pagination page={data.page} pages={data.pages} setPage={setPage} />
      )}
    </div>
  );
};

export default Transactions;
