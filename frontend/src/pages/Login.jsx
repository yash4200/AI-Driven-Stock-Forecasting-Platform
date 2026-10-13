import { useState } from "react";
import "./Login.css";

function Login({ onLogin, onSignup }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!email || !password) {
      alert("Please enter email and password");
      return;
    }

    onLogin();
  };

  return (
    <div className="login-page">
      <div className="login-container">

        {/* Logo */}
        <div className="login-brand">
          <h1>
            Stock<span>AI</span>
          </h1>

          <p>AI-powered stock market platform</p>
        </div>

        {/* Login Card */}
        <div className="login-card">

          <div className="login-heading">
            <h2>Welcome Back</h2>
            <p>Login to continue to your dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">

            {/* Email */}
            <div className="login-field">
              <label>Email</label>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
              />
            </div>

            {/* Password */}
            <div className="login-field">
              <label>Password</label>

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
              />
            </div>

            <button type="submit" className="login-button">
              Login
            </button>

          </form>

          <p className="login-signup">
            Don't have an account?{" "}
            <button type="button" onClick={onSignup}>
              Create Account
            </button>
          </p>

        </div>
      </div>
    </div>
  );
}

export default Login;