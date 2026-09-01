import { useState } from "react";

import { useNavigate } from "react-router-dom";

import axios from "axios";

function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({
      ...form,

      [e.target.name]: e.target.value,
    });
  };

  const sendOTP = async (e) => {
    e.preventDefault();

    setLoading(true);

    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/auth/send-otp`,
        form,
      );

      localStorage.setItem("loginEmail", form.email);

      navigate("/verify-otp");
    } catch (error) {
      alert(error.response?.data?.message || "Unable to send OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={sendOTP}>
        <h1>Welcome</h1>

        <p>Enter your details to continue.</p>

        <input
          name="name"
          placeholder="Full Name"
          value={form.name}
          onChange={handleChange}
          required
        />

        <input
          name="email"
          type="email"
          placeholder="Email Address"
          value={form.email}
          onChange={handleChange}
          required
        />

        <input
          name="phone"
          placeholder="Mobile Number"
          value={form.phone}
          onChange={handleChange}
        />

        <button className="primary-button full" disabled={loading}>
          {loading ? "Sending..." : "Continue"}
        </button>
      </form>
    </div>
  );
}

export default Login;
