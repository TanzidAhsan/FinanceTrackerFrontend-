import { useEffect, useState } from "react";
import API from "../api/api";

export default function Admin() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    API.get("/auth/me").then(res => setUser(res.data)).catch(() => {});
  }, []);

  return (
    <div>
      <h2>Admin Panel</h2>
      {user && (
        <div>
          <p><strong>Name:</strong> {user.name}</p>
          <p><strong>Email:</strong> {user.email}</p>
        </div>
      )}
    </div>
  );
}
