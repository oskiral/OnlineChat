import { useState } from "react";
import { API_BASE_URL, API_ENDPOINTS } from "../../constants";
import "../../styles/Login.css";

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    // Basic validation
    if (username.trim() === "" || password === "") {
      setError("Username and password cannot be empty.");
      return;
    }
    if (isRegistering && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    const endpoint = isRegistering ? API_ENDPOINTS.AUTH.REGISTER : API_ENDPOINTS.AUTH.LOGIN;
    try {
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "An error occurred");
      }

      // On successful login or register, invoke callback and store token
      onLogin({ username: data.username, token: data.token });
      localStorage.setItem("token", data.token);
      localStorage.setItem("username", data.username);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="login-title">
          {isRegistering ? "Create Account" : "Welcome Back"}
        </h1>
        <p className="login-subtitle">
          {isRegistering
            ? "Register a new account to start chatting"
            : "Log in to continue chatting"}
        </p>

        <form onSubmit={handleSubmit} className="login-form">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="login-input"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="login-input"
          />

          {isRegistering && (
            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="login-input"
            />
          )}

          {error && <p className="login-error">{error}</p>}

          <button type="submit" className="login-button">
            {isRegistering ? "Register" : "Log In"}
          </button>
        </form>

        <div className="login-toggle">
          {isRegistering ? (
            <>
              <span>Already have an account?</span>{" "}
              <button
                className="toggle-button"
                onClick={() => {
                  setIsRegistering(false);
                  setError("");
                }}
              >
                Log In
              </button>
            </>
          ) : (
            <>
              <span>Don't have an account?</span>{" "}
              <button
                className="toggle-button"
                onClick={() => {
                  setIsRegistering(true);
                  setError("");
                  setConfirmPassword("");
                }}
              >
                Register
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
