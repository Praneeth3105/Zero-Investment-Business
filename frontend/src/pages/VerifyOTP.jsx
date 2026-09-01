import { useState } from "react";

import { useNavigate } from "react-router-dom";

import axios from "axios";

function VerifyOTP() {
  const navigate = useNavigate();

  const email = localStorage.getItem("loginEmail");

  const [otp, setOtp] = useState("");

  const [loading, setLoading] = useState(false);

  const verify = async (e) => {
    e.preventDefault();

    setLoading(true);

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/auth/verify-otp`,

        {
          email,
          otp,
        },
      );

      localStorage.setItem("token", response.data.token);

      localStorage.setItem("user", JSON.stringify(response.data.user));

      if (response.data.user.hasPurchased) {
        navigate("/library");
      } else {
        navigate("/checkout");
      }
    } catch (error) {
      alert(error.response?.data?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={verify}>
        <h1>Verify Email</h1>

        <p>
          OTP sent to
          <br />
          <strong>{email}</strong>
        </p>

        <input
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          placeholder="6-digit OTP"
          maxLength={6}
          required
        />

        <button className="primary-button full" disabled={loading}>
          {loading ? "Verifying..." : "Verify & Continue"}
        </button>
      </form>
    </div>
  );
}

export default VerifyOTP;
