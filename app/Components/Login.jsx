import { useState } from "react";
import "./Login.css";

export default function Login({ onLogin }) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isRegistering, setIsRegistering] = useState(false);

    async function handleSubmit(event) {
        event.preventDefault();
        setError("");

        if (username.trim() === "" || password === "") {
            setError("Username and password cannot be empty.");
            return;
        }

        const endpoint = isRegistering ? "/register" : "/login";
        try {
            const res = await fetch(`http://localhost:3001${endpoint}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ username: username.trim(), password }),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "An error occurred");
            }

            onLogin({username: data.username, token: data.token});
            localStorage.setItem('token', data.token);
            localStorage.setItem('username', data.username);
        } catch (error) {
            setError(error.message);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="login-form">
            <div className="login-header">
                <h2>{isRegistering ? "Register" : "Login"}</h2>
                <p>Please enter your credentials to continue</p>
            </div>
            <div className="login-input">
            <input
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
            />
            <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />
            <button type="submit">
                {isRegistering ? "Register" : "Login"}
            </button>
            {error && <p className="error">{error}</p>}
            <p className="switch-auth">
            {isRegistering ? (
                <>
                Already have an account?{" "}
                <span onClick={() => setIsRegistering(false)}>Login</span>
                </>
            ) : (
                <>
                Don't have an account?{" "}
                <span onClick={() => setIsRegistering(true)}>Register</span>
                </>
            )}
            </p>
        </div>
        </form>
    );
}
