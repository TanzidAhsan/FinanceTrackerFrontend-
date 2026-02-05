import React, { useState } from "react";
import "../styles/final-settlement-bills.css";

const BILL_TYPES = [
  { value: "rent", label: "🏠 Rent" },
  { value: "gas", label: "🔥 Gas Bill" },
  { value: "electricity", label: "⚡ Electricity Bill" },
  { value: "wifi", label: "📶 Wifi Bill" },
  { value: "housemaid", label: "🧹 House Maid" },
];

export default function FinalSettlementBills({ bills, onBillsChange }) {
  const [customName, setCustomName] = useState("");

  // Get existing bills by type or create empty placeholder
  const getBillByType = (billType) => {
    return bills.find(b => b.billType === billType) || { billType, amount: "", description: "" };
  };

  const handleBillChange = (billType, field, value) => {
    const existingIndex = bills.findIndex(b => b.billType === billType);
    const updated = [...bills];
    
    if (existingIndex >= 0) {
      // Update existing
      updated[existingIndex] = { ...updated[existingIndex], [field]: value };
    } else if (field === "amount" && value) {
      // Create new only if amount is entered
      updated.push({ billType, amount: value, description: "" });
    }
    
    onBillsChange(updated);
  };

  const handleRemoveBill = (billType) => {
    onBillsChange(bills.filter(b => b.billType !== billType));
  };

  const handleAddCustomBill = () => {
    if (!customName.trim()) return;
    const customType = "custom_" + Date.now();
    onBillsChange([...bills, { billType: customType, customName, amount: "", description: "" }]);
    setCustomName("");
  };

  const totalBills = bills.reduce((sum, bill) => sum + Number(bill.amount || 0), 0);
  const customBills = bills.filter(b => b.billType.startsWith("custom_"));

  // Get all bill types to display (predefined + custom)
  const allBillTypes = [
    ...BILL_TYPES,
    ...customBills.map(cb => ({ value: cb.billType, label: cb.customName }))
  ];

  return (
    <div className="bills-container">
      <div className="bills-header">
        <h4>📋 Bills & Expenses - Quick Entry</h4>
      </div>
      <div className="bills-note" style={{fontSize:'0.85rem', color:'#555', marginBottom:10}}>Amounts update total automatically. Use Tab/Enter to move between fields.</div>

      <div className="bills-grid">
        {allBillTypes.map((type) => {
          const bill = getBillByType(type.value);
          const hasBill = bill.amount && Number(bill.amount) > 0;
          const isCustom = type.value.startsWith("custom_");

          return (
            <div key={type.value} className="bill-card" style={{
              padding: '12px',
              border: hasBill ? '2px solid #4caf50' : '1px solid #ddd',
              borderRadius: '6px',
              backgroundColor: hasBill ? '#f1f8f4' : '#fafafa',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#333' }}>
                {type.label}
              </div>
              
              <input
                className="bill-amount-input"
                name={`amount_${type.value}`}
                type="number"
                step="0.01"
                min="0"
                placeholder="Amount"
                aria-label={`${type.label} amount`}
                title={`Enter amount for ${type.label}`}
                value={bill.amount}
                onChange={(e) => handleBillChange(type.value, "amount", e.target.value)}
                style={{
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '1rem',
                  fontWeight: 600
                }}
              />

              {hasBill && (
                <div style={{ fontSize: '0.85rem', color: '#4caf50', fontWeight: 700 }}>
                  ✓ ৳{Number(bill.amount).toFixed(2)}
                </div>
              )}

              {hasBill && (
                <button
                  type="button"
                  className="bill-remove-btn"
                  onClick={() => handleRemoveBill(type.value)}
                  aria-label={`Remove ${type.label}`}
                  title={`Remove ${type.label}`}
                  style={{
                    padding: '6px',
                    background: '#ffebee',
                    border: '1px solid #ffcdd2',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    color: '#d32f2f',
                    fontSize: '0.85rem'
                  }}
                >
                  Remove
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Custom Bill Input */}
      <div style={{
        marginTop: '16px',
        padding: '12px',
        backgroundColor: '#f5f5f5',
        borderRadius: '6px',
        border: '1px dashed #bbb',
        display: 'flex',
        gap: '8px'
      }}>
        <input
          type="text"
          placeholder="Add custom bill (e.g., Water, Internet)"
          value={customName}
          onChange={(e) => setCustomName(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleAddCustomBill()}
          style={{
            flex: 1,
            padding: '8px 12px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '0.9rem'
          }}
        />
        <button
          type="button"
          onClick={handleAddCustomBill}
          disabled={!customName.trim()}
          style={{
            padding: '8px 16px',
            backgroundColor: customName.trim() ? '#667eea' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: customName.trim() ? 'pointer' : 'not-allowed',
            fontWeight: 600,
            fontSize: '0.9rem'
          }}
        >
          ➕ Add
        </button>
      </div>

      {bills.length > 0 && (
        <div className="bills-total" style={{
          marginTop: '12px',
          padding: '12px',
          backgroundColor: '#e8f5e9',
          borderRadius: '6px',
          textAlign: 'center',
          fontSize: '1.1rem',
          fontWeight: 700,
          color: '#2e7d32'
        }}>
          Total Bills: ৳{totalBills.toFixed(2)}
        </div>
      )}

      {customBills.some(b => !b.amount || Number(b.amount) === 0) && (
        <div style={{
          marginTop: '12px',
          padding: '10px',
          backgroundColor: '#fff3e0',
          border: '1px solid #ffb74d',
          borderRadius: '6px',
          fontSize: '0.85rem',
          color: '#e65100'
        }}>
          ⚠️ Custom bills without amounts will be ignored
        </div>
      )}
    </div>
  );
}
