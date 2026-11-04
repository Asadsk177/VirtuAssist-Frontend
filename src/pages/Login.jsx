
import React, { useState } from "react";
import api from "../api.js";

function Login({ onLoginSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const switchMode = () => {
    setIsRegister((previous) => !previous);
    setName("");
    setPassword("");
    setConfirmPassword("");
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (loading) return;

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      if (isRegister) {
        if (password.length < 8) {
          throw new Error("Password must contain at least 8 characters.");
        }

        if (password !== confirmPassword) {
          throw new Error("Passwords do not match.");
        }

        // Assumes your Django registration serializer accepts
        // username, email, and password.
        await api.post("/register/", {
          username: name.trim(),
          email: email.trim(),
          password,
        });

        setSuccess("Account created successfully! You can now log in.");
        setIsRegister(false);
        setPassword("");
        setConfirmPassword("");
      } else {
        const response = await api.post("/login/", {
          email: email.trim(),
          password,
        });

        const { access, refresh } = response.data;

        if (!access || !refresh) {
          throw new Error(
            "Login response did not contain both access and refresh tokens."
          );
        }

        localStorage.setItem("access", access);
        localStorage.setItem("refresh", refresh);

        onLoginSuccess();
      }
    } catch (err) {
      console.error(
        isRegister ? "Registration failed:" : "Login failed:",
        err.response?.data || err.message
      );

      const details = err.response?.data;

      if (details && typeof details === "object") {
        const messages = Object.entries(details)
          .map(([field, value]) => {
            const message = Array.isArray(value)
              ? value.join(" ")
              : typeof value === "string"
                ? value
                : JSON.stringify(value);

            return `${field}: ${message}`;
          })
          .join(" ");

        setError(messages || "Request failed. Please try again.");
      } else {
        setError(err.message || "Unable to connect to the backend.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <h1>✦ VirtuAssist</h1>

        <p>
          {isRegister
            ? "Create your personal AI companion account."
            : "Sign in to your personal AI companion."}
        </p>

        {isRegister && (
          <>
            <label htmlFor="name">Name</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoComplete="name"
              placeholder="Enter your name"
              required
            />
          </>
        )}

        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          placeholder="Enter your email"
          required
        />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete={isRegister ? "new-password" : "current-password"}
          placeholder="Enter your password"
          minLength={isRegister ? 8 : undefined}
          required
        />

        {isRegister && (
          <>
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(event) =>
                setConfirmPassword(event.target.value)
              }
              autoComplete="new-password"
              placeholder="Re-enter your password"
              minLength={8}
              required
            />
          </>
        )}

        {error && (
          <p className="login-error" role="alert">
            {error}
          </p>
        )}

        {success && (
          <p className="login-success" role="status">
            {success}
          </p>
        )}

        <button type="submit" disabled={loading}>
          {loading
            ? isRegister
              ? "Creating account..."
              : "Signing in..."
            : isRegister
              ? "Create Account"
              : "Log in"}
        </button>

        <p className="login-switch">
          {isRegister
            ? "Already have an account?"
            : "Don't have an account?"}{" "}
          <button
            type="button"
            className="login-switch-button"
            onClick={switchMode}
            disabled={loading}
          >
            {isRegister ? "Log in" : "Register"}
          </button>
        </p>
      </form>
    </main>
  );
}

export default Login;
