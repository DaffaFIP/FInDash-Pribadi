import { useState, useEffect } from "react";
import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";

import { auth } from "../firebase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [user, setUser] = useState(null);

  // CEK USER LOGIN
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  // LOGIN
  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      await signInWithEmailAndPassword(auth, email, password);

      setMessage("Login berhasil");
    } catch (error) {
      setMessage(error.message);
    }
  };

  // LOGOUT
  const handleLogout = async () => {
    await signOut(auth);
    setMessage("Logout berhasil");
  };

  return (
    <div
      style={{
        width: "300px",
        margin: "100px auto",
        padding: "20px",
        border: "1px solid #ccc",
        borderRadius: "10px",
      }}
    >
      <h2>Firebase Login</h2>

      {/* INFO USER */}
      {user ? (
        <div>
          <p>
            <strong>Email:</strong> {user.email}
          </p>

          {/* <p>
            <strong>UID:</strong> {user.uid}
          </p> */}

          <button onClick={handleLogout} style={{
            width: "100%",
            padding: "10px",
            color: "white",
            backgroundColor: "red",
            border: "none",
            borderRadius: "5px",
          }}>
            Logout
          </button>

        </div>
      ) : (
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: "10px" }}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "10px",
              }}
            />
          </div>

          <div style={{ marginBottom: "10px" }}>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "10px",
              }}
            />
          </div>

          <button
            type="submit"
            style={{
              width: "100%",
              padding: "10px",
              color: "white",
              backgroundColor: "blue",
              border: "none",
              borderRadius: "5px",
            }}
          >
            Login
          </button>
        </form>
      )}

      {message && (
        <p style={{ marginTop: "10px" }}>
          {message}
        </p>
      )}
    </div>
  );
}