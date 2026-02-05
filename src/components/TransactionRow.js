import { useState } from "react";
import EditTransaction from "./EditTransaction";

const TransactionRow = ({ t, onDelete, onUpdate }) => {
  const [isEditOpen, setIsEditOpen] = useState(false);

  return (
    <>
      <tr>
        <td>
          <span className="category-badge">{t.category}</span>
        </td>
        <td>
          <span className={`type-badge ${t.type}`}>
            {t.type === "income" ? "📈 Income" : "📉 Expense"}
          </span>
        </td>
        <td>
          <span className={`amount ${t.type}`}>
            {t.type === "income" ? "+" : "-"}৳ {t.amount}
          </span>
        </td>
        <td>{new Date(t.date).toLocaleDateString()}</td>
        <td className="actions-cell">
          <button
            className="action-btn edit-btn"
            onClick={() => setIsEditOpen(true)}
            title="Edit transaction"
          >
            ✏️
          </button>
          <button
            className="action-btn delete-btn"
            onClick={() => onDelete(t._id)}
            title="Delete transaction"
          >
            🗑️
          </button>
        </td>
      </tr>

      {isEditOpen && (
        <EditTransaction
          transaction={t}
          onTransactionUpdated={onUpdate}
          onClose={() => setIsEditOpen(false)}
        />
      )}
    </>
  );
};

export default TransactionRow;
