import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api/api";
import FinalSettlementBills from "../components/FinalSettlementBills";
import "../styles/meals.css";

const MealDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [meal, setMeal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("records");
  const [showAddPersonRecord, setShowAddPersonRecord] = useState(false);
  const [showBulkAdd, setShowBulkAdd] = useState(false);
  const [expandedRecord, setExpandedRecord] = useState(null);
  const [editingRecordId, setEditingRecordId] = useState(null);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    lunchCount: 0,
    dinnerCount: 0,
  });
  const [expenseForm, setExpenseForm] = useState({
    date: new Date().toISOString().split("T")[0],
    amount: "",
    description: "",
    paidBy: "",
  });
  const [personForm, setPersonForm] = useState({
    participant: "",
    date: new Date().toISOString().split("T")[0],
    lunchCount: 0,
    dinnerCount: 0,
    spendAmount: "",
    spendDescription: "",
    includeSpend: false,
  });
  const [bulkForm, setBulkForm] = useState({
    participant: "",
    totalMeals: "",
    lunchCount: 0,
    dinnerCount: 0,
    totalSpend: "",
    description: "",
  });
  const [showOtherPaidBy, setShowOtherPaidBy] = useState(false);
  const [showFinalModal, setShowFinalModal] = useState(false);
  const [finalRows, setFinalRows] = useState([
    { participant: "", bills: [], previousAmountPaid: 0, personalShare: 0, balance: 0, balanceType: "owed" },
  ]);
  const [editingFinalId, setEditingFinalId] = useState(null);
  const [notification, setNotification] = useState(null);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 2000);
  };

  useEffect(() => {
    loadMealDetails();
  }, [id]);

  const loadMealDetails = async () => {
    try {
      const { data } = await API.get(`/meals/${id}`);
      

      // backend returns { meal, records, expenses, settlements }
      if (data && data.meal) {
        setMeal({ ...data.meal, records: data.records || [], expenses: data.expenses || [], settlements: data.settlements || [], finalSettlements: data.finalSettlements || [] });
      } else {
        setMeal(data);
      }
    } catch (err) {
      console.error("Failed to load meal details:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatPaidBy = (paidBy) => {
    if (!paidBy) return "-";
    if (typeof paidBy === "string") return paidBy;
    if (paidBy.name) return paidBy.name;
    if (paidBy.email) return paidBy.email;
    return "-";
  };

  const toggleExpand = (id) => setExpandedRecord(prev => (prev === id ? null : id));

  const handleAddExpense = async (e) => {
    e.preventDefault();
    // client-side validation
    if (!expenseForm.description || expenseForm.description.trim() === "") {
      return alert("Please enter a description for the expense.");
    }
    const amountVal = parseFloat(expenseForm.amount);
    if (isNaN(amountVal) || amountVal <= 0) {
      return alert("Please enter a valid amount greater than 0.");
    }

    try {
      // normalize paidBy to object { name, email } so backend schema matches
      const pbRaw = expenseForm.paidBy;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      let paidByPayload = { name: "", email: "" };
      if (pbRaw && typeof pbRaw === "object") {
        paidByPayload = { name: pbRaw.name || "", email: pbRaw.email || "" };
      } else {
        const pb = (pbRaw || "").toString().trim();
        if (emailRegex.test(pb)) {
          paidByPayload = { name: pb.split("@")[0], email: pb };
        } else {
          paidByPayload = { name: pb, email: "" };
        }
      }

      if (editingExpenseId) {
        // Update expense
        await API.put(`/meals/expenses/${editingExpenseId}`, {
          date: expenseForm.date,
          amount: amountVal,
          description: expenseForm.description,
          paidBy: paidByPayload,
        });
        setEditingExpenseId(null);
      } else {
        // Add new expense
        await API.post(`/meals/${id}/expenses`, {
          mealId: id,
          date: expenseForm.date,
          amount: amountVal,
          description: expenseForm.description,
          paidBy: paidByPayload,
        });
      }

      loadMealDetails();
      setShowAddExpense(false);
      setExpenseForm({
        date: new Date().toISOString().split("T")[0],
        amount: "",
        description: "",
        paidBy: "",
      });
      showNotification('Expense saved', 'success');
    } catch (err) {
      console.error("Add expense error:", err, err.response?.data);
      const serverMsg = err.response?.data?.message || JSON.stringify(err.response?.data) || err.message;
      alert("Failed to add expense: " + serverMsg);
    }
  };

  const handleEditExpense = (expense) => {
    setEditingExpenseId(expense._id);
    setExpenseForm({
      date: expense.date?.split("T")[0] || "",
      amount: expense.amount?.toString() || "",
      description: expense.description || "",
      paidBy: expense.paidBy?.name || expense.paidBy?.email || "",
    });
    setShowAddExpense(true);
  };

  const handleBulkAdd = async (e) => {
    e.preventDefault();
    try {
      if (!bulkForm.participant) return alert("Select a participant");
      const lunchCount = Number(bulkForm.lunchCount || 0);
      const dinnerCount = Number(bulkForm.dinnerCount || 0);
      const totalMeals = lunchCount + dinnerCount;
      if (totalMeals <= 0) return alert("Enter at least one lunch or dinner count");

      const participantValue = bulkForm.participant;
      const participant = meal.participants.find((p) => p.email === participantValue || p.name === participantValue) || { name: participantValue, email: "" };

      const payload = {
        participant: { name: participant.name || "", email: participant.email || "" },
        lunchCount: lunchCount,
        dinnerCount: dinnerCount,
        totalMeals: totalMeals,
        totalSpend: bulkForm.totalSpend ? Number(bulkForm.totalSpend) : 0,
        description: bulkForm.description || "",
      };

      await API.post(`/meals/${id}/bulk-add`, payload);
      loadMealDetails();
      setShowBulkAdd(false);
      setBulkForm({ participant: "", lunchCount: 0, dinnerCount: 0, totalMeals: "", totalSpend: "", description: "" });
      showNotification('Bulk data added', 'success');
    } catch (err) {
      console.error("Bulk add error:", err);
      alert("Failed to add bulk data: " + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    if (window.confirm("Delete this expense?")) {
      try {
        await API.delete(`/meals/expenses/${expenseId}`);
        loadMealDetails();
      } catch (err) {
        alert("Failed to delete expense");
      }
    }
  };

  const handleAddPersonRecord = async (e) => {
    e.preventDefault();
    try {
      if (!personForm.participant) return alert("Select a participant");
      const participantValue = personForm.participant;
      const participant = meal.participants.find((p) => p.email === participantValue || p.name === participantValue) || { name: participantValue, email: "" };

      const payload = {
        date: personForm.date,
        participant: { name: participant.name || "", email: participant.email || "" },
        lunchCount: Number(personForm.lunchCount || 0),
        dinnerCount: Number(personForm.dinnerCount || 0),
      };

      if (personForm.includeSpend && personForm.spendAmount && Number(personForm.spendAmount) > 0) {
        payload.spend = { amount: Number(personForm.spendAmount), description: personForm.spendDescription || "" };
      }

      const resp = await API.post(`/meals/${id}/person-record`, payload);
      // refresh
      loadMealDetails();
      setShowAddPersonRecord(false);
      setPersonForm({ participant: "", date: new Date().toISOString().split("T")[0], lunchCount: 0, dinnerCount: 0, spendAmount: "", spendDescription: "", includeSpend: false });
      showNotification('Meal recorded', 'success');
    } catch (err) {
      console.error("Add person record error:", err, err.response?.data);
      alert(err.response?.data?.message || "Failed to add person record");
    }
  };

  const handleEditRecord = async (e) => {
    e.preventDefault();
    try {
      if (!formData.date) return alert("Select a date");

      const payload = {
        date: formData.date,
        lunchCount: Number(formData.lunchCount || 0),
        dinnerCount: Number(formData.dinnerCount || 0),
      };

      await API.put(`/meals/records/${editingRecordId}`, payload);
      loadMealDetails();
      setEditingRecordId(null);
      setFormData({ date: new Date().toISOString().split("T")[0], lunchCount: 0, dinnerCount: 0 });
      showNotification('Record updated', 'success');
    } catch (err) {
      console.error("Edit record error:", err, err.response?.data);
      alert(err.response?.data?.message || "Failed to update record");
    }
  };

  const handleCalculateSettlement = async () => {
    try {
      await API.post(`/meals/${id}/settlement`, { mealId: id });
      loadMealDetails();
      showNotification('Settlement calculated', 'success');
    } catch (err) {
      alert(err.response?.data?.message || "Failed to calculate settlement");
    }
  };

  if (loading) return <div className="loading">Loading meal details...</div>;
  if (!meal) return <div className="loading">Meal not found</div>;

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthYear = `${monthNames[meal.month - 1]} ${meal.year}`;

  return (
    <div className="meal-details-container">
      {notification && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          backgroundColor: notification.type === 'success' ? '#4caf50' : '#f44336',
          color: 'white',
          padding: '12px 20px',
          borderRadius: '4px',
          zIndex: 9999,
          animation: 'slideIn 0.3s ease-in'
        }}>
          {notification.message}
        </div>
      )}
      <button className="back-btn" onClick={() => navigate("/meals")}>
        ← Back to Meals
      </button>

      <div className="meal-details-header">
        <div>
          <h1>🍽️ {monthYear}</h1>
          <p className="header-info">
            👥 Total Persons: {meal.totalPersons ?? 0} | 📝 Participants: {meal.participants?.length ?? 0}
          </p>
        </div>
      </div>

      <div className="meal-tabs">
        <button
          className={`tab-btn ${activeTab === "records" ? "active" : ""}`}
          onClick={() => setActiveTab("records")}
        >
          📅 Daily Records
        </button>
        <button
          className={`tab-btn ${activeTab === "expenses" ? "active" : ""}`}
          onClick={() => setActiveTab("expenses")}
        >
          💰 Expenses
        </button>
        <button
          className={`tab-btn ${activeTab === "settlement" ? "active" : ""}`}
          onClick={() => setActiveTab("settlement")}
        >
          📊 Settlement
        </button>
        <button
          className={`tab-btn ${activeTab === "final" ? "active" : ""}`}
          onClick={() => setActiveTab("final")}
        >
          🧾 Final Settlement
        </button>
      </div>

      {activeTab === "records" && (
        <div className="tab-content">
          <div className="tab-header">
            <h3>Daily Meal Records</h3>
            <div style={{display:'flex', gap:8}}>
              <button
                className="add-btn"
                onClick={() => setShowBulkAdd(!showBulkAdd)}
                title="Add total meals and spend at once (catch-up)"
              >
                {showBulkAdd ? "✕ Cancel" : "📊 Bulk Add"}
              </button>
              <button
                className="add-btn"
                onClick={() => setShowAddPersonRecord(!showAddPersonRecord)}
              >
                {showAddPersonRecord ? "✕ Cancel" : "➕ Log Meal"}
              </button>
            </div>
          </div>

          {showBulkAdd && (
            <div className="modal-overlay" onClick={() => setShowBulkAdd(false)}>
              <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h3>📊 Bulk Add - Catch Up Missed Days</h3>
                  <button className="modal-close" onClick={() => setShowBulkAdd(false)}>✕</button>
                </div>

                <form className="meal-form modal-body" onSubmit={handleBulkAdd}>
                  <p style={{color:'#666', fontSize:'0.9rem', marginBottom:'15px'}}>
                    Add total meals consumed and total amount spent by a person all at once.
                  </p>
                  
                  <div className="form-row">
                    <div>
                      <label>Participant *</label>
                      <select
                        value={bulkForm.participant}
                        onChange={(e) => setBulkForm({ ...bulkForm, participant: e.target.value })}
                        required
                      >
                        <option value="">Select participant</option>
                        {meal.participants && meal.participants.map((p, idx) => (
                          <option key={idx} value={p.email || p.name}>{p.name || p.email}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label>Lunch Count</label>
                      <input 
                        type="number" 
                        placeholder="Number of lunches" 
                        value={bulkForm.lunchCount}
                        onChange={(e) => setBulkForm({ ...bulkForm, lunchCount: e.target.value })}
                        min="0"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div>
                      <label>Dinner Count</label>
                      <input 
                        type="number" 
                        placeholder="Number of dinners" 
                        value={bulkForm.dinnerCount}
                        onChange={(e) => setBulkForm({ ...bulkForm, dinnerCount: e.target.value })}
                        min="0"
                      />
                    </div>
                    <div>
                      <label>Total Spend (Optional)</label>
                      <input 
                        type="number" 
                        placeholder="Total amount spent" 
                        step="0.01"
                        value={bulkForm.totalSpend}
                        onChange={(e) => setBulkForm({ ...bulkForm, totalSpend: e.target.value })}
                      />
                    </div>
                    <div>
                      <label>Description (Optional)</label>
                      <input 
                        type="text" 
                        placeholder="e.g., Missed 5 days" 
                        value={bulkForm.description}
                        onChange={(e) => setBulkForm({ ...bulkForm, description: e.target.value })}
                      />
                    </div>
                  </div>

                  <button type="submit" className="submit-btn">
                    ✅ Add Bulk Data
                  </button>
                </form>
              </div>
            </div>
          )}

                    {showAddPersonRecord && (
            <div className="modal-overlay" onClick={() => setShowAddPersonRecord(false)}>
              <div className="modal" onClick={(e)=>e.stopPropagation()}>
                <div className="modal-header">
                  <h3>Log Meal</h3>
                  <button className="modal-close" onClick={() => setShowAddPersonRecord(false)}>✕</button>
                </div>

                <form className="meal-form modal-body" onSubmit={handleAddPersonRecord}>
                  <div className="form-row">
                    <div>
                      <label>Participant</label>
                      <select
                        value={personForm.participant}
                        onChange={(e) => setPersonForm({ ...personForm, participant: e.target.value })}
                        required
                      >
                        <option value="">Select participant</option>
                        {meal.participants && meal.participants.map((p, idx) => (
                          <option key={idx} value={p.email || p.name}>{p.name || p.email}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label>Date</label>
                      <input type="date" value={personForm.date} onChange={(e) => setPersonForm({ ...personForm, date: e.target.value })} required />
                    </div>
                  </div>

                  <div className="form-row">
                    <div>
                      <label>Lunch Count</label>
                      <input type="number" min="0" value={personForm.lunchCount} onChange={(e) => setPersonForm({ ...personForm, lunchCount: e.target.value })} />
                    </div>
                    <div>
                      <label>Dinner Count</label>
                      <input type="number" min="0" value={personForm.dinnerCount} onChange={(e) => setPersonForm({ ...personForm, dinnerCount: e.target.value })} />
                    </div>
                  </div>

                  <div style={{ marginTop: 8 }}>
                    <label>
                      <input type="checkbox" checked={personForm.includeSpend} onChange={(e) => setPersonForm({ ...personForm, includeSpend: e.target.checked })} /> Include a spend for this person
                    </label>
                  </div>
                  {personForm.includeSpend && (
                    <div className="form-row">
                      <div>
                        <label>Spend Amount (৳)</label>
                        <input type="number" step="0.01" value={personForm.spendAmount} onChange={(e) => setPersonForm({ ...personForm, spendAmount: e.target.value })} />
                      </div>
                      <div>
                        <label>Spend Description</label>
                        <input type="text" value={personForm.spendDescription} onChange={(e) => setPersonForm({ ...personForm, spendDescription: e.target.value })} />
                      </div>
                    </div>
                  )}

                  {personForm.participant && (
                    <div style={{ marginTop: 12, borderTop: '1px solid #eee', paddingTop: 8 }}>
                      <strong>Previous spends by this participant</strong>
                      <div style={{ marginTop: 8 }}>
                        {meal.expenses && meal.expenses.filter(exp => {
                          const pb = exp.paidBy || {};
                          const part = meal.participants.find(p => (p.email || p.name) === personForm.participant) || { name: personForm.participant, email: '' };
                          return (pb.email && part.email && pb.email === part.email) || (pb.name && part.name && pb.name === part.name);
                        }).length === 0 ? (
                          <div className="empty-message">No previous spends</div>
                        ) : (
                          <table className="mini-table">
                            <thead>
                              <tr><th>Date</th><th>Amount (৳)</th><th>Description</th></tr>
                            </thead>
                            <tbody>
                              {meal.expenses && meal.expenses.filter(exp => {
                                const pb = exp.paidBy || {};
                                const part = meal.participants.find(p => (p.email || p.name) === personForm.participant) || { name: personForm.participant, email: '' };
                                return (pb.email && part.email && pb.email === part.email) || (pb.name && part.name && pb.name === part.name);
                              }).map((exp) => (
                                <tr key={exp._id}>
                                  <td>{new Date(exp.date).toLocaleDateString()}</td>
                                  <td>{exp.amount}</td>
                                  <td>{exp.description}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="modal-footer" style={{display:'flex', gap:8, marginTop:12}}>
                    <button type="button" className="cancel-btn" onClick={() => setShowAddPersonRecord(false)}>Cancel</button>
                    <button type="submit" className="submit-btn">Save</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {editingRecordId && (
            <div className="modal-overlay" onClick={() => {
              setEditingRecordId(null);
              setFormData({ date: new Date().toISOString().split("T")[0], lunchCount: 0, dinnerCount: 0 });
            }}>
              <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h3>✏️ Edit Meal Record</h3>
                  <button className="modal-close" onClick={() => {
                    setEditingRecordId(null);
                    setFormData({ date: new Date().toISOString().split("T")[0], lunchCount: 0, dinnerCount: 0 });
                  }}>✕</button>
                </div>

                <form className="meal-form modal-body" onSubmit={handleEditRecord}>
                  <div className="form-row">
                    <div>
                      <label>Date</label>
                      <input 
                        type="date" 
                        value={formData.date} 
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        required 
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div>
                      <label>Lunch Count</label>
                      <input 
                        type="number" 
                        min="0"
                        value={formData.lunchCount}
                        onChange={(e) => setFormData({ ...formData, lunchCount: e.target.value })}
                      />
                    </div>
                    <div>
                      <label>Dinner Count</label>
                      <input 
                        type="number" 
                        min="0"
                        value={formData.dinnerCount}
                        onChange={(e) => setFormData({ ...formData, dinnerCount: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="modal-footer" style={{display:'flex', gap:8, marginTop:12}}>
                    <button type="button" className="cancel-btn" onClick={() => {
                      setEditingRecordId(null);
                      setFormData({ date: new Date().toISOString().split("T")[0], lunchCount: 0, dinnerCount: 0 });
                    }}>Cancel</button>
                    <button type="submit" className="submit-btn">💾 Save Changes</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {meal.records && meal.records.length > 0 ? (
            <div className="records-grid">
              {meal.records.map((record) => (
                <div className="record-card" key={record._id}>
                  <div className="record-card-header">
                    <div>
                      <div className="record-card-date">{new Date(record.date).toLocaleDateString()}</div>
                      <div className="record-card-day">{new Date(record.date).toLocaleDateString("en-US", { weekday: "long" })}</div>
                    </div>
                    <div style={{display: 'flex', gap: '8px'}}>
                      <button className="edit-icon" title="Edit record" onClick={() => {
                        setEditingRecordId(record._id);
                        setFormData({
                          date: record.date.split('T')[0],
                          lunchCount: record.lunchCount || 0,
                          dinnerCount: record.dinnerCount || 0,
                        });
                      }}>✏️</button>
                      <button className="delete-icon" title="Delete record" onClick={async () => {
                        if (window.confirm('Delete this meal record?')) {
                          try {
                            await API.delete(`/meals/records/${record._id}`);
                            loadMealDetails();
                          } catch (err) {
                            alert('Failed to delete record');
                          }
                        }
                      }}>🗑️</button>
                      <button className="details-btn" onClick={() => toggleExpand(record._id)}>
                        {expandedRecord === record._id ? '✕' : '⋮'}
                      </button>
                    </div>
                  </div>

                  <div className="record-card-body">
                    <div className="meal-item">
                      <div className="meal-icon">🍽️</div>
                      <div className="meal-info">
                        <div className="meal-label">Lunch</div>
                        <div className="meal-count">{record.lunchCount ?? 0}</div>
                      </div>
                    </div>
                    <div className="meal-item">
                      <div className="meal-icon">🍽️</div>
                      <div className="meal-info">
                        <div className="meal-label">Dinner</div>
                        <div className="meal-count">{record.dinnerCount ?? 0}</div>
                      </div>
                    </div>
                    <div className="meal-item total">
                      <div className="meal-info">
                        <div className="meal-label">Total</div>
                        <div className="meal-count total-value">{record.totalMealsCount ?? ((record.lunchCount||0)+(record.dinnerCount||0))}</div>
                      </div>
                    </div>
                  </div>

                  {expandedRecord === record._id && (
                    <div className="record-card-details">
                      {record.entries && record.entries.length > 0 ? (
                        <div className="entries-list">
                          <h4>Person-wise Meals</h4>
                          {record.entries.map((en, i) => {
                            return (
                              <div className="entry-item" key={i}>
                                <div className="entry-name">{(en.participant && (en.participant.name || en.participant.email)) || en.participant || '-'}</div>
                                <div className="entry-counts">
                                  <span>🥘 {en.lunchCount ?? 0}</span>
                                  <span>🍽️ {en.dinnerCount ?? 0}</span>
                                  <span className="entry-total">{en.totalMealsCount ?? ((en.lunchCount||0)+(en.dinnerCount||0))}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="empty-message">
                          No per-person entries for this date.
                          <div style={{marginTop:10}}>
                            <button className="details-btn" onClick={() => { setShowAddPersonRecord(true); setPersonForm(prev=>({ ...prev, date: new Date(record.date).toISOString().split('T')[0] })); }}>Log for this date</button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-message">No records added yet</div>
          )}
        </div>
      )}

      {activeTab === "final" && (
        <div className="tab-content">
          <div className="tab-header">
            <h3>Final Monthly Settlement</h3>
            <div>
              <button
                className="add-btn"
                onClick={() => {
                  // prefill rows with participants and matching settlement values
                  const pre = (meal.participants || []).map((p) => {
                    // Use improved matching logic - match by email first, then by name
                    const match = (meal.settlements || []).find((s) => {
                      if (p.email && s.person?.email) {
                        return s.person.email === p.email;
                      }
                      if (p.name && s.person?.name) {
                        return s.person.name === p.name;
                      }
                      return false;
                    });
                    return {
                      participant: p.email || p.name || "",
                      bills: [],
                      previousAmountPaid: match ? (match.amountPaid || 0) : 0,
                      personalShare: match ? (match.personalShare || 0) : 0,
                      balance: match ? (match.balance || 0) : 0,
                      balanceType: match ? (match.balanceType || "owed") : "owed",
                    };
                  });
                  setFinalRows(pre.length ? pre : [{ participant: "", bills: [], previousAmountPaid: 0, personalShare: 0, balance: 0, balanceType: "owed" }]);
                  setShowFinalModal(true);
                }}
              >
                ➕ Add Final Bills
              </button>
            </div>
          </div>

          {meal.finalSettlements && meal.finalSettlements.length > 0 ? (
            <div className="settlement-grid">
              {meal.finalSettlements.map((finalSettlement) => (
                <div className="settlement-card" key={finalSettlement._id}>
                  <div className="settlement-person">
                    {finalSettlement.person?.name || finalSettlement.person?.email || "-"}
                  </div>
                  <div className="settlement-metrics">
                    <div className="metric">
                      <div className="metric-label">Previous Paid</div>
                      <div className="metric-value">৳{(finalSettlement.previousAmountPaid ?? 0).toFixed(2)}</div>
                    </div>
                    <div className="metric">
                      <div className="metric-label">Personal Share</div>
                      <div className="metric-value">৳{(finalSettlement.personalShare ?? 0).toFixed(2)}</div>
                    </div>
                    <div className="metric">
                      <div className="metric-label">Meal Balance</div>
                      {(() => {
                        const msType = finalSettlement.mealSettlementBalanceType || finalSettlement.balanceType;
                        const msValue = finalSettlement.mealSettlementBalance ?? finalSettlement.balance ?? 0;
                        return (
                          <div className="metric-value" style={{ color: msType === 'owed' ? '#388e3c' : '#d32f2f' }}>
                            {msType === 'owed' ? '🟢' : '🔴'} ৳{Math.abs(msValue).toFixed(2)}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                  {finalSettlement.bills && finalSettlement.bills.length > 0 && (
                    <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid #eee" }}>
                      <strong style={{ fontSize: "0.9rem" }}>Bills</strong>
                      <div style={{ marginTop: "8px" }}>
                        {finalSettlement.bills.map((bill, idx) => (
                          <div key={idx} style={{ fontSize: "0.85rem", marginBottom: "4px", color: "#666" }}>
                            {bill.billType || "-"}: ৳{(bill.amount ?? 0).toFixed(2)}
                          </div>
                        ))}
                      </div>
                      <div style={{ marginTop: "8px", paddingTop: "8px", borderTop: "1px solid #f0f0f0", fontWeight: 700 }}>
                        Total Bills: ৳{(finalSettlement.totalBills ?? 0).toFixed(2)}
                      </div>
                    </div>
                  )}
                  <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid #eee" }}>
                    <div style={{ fontSize: "0.9rem", color: "#666" }}>Final Amount to Settle</div>
                    <div style={{ fontSize: "1.3rem", fontWeight: 700, color: finalSettlement.finalType === 'Needs to Pay' ? '#d32f2f' : '#388e3c', marginTop: "4px" }}>
                      {finalSettlement.finalType === 'Needs to Pay' ? '🔴' : '🟢'} ৳{(finalSettlement.finalBalance ?? 0).toFixed(2)}
                    </div>
                    <div style={{ fontSize: "0.85rem", color: "#999", marginTop: "2px" }}>{finalSettlement.finalType}</div>
                  </div>
                  <div style={{ marginTop: "12px", display: 'flex', gap: '8px' }}>
                    <button 
                      type="button"
                      className="edit-icon"
                      onClick={() => {
                        setEditingFinalId(finalSettlement._id);
                        setFinalRows([{
                          participant: finalSettlement.person?.email || finalSettlement.person?.name || "",
                          bills: finalSettlement.bills || [],
                          previousAmountPaid: finalSettlement.previousAmountPaid || 0,
                            personalShare: finalSettlement.personalShare || 0,
                            balance: finalSettlement.mealSettlementBalance ?? finalSettlement.balance ?? 0,
                            balanceType: finalSettlement.mealSettlementBalanceType || finalSettlement.balanceType || "owed"
                        }]);
                        setShowFinalModal(true);
                      }}
                      title="Edit bills for this person"
                      style={{ padding: '8px 12px', borderRadius: '4px', border: 'none', backgroundColor: '#667eea', color: 'white', cursor: 'pointer' }}
                    >
                      ✏️ Edit Bills
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-message">No final settlement entries yet. Add final bills to compute final balances.</div>
          )}

          {showFinalModal && (
            <div className="modal-overlay" onClick={() => {
              setShowFinalModal(false);
              setEditingFinalId(null);
            }}>
              <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h3>{editingFinalId ? "Edit Bills for " + (finalRows[0]?.participant || "Participant") : "Add Final Bills"}</h3>
                  <button className="modal-close" aria-label="Close edit modal" title="Close" onClick={() => {
                    setShowFinalModal(false);
                    setEditingFinalId(null);
                  }}>✕</button>
                </div>
                <form className="modal-body" onSubmit={async (e) => {
                  e.preventDefault();
                  try {
                    if (editingFinalId) {
                      // editing single final entry
                      const row = finalRows[0];
                      if (!row || !row.participant) {
                        showNotification('Please select a participant', 'error');
                        return;
                      }
                      
                      const billsToSend = row.bills || [];
                      await API.put(`/meals/final-settlement/${editingFinalId}`, { 
                        bills: billsToSend
                      });
                      showNotification('Bills updated successfully', 'success');
                      setEditingFinalId(null);
                      setShowFinalModal(false);
                      setFinalRows([{ participant: "", bills: [], previousAmountPaid: 0, personalShare: 0, balance: 0, balanceType: "owed" }]);
                      loadMealDetails();
                    } else {
                      // prepare entries for new insert - include all selected participants even without bills
                      const entries = finalRows
                        .filter(r => r.participant)  // Only filter by participant, not by bills
                        .map(r => {
                          const p = meal.participants.find(p => p.email === r.participant || p.name === r.participant) || { name: r.participant, email: "" };
                          return { 
                            person: { name: p.name || "", email: p.email || "" }, 
                            bills: r.bills || []
                          };
                        });

                      console.log('Sending entries:', entries);
                      if (!entries.length) {
                        showNotification('Please select at least one participant', 'error');
                        return;
                      }

                      await API.post(`/meals/${id}/final-settlement`, { entries });
                      setShowFinalModal(false);
                      setFinalRows([{ participant: "", bills: [], previousAmountPaid: 0, personalShare: 0, balance: 0, balanceType: "owed" }]);
                      loadMealDetails();
                      showNotification(`Final settlement saved for ${entries.length} participant(s)`, 'success');
                    }
                  } catch (err) {
                    console.error('Settlement form error:', err);
                    showNotification(err.response?.data?.message || 'Failed to save bills. Please check bills have amounts and try again.', 'error');
                  }
                }}>
                  <div style={{display:'grid', gap:10, maxHeight: '70vh', overflowY: 'auto'}}>
                    {finalRows.map((row, idx) => (
                      <div key={idx} style={{padding: '12px', border: '1px solid #e0e0e0', borderRadius: '6px', backgroundColor: '#fafafa'}}>
                        <div style={{display:'flex', gap:8, marginBottom: '12px'}}>
                          {editingFinalId ? (
                            <div style={{flex:2, padding: '8px', border: '1px solid #eee', borderRadius: '4px', backgroundColor: '#fafafa', display: 'flex', alignItems: 'center'}}>
                              {
                                (meal.participants?.find(p => p.email === row.participant || p.name === row.participant)) ? (
                                  (() => {
                                    const p = meal.participants.find(pp => pp.email === row.participant || pp.name === row.participant);
                                    return (
                                      <div style={{display:'flex', flexDirection:'column'}}>
                                        <div style={{fontWeight:700, display:'flex', gap:8, alignItems:'center'}}>
                                          <span title="Participant is locked" style={{fontSize:'0.95rem'}}>🔒</span>
                                          <span>{p.name || p.email}</span>
                                        </div>
                                        {p.email ? <div style={{fontSize:'0.85rem', color:'#666'}}>{p.email}</div> : null}
                                      </div>
                                    );
                                  })()
                                ) : (
                                  <div style={{fontWeight:700}}>{row.participant || "Participant"}</div>
                                )
                              }
                            </div>
                          ) : (
                            <select value={row.participant} onChange={(e) => { 
                              const v = e.target.value; 
                              setFinalRows(prev => {
                                const next = [...prev]; 
                                next[idx].participant = v; 
                                // Get settlement data from meal.settlements - improved matching
                                const selectedParticipant = meal.participants?.find(p => (p.email === v || p.name === v));
                                const match = (meal.settlements || []).find((s) => {
                                  if (selectedParticipant?.email && s.person?.email) {
                                    return s.person.email === selectedParticipant.email;
                                  }
                                  if (selectedParticipant?.name && s.person?.name) {
                                    return s.person.name === selectedParticipant.name;
                                  }
                                  return false;
                                });
                                if (match) {
                                  next[idx].previousAmountPaid = match.amountPaid || 0;
                                  next[idx].personalShare = match.personalShare || 0;
                                  next[idx].balance = match.balance || 0;
                                  next[idx].balanceType = match.balanceType || "owed";
                                } else {
                                  next[idx].previousAmountPaid = 0;
                                  next[idx].personalShare = 0;
                                  next[idx].balance = 0;
                                  next[idx].balanceType = "owed";
                                }
                                return next; 
                              }); 
                            }} required style={{flex:2, padding: '8px', border: '1px solid #ddd', borderRadius: '4px'}}>
                              <option value="">Select participant</option>
                              {meal.participants && meal.participants.map((p,i)=> <option key={i} value={p.email || p.name}>{p.name || p.email}</option>)}
                            </select>
                          )}
                          {finalRows.length > 1 && idx >= (meal.participants?.length || 0) ? (
                            <button type="button" onClick={()=>{ setFinalRows(prev=> prev.filter((_,i)=>i!==idx)); }} className="delete-icon" style={{padding: '6px 8px'}}>🗑️</button>
                          ) : (
                            <div style={{width: '32px'}}></div>
                          )}
                        </div>

                        <div style={{display:'flex', gap:12, marginBottom:8}}>
                          <div style={{flex:1}}>
                            <div style={{fontSize:'12px', color:'#666'}}>Previous Paid</div>
                            <div style={{fontWeight:700}}>৳{(row.previousAmountPaid ?? 0).toFixed(2)}</div>
                          </div>
                          <div style={{flex:1}}>
                            <div style={{fontSize:'12px', color:'#666'}}>Personal Share</div>
                            <div style={{fontWeight:700}}>৳{(row.personalShare ?? 0).toFixed(2)}</div>
                          </div>
                          <div style={{flex:1}}>
                            <div style={{fontSize:'12px', color:'#666'}}>Meal Settlement Balance</div>
                            <div style={{fontWeight:700, color: row.balanceType === 'owes' ? '#d32f2f' : '#388e3c'}}>
                              {row.balanceType === 'owes' ? '🔴' : '🟢'} ৳{Math.abs(row.balance ?? 0).toFixed(2)}
                            </div>
                          </div>
                        </div>

                        <FinalSettlementBills 
                          bills={row.bills || []} 
                          onBillsChange={(bills) => {
                            setFinalRows(prev => {
                              const next = [...prev];
                              next[idx].bills = bills;
                              return next;
                            });
                          }}
                        />
                      </div>
                    ))}
                    <div style={{display:'flex', gap:8}}>
                      {!editingFinalId && (
                        <button type="button" className="add-btn" onClick={()=>setFinalRows(prev=>[...prev, { participant:'', bills: [], previousAmountPaid: 0, personalShare: 0, balance: 0, balanceType: "owed" }])}>➕ Add Row</button>
                      )}
                      <button type="submit" className="submit-btn">
                        {editingFinalId ? "💾 Update Bills" : `Save Final Settlement (${finalRows.filter(r => r.participant).length} participants)`}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "expenses" && (
        <div className="tab-content">
          <div className="tab-header">
            <h3>Bazar & Expenses</h3>
            <button
              className="add-btn"
              onClick={() => setShowAddExpense(!showAddExpense)}
            >
              {showAddExpense ? "✕ Cancel" : "➕ Add Expense"}
            </button>
          </div>

          {showAddExpense && (
            <form className="meal-form" onSubmit={handleAddExpense}>
              <input
                type="date"
                value={expenseForm.date}
                onChange={(e) =>
                  setExpenseForm({ ...expenseForm, date: e.target.value })
                }
                required
              />
              <input
                type="text"
                placeholder="Description (e.g., Grocery, Vegetables)"
                value={expenseForm.description}
                onChange={(e) =>
                  setExpenseForm({ ...expenseForm, description: e.target.value })
                }
                required
              />
              <input
                type="number"
                placeholder="Amount"
                step="0.01"
                value={expenseForm.amount}
                onChange={(e) =>
                  setExpenseForm({ ...expenseForm, amount: e.target.value })
                }
                required
              />
              {meal.participants && meal.participants.length > 0 ? (
                <>
                  <label>Paid By</label>
                  <select
                    value={
                      typeof expenseForm.paidBy === "object"
                        ? expenseForm.paidBy.email || expenseForm.paidBy.name
                        : expenseForm.paidBy
                    }
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "") {
                        setShowOtherPaidBy(false);
                        setExpenseForm({ ...expenseForm, paidBy: "" });
                        return;
                      }
                      if (val === "__other__") {
                        setShowOtherPaidBy(true);
                        setExpenseForm({ ...expenseForm, paidBy: "" });
                        return;
                      }
                      setShowOtherPaidBy(false);
                      const participant = meal.participants.find(
                        (p) => p.email === val || p.name === val
                      );
                      if (participant) setExpenseForm({ ...expenseForm, paidBy: participant });
                      else setExpenseForm({ ...expenseForm, paidBy: val });
                    }}
                    required
                  >
                    <option value="">Select participant</option>
                    {meal.participants.map((p, idx) => (
                      <option key={idx} value={p.email || p.name}>
                        {p.name || p.email}
                      </option>
                    ))}
                    <option value="__other__">Other (enter name or email)</option>
                  </select>
                </>
              ) : (
                <input
                  type="text"
                  placeholder="Paid By (Name or Email)"
                  value={expenseForm.paidBy}
                  onChange={(e) =>
                    setExpenseForm({ ...expenseForm, paidBy: e.target.value })
                  }
                  required
                />
              )}

              {showOtherPaidBy && (
                <input
                  type="text"
                  placeholder="Enter name or email"
                  value={typeof expenseForm.paidBy === "string" ? expenseForm.paidBy : ""}
                  onChange={(e) => setExpenseForm({ ...expenseForm, paidBy: e.target.value })}
                  required
                />
              )}
              <button type="submit" className="submit-btn">
                {editingExpenseId ? "✏️ Update Expense" : "➕ Add Expense"}
              </button>
            </form>
          )}

          {meal.expenses && meal.expenses.length > 0 ? (
            <div className="expenses-table">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Amount</th>
                    <th>Paid By</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {meal.expenses.map((exp) => (
                    <tr key={exp._id}>
                      <td>{new Date(exp.date).toLocaleDateString()}</td>
                      <td>{exp.description}</td>
                      <td className="amount">৳{(exp.amount ?? 0).toFixed(2)}</td>
                      <td className="paid-by">
                        <div>{formatPaidBy(exp.paidBy)}</div>
                        {exp.paidBy && typeof exp.paidBy === 'object' && exp.paidBy.email ? (
                          <div style={{marginTop:6, color:'#999', fontSize:'0.85rem'}}>
                            <small>{exp.paidBy.email}</small>
                          </div>
                        ) : null}
                      </td>
                      <td>
                        <button
                          className="edit-icon"
                          onClick={() => handleEditExpense(exp)}
                          title="Edit expense"
                        >
                          ✏️
                        </button>
                        <button
                          className="delete-icon"
                          onClick={() => handleDeleteExpense(exp._id)}
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="total-expense">
                Total Bazar: ৳
                {((meal.expenses || []).reduce((sum, exp) => sum + (exp.amount || 0), 0)).toFixed(2)}
              </div>
            </div>
          ) : (
            <div className="empty-message">No expenses recorded yet</div>
          )}
        </div>
      )}

      {activeTab === "settlement" && (
        <div className="tab-content">
          <div className="tab-header">
            <h3>Meal Settlement Details</h3>
            <button className="calculate-btn" onClick={handleCalculateSettlement}>
              🔄 Recalculate Settlement
            </button>
          </div>

          {meal.settlements && meal.settlements.length > 0 ? (
            <div className="settlement-grid">
              {meal.settlements.map((settlement) => (
                <div className={`settlement-card ${settlement.balanceType === "owes" ? "owes" : "owed"}`} key={settlement._id}>
                  <div className="settlement-person">
                    {settlement.person?.name || settlement.person?.email || "-"}
                  </div>

                  <div className="settlement-metrics">
                    <div className="metric">
                      <div className="metric-label">Total Meals</div>
                      <div className="metric-value">{settlement.totalMealsCount ?? 0}</div>
                    </div>
                    <div className="metric">
                      <div className="metric-label">Per Meal</div>
                      <div className="metric-value">৳{(settlement.perMealCost ?? 0).toFixed(2)}</div>
                    </div>
                    <div className="metric">
                      <div className="metric-label">Personal Share</div>
                      <div className="metric-value">৳{(settlement.personalShare ?? 0).toFixed(2)}</div>
                    </div>
                  </div>

                  <div className="settlement-payment">
                    <div className="payment-row">
                      <span>Amount Paid</span>
                      <span className="amount-paid">৳{(settlement.amountPaid ?? 0).toFixed(2)}</span>
                    </div>
                  </div>

                  <div className={`settlement-balance ${settlement.balanceType === "owes" ? "owes" : "owed"}`}>
                    <div className="balance-icon">{settlement.balanceType === "owes" ? "🔴" : "🟢"}</div>
                    <div>
                      <div className="balance-amount">৳{Math.abs(settlement.balance ?? 0).toFixed(2)}</div>
                      <div className="balance-label">{settlement.balanceType === "owes" ? "Needs to Pay" : "To Receive"}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-message">
              No settlement yet. Calculate settlement after adding records and expenses.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MealDetails;
