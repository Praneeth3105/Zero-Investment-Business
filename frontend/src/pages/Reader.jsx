import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Reader() {
  const navigate = useNavigate();

  const TOTAL_PAGES = 28;

  const [currentPage, setCurrentPage] = useState(1);
  const [pageUrl, setPageUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const user = JSON.parse(localStorage.getItem("user") || "null");

  /* =========================================================
     LOAD CURRENT PAGE
     ========================================================= */

  useEffect(() => {
    let objectUrl = null;

    const loadPage = async () => {
      try {
        setLoading(true);
        setError("");
        setPageUrl(null);

        const token = localStorage.getItem("token");

        if (!token) {
          navigate("/login");
          return;
        }

        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/book/page/${currentPage}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },

            // Important:
            // We receive the protected image as binary data.
            responseType: "blob",
          },
        );

        objectUrl = URL.createObjectURL(response.data);

        setPageUrl(objectUrl);
      } catch (error) {
        console.error("BOOK PAGE ERROR:", error);

        if (error.response?.status === 403) {
          setError("You haven't purchased this book yet.");
        } else if (error.response?.status === 401) {
          localStorage.removeItem("token");
          setError("Your login session has expired.");
        } else {
          setError(
            error.response?.data?.message || "Unable to load this page.",
          );
        }
      } finally {
        setLoading(false);
      }
    };

    loadPage();

    // Remove the temporary browser object URL
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [currentPage, navigate]);

  /* =========================================================
     SECURITY / COPY DETERRENTS
     ========================================================= */

  useEffect(() => {
    const preventAction = (e) => {
      e.preventDefault();
    };

    const preventKeyboardShortcuts = (e) => {
      // Ctrl/Cmd + C
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "c") {
        e.preventDefault();
      }

      // Ctrl/Cmd + S
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
      }

      // Ctrl/Cmd + P
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "p") {
        e.preventDefault();
      }

      // Ctrl/Cmd + U
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "u") {
        e.preventDefault();
      }

      // F12
      if (e.key === "F12") {
        e.preventDefault();
      }
    };

    document.addEventListener("contextmenu", preventAction);
    document.addEventListener("copy", preventAction);
    document.addEventListener("cut", preventAction);
    document.addEventListener("selectstart", preventAction);
    document.addEventListener("dragstart", preventAction);
    document.addEventListener("keydown", preventKeyboardShortcuts);

    return () => {
      document.removeEventListener("contextmenu", preventAction);
      document.removeEventListener("copy", preventAction);
      document.removeEventListener("cut", preventAction);
      document.removeEventListener("selectstart", preventAction);
      document.removeEventListener("dragstart", preventAction);
      document.removeEventListener("keydown", preventKeyboardShortcuts);
    };
  }, []);

  /* =========================================================
     PAGE NAVIGATION
     ========================================================= */

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage((page) => page - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < TOTAL_PAGES) {
      setCurrentPage((page) => page + 1);
    }
  };

  /* =========================================================
     LOADING
     ========================================================= */

  if (loading) {
    return (
      <div className="reader-loading">
        <div>
          <h2>Opening your book...</h2>
          <p>
            Loading page {currentPage} of {TOTAL_PAGES}
          </p>
        </div>
      </div>
    );
  }

  /* =========================================================
     ERROR
     ========================================================= */

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

  /* =========================================================
     READER
     ========================================================= */

  return (
    <div className="reader-page">
      {/* =====================================================
          TOP TOOLBAR
          ===================================================== */}

      <div className="reader-toolbar">
        <div className="reader-title">
          <strong>Low Investment Business</strong>

          <span>Licensed to {user?.email}</span>
        </div>

        <button className="reader-back" onClick={() => navigate("/library")}>
          My Library
        </button>
      </div>

      {/* =====================================================
          PAGE CONTENT
          ===================================================== */}

      <div className="reader-content">
        {/* Watermark */}

        <div className="reader-watermark">{user?.email}</div>

        {/* Book page */}

        {pageUrl && (
          <div className="book-page-container">
            <img
              src={pageUrl}
              alt={`Book page ${currentPage}`}
              className="book-page-image"
              draggable="false"
            />
          </div>
        )}
      </div>

      {/* =====================================================
          PAGE CONTROLS
          ===================================================== */}

      <div className="reader-controls">
        <button
          className="reader-nav-button"
          onClick={goToPreviousPage}
          disabled={currentPage === 1}
        >
          ← Previous
        </button>

        <div className="reader-page-number">
          Page <strong>{currentPage}</strong> of <strong>{TOTAL_PAGES}</strong>
        </div>

        <button
          className="reader-nav-button"
          onClick={goToNextPage}
          disabled={currentPage === TOTAL_PAGES}
        >
          Next →
        </button>
      </div>
    </div>
  );
}

export default Reader;
