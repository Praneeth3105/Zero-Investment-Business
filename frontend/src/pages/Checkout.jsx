import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Checkout() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [alreadyPurchased, setAlreadyPurchased] = useState(false);

  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user") || "null"),
  );

  const token = localStorage.getItem("token");

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

  /*
  ====================================================
  CHECK USER + PURCHASE STATUS
  ====================================================
  */

  useEffect(() => {
    const checkPurchase = async () => {
      if (!token) {
        navigate("/login");

        return;
      }

      try {
        console.log("Checking purchase status...");

        const response = await axios.get(`${API_URL}/api/book/status`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        console.log("CHECKOUT BOOK STATUS:", response.data);

        /*
        Update user information
        */

        if (response.data.user) {
          setUser(response.data.user);

          localStorage.setItem("user", JSON.stringify(response.data.user));
        }

        /*
        ==================================================
        ALREADY PURCHASED
        ==================================================
        */

        if (response.data.hasPurchased === true) {
          console.log("USER ALREADY PURCHASED - NO PAYMENT");

          setAlreadyPurchased(true);

          /*
          Send directly to reader.
          */

          navigate("/reader", {
            replace: true,
          });

          return;
        }
      } catch (error) {
        console.error("CHECKOUT PURCHASE CHECK ERROR:", error);

        if (error.response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");

          navigate("/login");

          return;
        }
      } finally {
        setLoading(false);
      }
    };

    checkPurchase();
  }, [API_URL, navigate, token]);

  /*
  ====================================================
  LOAD RAZORPAY
  ====================================================
  */

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);

        return;
      }

      const script = document.createElement("script");

      script.src = "https://checkout.razorpay.com/v1/checkout.js";

      script.onload = () => {
        resolve(true);
      };

      script.onerror = () => {
        resolve(false);
      };

      document.body.appendChild(script);
    });
  };

  /*
  ====================================================
  START PAYMENT
  ====================================================
  */

  const startPayment = async () => {
    /*
    Never start payment if already purchased.
    */

    if (alreadyPurchased) {
      navigate("/reader");

      return;
    }

    if (!token) {
      navigate("/login");

      return;
    }

    setPaymentLoading(true);

    try {
      /*
      ==================================================
      DOUBLE CHECK PURCHASE
      ==================================================
      */

      const statusResponse = await axios.get(`${API_URL}/api/book/status`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("PAYMENT PRE-CHECK:", statusResponse.data);

      /*
      User already purchased.
      */

      if (statusResponse.data.hasPurchased === true) {
        alert("You have already purchased this book.");

        navigate("/reader");

        return;
      }

      /*
      ==================================================
      LOAD RAZORPAY
      ==================================================
      */

      const razorpayLoaded = await loadRazorpay();

      if (!razorpayLoaded) {
        throw new Error(
          "Unable to load Razorpay. Please check your internet connection.",
        );
      }

      /*
      ==================================================
      CREATE ORDER
      ==================================================
      */

      console.log("Creating Razorpay order...");

      console.log("API:", `${API_URL}/api/payment/create-order`);

      const response = await axios.post(
        `${API_URL}/api/payment/create-order`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      console.log("Create order response:", response.data);

      /*
      ==================================================
      HANDLE ALREADY PURCHASED FROM BACKEND
      ==================================================
      */

      if (response.data.alreadyPurchased === true) {
        alert("You have already purchased this book.");

        navigate("/reader");

        return;
      }

      const { orderId, amount, currency, key } = response.data;

      if (!orderId) {
        throw new Error("Razorpay order ID was not returned.");
      }

      if (!key) {
        throw new Error("Razorpay key was not returned by the server.");
      }

      /*
      ==================================================
      RAZORPAY OPTIONS
      ==================================================
      */

      const options = {
        key: key,

        amount: amount,

        currency: currency,

        name: "0% Investment Business",

        description: "Digital Book Purchase",

        order_id: orderId,

        prefill: {
          name: user?.name || "",

          email: user?.email || "",

          contact: user?.phone || "",
        },

        notes: {
          product: "0% Investment Business",
        },

        theme: {
          color: "#111111",
        },

        handler: async function (paymentResponse) {
          try {
            console.log("Razorpay payment response:", paymentResponse);

            /*
            ============================================
            VERIFY PAYMENT
            ============================================
            */

            const verifyResponse = await axios.post(
              `${API_URL}/api/payment/verify`,

              {
                razorpay_order_id: paymentResponse.razorpay_order_id,

                razorpay_payment_id: paymentResponse.razorpay_payment_id,

                razorpay_signature: paymentResponse.razorpay_signature,
              },

              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              },
            );

            console.log("Payment verification:", verifyResponse.data);

            if (verifyResponse.data.success) {
              /*
              Update local user immediately.
              */

              const currentUser = JSON.parse(
                localStorage.getItem("user") || "null",
              );

              if (currentUser) {
                currentUser.hasPurchased = true;

                localStorage.setItem("user", JSON.stringify(currentUser));
              }

              navigate("/payment-success");
            } else {
              alert("Payment verification failed.");
            }
          } catch (error) {
            console.error("PAYMENT VERIFICATION ERROR:", error);

            console.error("Server response:", error.response?.data);

            alert(
              error.response?.data?.message || "Payment verification failed.",
            );
          } finally {
            setPaymentLoading(false);
          }
        },

        modal: {
          ondismiss: function () {
            console.log("Razorpay payment window closed.");

            setPaymentLoading(false);
          },
        },
      };

      /*
      ==================================================
      OPEN RAZORPAY
      ==================================================
      */

      console.log("Opening Razorpay...");

      const razorpay = new window.Razorpay(options);

      razorpay.on("payment.failed", function (response) {
        console.error("PAYMENT FAILED:", response.error);

        alert(
          response.error?.description || "Payment failed. Please try again.",
        );

        setPaymentLoading(false);
      });

      razorpay.open();

      setPaymentLoading(false);
    } catch (error) {
      console.error("CREATE PAYMENT ERROR:", error);

      console.error("Status:", error.response?.status);

      console.error("Server response:", error.response?.data);

      /*
      ==================================================
      BACKEND SAYS ALREADY PURCHASED
      ==================================================
      */

      if (
        error.response?.status === 409 &&
        error.response?.data?.alreadyPurchased
      ) {
        alert("You have already purchased this book.");

        navigate("/reader");

        return;
      }

      let message = "Unable to start payment";

      if (error.response?.data?.message) {
        message = error.response.data.message;
      } else if (error.message) {
        message = error.message;
      }

      alert(message);

      setPaymentLoading(false);
    }
  };

  /*
  ====================================================
  LOADING
  ====================================================
  */

  if (loading) {
    return (
      <div className="checkout-page">
        <div className="checkout-card">
          <h2>Checking your account...</h2>

          <p>Please wait.</p>
        </div>
      </div>
    );
  }

  /*
  ====================================================
  ALREADY PURCHASED
  ====================================================
  */

  if (alreadyPurchased) {
    return (
      <div className="checkout-page">
        <div className="checkout-card">
          <span className="badge">ALREADY PURCHASED</span>

          <h1>You Already Own This Book</h1>

          <p className="checkout-subtitle">
            Your purchase is already linked to your account.
          </p>

          <button
            className="payment-button"
            onClick={() => navigate("/reader")}
          >
            Read Your Book →
          </button>
        </div>
      </div>
    );
  }

  /*
  ====================================================
  NORMAL CHECKOUT PAGE
  ====================================================
  */

  return (
    <div className="checkout-page">
      <div className="checkout-card">
        <span className="badge">DIGITAL BOOK</span>

        <h1>0% Investment Business</h1>

        <p className="checkout-subtitle">
          Complete your purchase to unlock the book.
        </p>

        <div className="checkout-product">
          <span>Book</span>

          <strong>₹99</strong>
        </div>

        <div className="checkout-details">
          <div>
            <label>Name</label>

            <p>{user?.name || "Customer"}</p>
          </div>

          <div>
            <label>Email</label>

            <p>{user?.email || ""}</p>
          </div>
        </div>

        <button
          className="payment-button"
          onClick={startPayment}
          disabled={paymentLoading}
        >
          {paymentLoading ? "Opening Payment..." : "Pay ₹99 & Get The Book"}
        </button>

        <p className="secure-payment">
          Payments securely processed by Razorpay.
        </p>
      </div>
    </div>
  );
}

export default Checkout;
