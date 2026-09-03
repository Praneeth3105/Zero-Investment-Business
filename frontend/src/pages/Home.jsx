import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();

  const [hasPurchased, setHasPurchased] = useState(false);
  const [checkingPurchase, setCheckingPurchase] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

  useEffect(() => {
    const checkPurchase = async () => {
      const token = localStorage.getItem("token");


      if (!token) {
        setHasPurchased(false);
        return;
      }

      try {
        setCheckingPurchase(true);

        const response = await axios.get(`${API_URL}/api/book/status`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        console.log("HOME BOOK STATUS:", response.data);

        const purchased = response.data.hasPurchased === true;

        setHasPurchased(purchased);
        const currentUser = JSON.parse(localStorage.getItem("user") || "null");

        if (currentUser) {
          currentUser.hasPurchased = purchased;

          localStorage.setItem("user", JSON.stringify(currentUser));
        }
      } catch (error) {
        console.error("HOME PURCHASE CHECK ERROR:", error);

        setHasPurchased(false);
      } finally {
        setCheckingPurchase(false);
      }
    };

    checkPurchase();
  }, [API_URL]);

  const buyBook = () => {
    const token = localStorage.getItem("token");


    if (!token) {
      navigate("/login");

      return;
    }

    if (hasPurchased) {
      navigate("/reader");

      return;
    }


    navigate("/checkout");
  };

  return (
    <div className="landing">
      <section className="hero">
        <div className="hero-content">
          <span className="badge">Digital Business Guide</span>

          <h2>Low-Investment Business Ideas - Start Under ₹30,000</h2>
<br></br>
          <p className="hero-subtitle">
            Start a business without putting your savings at risk.
          </p>

          <p className="hero-description">
            A practical guide to discovering business opportunities that can be
            started with little or no upfront investment.
          </p>

          <button
            className="primary-button"
            onClick={buyBook}
            disabled={checkingPurchase}
          >
            {checkingPurchase
              ? "Checking..."
              : hasPurchased
                ? "Read Your PDFv →"
                : "Get The PDF →"}
          </button>

          <p className="secure-text">🔒 Secure Razorpay payment</p>
        </div>

        <div className="book-cover">
          <div className="cover-card">
            <div className="cover-top">THE COMPLETE GUIDE</div>

            <h3>Low-Investment Business Ideas - Start Under ₹30,000</h3>

            <div className="cover-line" />

            <p>
              Start smart.
              <br />
              Build without heavy investment.
            </p>

            <small>BUSINESS PLAYBOOK</small>
          </div>
        </div>
      </section>

      <section className="stats">
        <div>
          <strong>0%-100%</strong>
          <span>Investment Focus</span>
        </div>

        <div>
          <strong>100%</strong>
          <span>Digital Access</span>
        </div>

        <div>
          <strong>24/7</strong>
          <span>Book Access</span>
        </div>
      </section>

      <section className="section">
        <h2>What You'll Discover</h2>

        <p className="section-intro">
          Learn practical ways to turn skills, ideas and available resources
          into business opportunities.
        </p>

        <div className="feature-grid">
          <div className="feature-card">
            <span>01</span>
            <h3>Profitable Business Ideas</h3>
            {/* <p>
              Discover practical business models that don't require heavy
              initial investment.
            </p> */}
          </div>

          <div className="feature-card">
            <span>02</span>
            <h3>Start with ₹0–₹30,000</h3>
            {/* <p>
              Understand how to start with the resources and skills you already
              have.
            </p> */}
          </div>

          <div className="feature-card">
            <span>03</span>
            <h3>Step-by-Step Guidance</h3>
            {/* <p>
              Learn simple approaches to reach potential customers without large
              advertising budgets.
            </p> */}
          </div>

          <div className="feature-card">
            <span>04</span>
            <h3>Build & Grow</h3>
            {/* <p>Turn a small starting point into a repeatable business.</p> */}
          </div>
          <div className="feature-card">
            <span>05</span>
            <h3>Supplier & Manufacturer Sources</h3>
            {/* <p>Turn a small starting point into a repeatable business.</p> */}
          </div>

          <div className="feature-card">
            <span>06</span>
            <h3>Marketing Tips for Every Business</h3>
            {/* <p>Turn a small starting point into a repeatable business.</p> */}
          </div>
          <div className="feature-card">
            <span>07</span>
            <h3>Budget Comparison Table</h3>
            {/* <p>Turn a small starting point into a repeatable business.</p> */}
          </div>
          <div className="feature-card">
            <span>08</span>
            <h3>Instant PDF</h3>
            {/* <p>Turn a small starting point into a repeatable business.</p> */}
          </div>
        </div>
      </section>

      <section className="price-section">
        <div>
          <p>GET INSTANT ACCESS</p>

          <h2>Low-Investment Business Ideas - Start Under ₹30,000</h2>

          <p>One-time purchase. Digital access.</p>
        </div>

        <div className="price-box">
          <span>₹199</span>

          <button
            onClick={buyBook}
            className="primary-button"
            disabled={checkingPurchase}
          >
            {checkingPurchase
              ? "Checking..."
              : hasPurchased
                ? "Read Book"
                : "Buy Now"}
          </button>
        </div>
      </section>

      <section className="faq">
        <h2>Frequently Asked Questions</h2>

        <details>
          <summary>How do I receive the book?</summary>

          <p>
            After successful payment, the book becomes available inside your
            account.
          </p>
        </details>

        <details>
          <summary>Can I download the PDF?</summary>

          <p>
            The book is provided through the online reader rather than as a
            normal downloadable file.
          </p>
        </details>

        <details>
          <summary>Can I access it later?</summary>

          <p>Yes. Login using the email associated with your purchase.</p>
        </details>
      </section>

      <footer>
        <h3>Low Investment Business Book</h3>

        <p>© 2026 All rights reserved.</p>
      </footer>
    </div>
  );
}

export default Home;
