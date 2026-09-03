import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Reader() {
  const navigate = useNavigate();

  const [pdfUrl, setPdfUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const user = JSON.parse(localStorage.getItem("user") || "null");

  useEffect(() => {
    const loadBook = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          navigate("/login");
          return;
        }

        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/book/access`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        console.log("Book access response:", response.data);

        if (!response.data?.success || !response.data?.url) {
          throw new Error("Book URL was not returned");
        }

        setPdfUrl(response.data.url);
      } catch (error) {
        console.error("Book access error:", error);

        if (error.response?.status === 403) {
          setError("You haven't purchased this book yet.");
        } else if (error.response?.status === 401) {
          setError("Your login session has expired.");
        } else {
          setError(error.response?.data?.message || "Unable to load the book.");
        }
      } finally {
        setLoading(false);
      }
    };

    loadBook();
  }, [navigate]);

  useEffect(() => {
    const preventAction = (e) => {
      e.preventDefault();
    };

    document.addEventListener("contextmenu", preventAction);
    document.addEventListener("copy", preventAction);
    document.addEventListener("cut", preventAction);
    document.addEventListener("selectstart", preventAction);
    document.addEventListener("dragstart", preventAction);

    return () => {
      document.removeEventListener("contextmenu", preventAction);
      document.removeEventListener("copy", preventAction);
      document.removeEventListener("cut", preventAction);
      document.removeEventListener("selectstart", preventAction);
      document.removeEventListener("dragstart", preventAction);
    };
  }, []);

  if (loading) {
    return (
      <div className="reader-loading">
        <div>
          <h2>Opening your book...</h2>

          <p>Verifying your purchase.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="reader-error">
        <div className="reader-error-card">
          <h2>Book Access</h2>

          <p>{error}</p>

          <button
            className="primary-button"
            onClick={() => navigate("/library")}
          >
            Go To My Library
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="reader-page">
      <div className="reader-toolbar">
        <div className="reader-title">
          <strong>Low Investment Business</strong>

          <span>Licensed to {user?.email}</span>
        </div>

        <button className="reader-back" onClick={() => navigate("/library")}>
          My Library
        </button>
      </div>

      <div className="reader-content">
        <div className="reader-watermark">{user?.email}</div>

        {pdfUrl && (
          <iframe
            src={pdfUrl}
            title="Low Investment Business"
            className="pdf-frame"
          />
        )}
      </div>
    </div>
  );
}

export default Reader;
