import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useEffect, useState } from "react";
import API from "../api/api";

const ExpenseChart = () => {
  const [data, setData] = useState([]);

  // Modern color palette - vibrant and distinct colors
  const COLORS = [
    '#667eea',  // Indigo
    '#764ba2',  // Purple
    '#f093fb',  // Pink
    '#4facfe',  // Blue
    '#43e97b',  // Green
    '#fa709a',  // Rose
    '#feca57',  // Yellow
    '#ff9ff3',  // Light Pink
    '#54a0ff',  // Periwinkle
    '#48dbfb',  // Sky Blue
    '#1dd1a1',  // Teal
    '#ff6348',  // Reddish Orange
    '#ff5252',  // Red
    '#a29bfe',  // Lavender
    '#fd79a8',  // Warm Pink
  ];

  useEffect(() => {
    API.get("/summary/category").then((res) =>
      setData(res.data)
    );
  }, []);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          padding: '12px 16px',
          borderRadius: '8px',
          border: '1px solid #e0e0e0',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
          backdropFilter: 'blur(10px)'
        }}>
          <p style={{ margin: '0 0 6px 0', fontWeight: 700, color: '#333' }}>
            {payload[0].name}
          </p>
          <p style={{ margin: 0, fontSize: '14px', color: payload[0].payload.fill }}>
            ৳ {payload[0].value.toFixed(2)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={350}>
      <PieChart>
        <Pie
          data={data}
          dataKey="total"
          nameKey="_id"
          cx="50%"
          cy="50%"
          outerRadius={110}
          innerRadius={60}
          paddingAngle={3}
          label={({ _id, percent }) => `${_id} ${(percent * 100).toFixed(0)}%`}
          labelLine={true}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend 
          verticalAlign="bottom" 
          height={36}
          wrapperStyle={{
            paddingTop: '20px',
            fontSize: '13px'
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default ExpenseChart;
