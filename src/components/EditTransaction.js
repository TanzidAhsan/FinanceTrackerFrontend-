import { useState, useEffect } from "react";
import API from "../api/api";
import "../styles/add-transaction.css";

export default function EditTransaction({ transaction, onTransactionUpdated, onClose }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    type: transaction.type,
    amount: transaction.amount,
    category: transaction.category,
    note: transaction.note,
    date: transaction.date.split("T")[0],
  });

  const incomeCategories = ["Salary", "Freelance", "Investment", "Bonus", "Gift", "Refund", "Other Income"];
  const expenseCategories = ["Food", "Transport", "Entertainment", "Utilities", "Health", "Education", "Shopping", "Other"];
  
  const categories = formData.type === "income" ? incomeCategories : expenseCategories;

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "type") {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        category: value === "income" ? incomeCategories[0] : expenseCategories[0],
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: name === "amount" ? parseFloat(value) || "" : value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.amount || formData.amount <= 0) {
      setError("Amount must be greater than 0");
      return;
    }

    setLoading(true);
    try {
      await API.put(`/transactions/${transaction._id}`, formData);
      onTransactionUpdated();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update transaction");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit Transaction</h2>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {error && <div className="modal-error">{error}</div>}

        <form onSubmit={handleSubmit} className="transaction-form">
          {/* Type Selection with Toggle */}
          <div className="type-selector">
            <button
              type="button"
              className={`type-btn ${formData.type === "expense" ? "active" : ""}`}
              onClick={() => handleChange({ target: { name: "type", value: "expense" } })}
            >
              <span className="type-icon">📉</span>
              <span>Expense</span>
            </button>
            <button
              type="button"
              className={`type-btn ${formData.type === "income" ? "active" : ""}`}
              onClick={() => handleChange({ target: { name: "type", value: "income" } })}
            >
              <span className="type-icon">📈</span>
              <span>Income</span>
            </button>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Amount</label>
              <input
                type="number"
                name="amount"
                placeholder="0.00"
                value={formData.amount}
                onChange={handleChange}
                step="0.01"
                min="0"
                required
              />
            </div>

            <div className="form-group">
              <label>Date</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group full-width">
            <label>Category</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className={`category-select ${formData.type}`}
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group full-width">
            <label>Note (Optional)</label>
            <input
              type="text"
              name="note"
              placeholder="e.g., Lunch at the office..."
              value={formData.note}
              onChange={handleChange}
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className={`btn-submit ${formData.type}`} disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Updating...
                </>
              ) : (
                "Update Transaction"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
