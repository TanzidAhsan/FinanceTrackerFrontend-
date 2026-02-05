import { useState } from "react";
import API from "../api/api";
import "../styles/add-transaction.css";

export default function AddTransaction({ onTransactionAdded }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    type: "expense",
    amount: "",
    category: "Food",
    note: "",
    date: new Date().toISOString().split("T")[0],
  });

  const incomeCategories = ["Salary", "Freelance", "Investment", "Bonus", "Gift", "Refund", "Other Income"];
  const expenseCategories = ["Food", "Transport", "Entertainment", "Utilities", "Health", "Education", "Shopping", "Other"];
  
  const categories = formData.type === "income" ? incomeCategories : expenseCategories;

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "type") {
      // Reset category when type changes
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
      await API.post("/transactions", formData);
      setFormData({
        type: "expense",
        amount: "",
        category: "Food",
        note: "",
        date: new Date().toISOString().split("T")[0],
      });
      setIsOpen(false);
      onTransactionAdded();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add transaction");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        className="add-transaction-btn"
        onClick={() => setIsOpen(true)}
      >
        <span className="btn-icon">➕</span>
        Add Transaction
      </button>

      {isOpen && (
        <div className="modal-overlay" onClick={() => setIsOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New Transaction</h2>
              <button
                className="modal-close"
                onClick={() => setIsOpen(false)}
              >
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
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setIsOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`btn-submit ${formData.type}`}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner"></span>
                      Adding...
                    </>
                  ) : (
                    `Add ${formData.type === "income" ? "Income" : "Expense"}`
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
