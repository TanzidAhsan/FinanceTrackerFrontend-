import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/api";
import "../styles/meals.css";

const Meals = () => {
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);
  const navigate = useNavigate();

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const showConfirmation = (title, message, onConfirm, onCancel = null) => {
    setConfirmModal({
      title,
      message,
      onConfirm: async () => {
        setConfirmModal(null);
        await onConfirm();
      },
      onCancel: () => {
        setConfirmModal(null);
        if (onCancel) onCancel();
      }
    });
  };

  useEffect(() => {
    loadMeals();
  }, []);

  const loadMeals = async () => {
    try {
      const { data } = await API.get("/meals");
      setMeals(data);
    } catch (err) {
      console.error("Failed to load meals:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    showConfirmation(
      'Delete Meal System',
      'Are you sure you want to delete this meal system? This cannot be undone.',
      async () => {
        try {
          await API.delete(`/meals/${id}`);
          loadMeals();
          showNotification('Meal system deleted successfully', 'success');
        } catch (err) {
          console.error("Failed to delete meal:", err);
          showNotification('Failed to delete meal system', 'error');
        }
      }
    );
  };

  const handleReactivate = async (id) => {
    showConfirmation(
      'Reactivate Month',
      'Reactivate this closed month and make it active again? This will close any other active months.',
      async () => {
        try {
          await API.put(`/meals/${id}/reactivate`);
          loadMeals();
          showNotification('Month reactivated successfully', 'success');
        } catch (err) {
          console.error('Failed to reactivate meal:', err);
          showNotification('Could not reactivate month', 'error');
        }
      }
    );
  };

  const handleClearHistory = async (id) => {
    showConfirmation(
      'Clear History',
      'This will delete all records, expenses and settlements for this month. The meal itself will remain. Continue?',
      async () => {
        try {
          await API.put(`/meals/${id}/clear-history`);
          loadMeals();
          showNotification('History cleared successfully for this month', 'success');
        } catch (err) {
          console.error('Failed to clear history:', err);
          showNotification('Could not clear history', 'error');
        }
      }
    );
  };

  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];

  return (
    <div className="meals-container">
      <div className="meals-header">
        <div>
          <h1>🍽️ Meal System</h1>
          <p className="header-subtitle">Track shared meal expenses and settlements</p>
        </div>
        <button
          className="create-meal-btn"
          onClick={() => navigate("/meals/create")}
        >
          ➕ New Meal System
        </button>
      </div>

      {loading ? (
        <div className="loading">Loading meals...</div>
      ) : meals.length > 0 ? (
        <div className="meals-grid">
          {meals.map((meal) => (
            <div key={meal._id} className="meal-card card">
              <div className="meal-header-card">
                <h3>{monthNames[meal.month - 1]} {meal.year}</h3>
                <span className={`status-badge ${meal.status}`}>
                  {meal.status.charAt(0).toUpperCase() + meal.status.slice(1)}
                </span>
              </div>

              <div className="meal-info">
                <p>
                  <strong>👥 Persons:</strong> {meal.totalPersons}
                </p>
                <p>
                  <strong>👤 Participants:</strong> {meal.participants.length}
                </p>
                <p>
                  <strong>📅 Created:</strong> {new Date(meal.createdAt).toLocaleDateString()}
                </p>
              </div>

              <div className="card-footer">
                <button
                  className="add-btn"
                  onClick={() => navigate(`/meals/${meal._id}`)}
                >
                  📊 View
                </button>
                {meal.status === "active" ? (
                  <button
                    className="delete-btn"
                    onClick={() => handleDelete(meal._id)}
                  >
                    🗑️ Delete
                  </button>
                ) : (
                  <div style={{display:'flex', gap:8}}>
                    <button
                      className="add-btn"
                      onClick={() => handleReactivate(meal._id)}
                    >
                      🔁 Reactivate
                    </button>
                    <button
                      className="delete-btn"
                      onClick={() => handleClearHistory(meal._id)}
                      title="Delete historical records but keep this month"
                    >
                      🧹 Clear History
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <p>No meal systems yet. Create one to get started!</p>
          <button
            className="create-meal-btn"
            onClick={() => navigate("/meals/create")}
          >
            ➕ Create First Meal System
          </button>
        </div>
      )}

      {/* Notification Toast */}
      {notification && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          padding: '12px 20px',
          backgroundColor: notification.type === 'success' ? '#4caf50' : '#d32f2f',
          color: 'white',
          borderRadius: '4px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          zIndex: 9999,
          fontSize: '0.9rem',
          animation: 'slideIn 0.3s ease-in-out'
        }}>
          {notification.type === 'success' ? '✓' : '✕'} {notification.message}
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '24px',
            maxWidth: '400px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
          }}>
            <h3 style={{ margin: '0 0 12px 0', color: '#333' }}>{confirmModal.title}</h3>
            <p style={{ margin: '0 0 20px 0', color: '#666', lineHeight: '1.5' }}>{confirmModal.message}</p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={confirmModal.onCancel}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#e0e0e0',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  fontWeight: 500
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmModal.onConfirm}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#667eea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  fontWeight: 500
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default Meals;
