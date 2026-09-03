import { Link, useNavigate } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();

  const token = localStorage.getItem("token");

  const logout = () => {
    localStorage.removeItem("token");

    localStorage.removeItem("user");

    navigate("/");
  };

  return (
    <nav className="navbar">
      <Link to="/" className="logo">
        Low Investment Business Book
      </Link>

      <div className="nav-links">
        <Link to="/">Home</Link>

        {token && <Link to="/library">My Book</Link>}

        {!token ? (
          <Link to="/login" className="nav-button">
            Login
          </Link>
        ) : (
          <button onClick={logout} className="nav-button">
            Logout
          </button>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
