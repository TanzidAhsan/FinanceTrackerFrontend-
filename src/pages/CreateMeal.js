import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/api";
import "../styles/meals.css";

const CreateMeal = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    totalPersons: "",
    participants: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      if (name === "participants") {
        const list = value
          .split(",")
          .map((p) => p.trim())
          .filter((p) => p);
        if (list.length && (!prev.totalPersons || prev.totalPersons === "")) {
          next.totalPersons = String(list.length);
        }
      }
      return next;
    });
    // debug: helps confirm input events in browser console
    // remove or silence in production
    // eslint-disable-next-line no-console
    console.log("CreateMeal.handleChange", name, value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const rawList = formData.participants
        .split(",")
        .map((p) => p.trim())
        .filter((p) => p);

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const participantList = rawList.map((p) => {
        if (emailRegex.test(p)) {
          const namePart = p.split("@")[0];
          const niceName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
          return { name: niceName, email: p };
        }
        return { name: p, email: "" };
      });

      const totalPersonsValue = formData.totalPersons
        ? parseInt(formData.totalPersons)
        : participantList.length;

      const response = await API.post("/meals", {
        month: parseInt(formData.month),
        year: parseInt(formData.year),
        totalPersons: totalPersonsValue,
        participants: participantList,
      });

      navigate(`/meals/${response.data._id}`);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create meal system");
    } finally {
      setLoading(false);
    }
  };

  const currentYear = new Date().getFullYear();
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  return (
    <div className="create-meal-container">
      <button className="back-btn" onClick={() => navigate("/meals")}>
        ← Back to Meals
      </button>

      <div className="create-meal-card">
        <div className="form-header">
          <h1>🍽️ Create New Meal System</h1>
          <p>Set up a meal tracking system for shared expenses</p>
        </div>

        <form onSubmit={handleSubmit} className="create-meal-form">
          <div className="form-group">
            <label>Month *</label>
            <select
              name="month"
              value={formData.month}
              onChange={handleChange}
              required
            >
              {monthNames.map((month, index) => (
                <option key={index} value={index + 1}>
                  {month}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Year *</label>
            <select
              name="year"
              value={formData.year}
              onChange={handleChange}
              required
            >
              {[currentYear - 1, currentYear, currentYear + 1].map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Total Number of Persons *</label>
            <input
              type="number"
              name="totalPersons"
              min="1"
              value={formData.totalPersons}
              onChange={handleChange}
              placeholder="e.g., 5"
              required
            />
            <small>How many people are sharing meals?</small>
          </div>

          <div className="form-group">
            <label>Participants *</label>
            <textarea
              name="participants"
              value={formData.participants}
              onChange={handleChange}
              placeholder="Enter participant names or emails separated by commas.&#10;e.g., Alice, Bob, charlie@email.com"
              rows="4"
              required
            />
            <small>List all participants who will share the meals.</small>
          </div>

          <button
            type="submit"
            className="submit-btn"
            disabled={loading}
          >
            {loading ? "Creating..." : "✅ Create Meal System"}
          </button>
        </form>

        <div className="info-box">
          <h4>📋 What happens next?</h4>
          <ul>
            <li>Record daily meal counts (lunch & dinner per person)</li>
            <li>Track all expenses and who paid for them</li>
            <li>Calculate automatic settlement showing who owes what</li>
            <li>Get a monthly statement of all transactions</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CreateMeal;
