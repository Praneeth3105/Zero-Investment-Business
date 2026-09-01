import { useEffect, useState } from "react";

import { Link } from "react-router-dom";

import axios from "axios";

function PaymentSuccess() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const refreshPurchase = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          setLoading(false);

          return;
        }

        /*
          Ask backend for the latest
          purchase status.
          */

        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/book/status`,

          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        console.log("Updated purchase:", response.data);

        /*
          Update localStorage
          */

        if (response.data.user) {
          localStorage.setItem(
            "user",

            JSON.stringify(response.data.user),
          );
        }
      } catch (error) {
        console.error("Purchase refresh error:", error);
      } finally {
        setLoading(false);
      }
    };

    refreshPurchase();
  }, []);

  return (
    <div className="success-page">
      <div className="success-card">
        <div className="success-icon">✓</div>

        <span className="badge">PAYMENT CONFIRMED</span>

        <h1>Payment Successful</h1>

        <p>
          Thank you for purchasing
          <strong> 0% Investment Business</strong>.
        </p>

        <p>Your book has been added to your library.</p>

        {!loading && (
          <Link to="/reader" className="primary-button">
            Read Book →
          </Link>
        )}

        <Link to="/library" className="secondary-button">
          Go To My Library
        </Link>
      </div>
    </div>
  );
}

export default PaymentSuccess;
