import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Library() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [purchased, setPurchased] = useState(false);
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

  useEffect(() => {
    const checkLibrary = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");

        return;
      }

      try {
        const response = await axios.get(`${API_URL}/api/book/status`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        console.log("LIBRARY BOOK STATUS:", response.data);

        const hasPurchased = response.data.hasPurchased === true;

        setPurchased(hasPurchased);

        if (response.data.user) {
          localStorage.setItem("user", JSON.stringify(response.data.user));
        }
      } catch (error) {
        console.error("LIBRARY ACCESS ERROR:", error);

        if (error.response?.status === 401) {
          localStorage.removeItem("token");

          localStorage.removeItem("user");

          navigate("/login");

          return;
        }

        setPurchased(false);
      } finally {
        setLoading(false);
      }
    };

    checkLibrary();
  }, [API_URL, navigate]);

  if (loading) {
    return <div className="center">Loading...</div>;
  }

  return (
    <div className="library-page">
      <div className="library-header">
        <div>
          <span className="badge">MY LIBRARY</span>

          <h1>Your Books</h1>
        </div>
      </div>

      {purchased ? (
        <div className="book-library-card">
          <div className="mini-cover">
            <h3>The Complete Guide</h3>
            <h2>Low Investment Business Book</h2>
          </div>

          <div className="library-info">
            <h2>Low-Investment Business Ideas - Start Under ₹30,000 </h2>

            <p>Digital Business Playbook</p>

            <button
              className="primary-button"
              onClick={() => navigate("/reader")}
            >
              Read Book
            </button>
          </div>
        </div>
      ) : (
        <div className="empty">
          <h2>No books yet</h2>

          <button className="primary-button" onClick={() => navigate("/")}>
            Browse Book
          </button>
        </div>
      )}
    </div>
  );
}

export default Library;
