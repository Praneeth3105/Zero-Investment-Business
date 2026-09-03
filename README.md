# 📚 Low Investment Business

A full-stack digital e-book platform that allows users to purchase the **"Low Investment Business"** e-book through Razorpay and access their purchased book from a personal library.

The application is built using **React, Node.js, Express.js, MongoDB, and Razorpay**.

---

## 🚀 Features

### 👤 User Authentication
- User registration
- Email-based OTP verification
- User login
- JWT-based authentication
- Protected pages
- Persistent login session

### 📖 Digital E-Book
- Dedicated landing page for the book
- Book information and features
- Digital book purchase
- Personal library
- Purchased book access
- Online book reader

### 💳 Razorpay Payment
- Razorpay payment gateway integration
- Server-side order creation
- Secure payment verification
- Razorpay signature verification
- Purchase status stored in MongoDB
- Prevents users from purchasing the same book multiple times

### 🔐 Protected Book Access
- Only authenticated users can access the library
- Only users with a successful purchase can access the book
- Book files are kept outside the public frontend directory
- Basic copy, selection, drag, and right-click restrictions

### 🗄️ Database
MongoDB is used to store:
- User accounts
- Authentication information
- Purchase status
- Razorpay order details
- Razorpay payment details
- Purchase dates

---

# 🛠️ Technologies Used

## Frontend

- React
- Vite
- JavaScript
- Axios
- React Router DOM
- CSS

## Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT
- Nodemailer
- Razorpay
- Crypto

## Payment

- Razorpay Payment Gateway

---

# 📁 Project Structure

```text
Zero-Investment-Business/
│
├── backend/
│   │
│   ├── config/
│   │
│   ├── middleware/
│   │   └── auth.js
│   │
│   ├── models/
│   │   ├── User.js
│   │   └── Order.js
│   │
│   ├── routes/
│   │   ├── auth.js
│   │   ├── payment.js
│   │   └── book.js
│   │
│   ├── private/
│   │   └── book.pdf
│   │
│   ├── server.js
│   ├── package.json
│   └── .env
│
├── frontend/
│   │
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   │
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── VerifyOTP.jsx
│   │   │   ├── Checkout.jsx
│   │   │   ├── PaymentSuccess.jsx
│   │   │   ├── Library.jsx
│   │   │   └── Reader.jsx
│   │   │
│   │   ├── App.jsx
│   │   └── main.jsx
│   │
│   ├── package.json
│   └── .env
│
├── .gitignore
└── README.md
