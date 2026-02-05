const StatCard = ({ title, value, type, icon }) => {
  return (
    <div className={`stat-card ${type}`}>
      {icon && <div className="stat-icon">{icon}</div>}
      <h3>{title}</h3>
      <div className="amount">৳ {value.toFixed(2)}</div>
    </div>
  );
};

export default StatCard;
