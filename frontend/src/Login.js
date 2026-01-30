import { useState } from "react";

export default function Login({ onLogin }) {
  const [loginType, setLoginType] = useState("employee"); // "employee" or "client"
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!username || !password) {
      setError("Please enter both username and password");
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
          type: loginType,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        onLogin({
          type: loginType,
          user: data.user,
          token: data.token,
        });
      } else {
        setError(data.message || "Login failed");
      }
    } catch (err) {
      setError("Unable to connect to server");
      console.error("Login error:", err);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0a0a",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
      position: "relative",
      overflow: "hidden"
    }}>
      {/* Background effects */}
      <div style={{
        position: "absolute",
        top: "-200px",
        right: "-200px",
        width: "500px",
        height: "500px",
        borderRadius: "50%",
        background: "linear-gradient(135deg, #667eea20 0%, #764ba220 100%)",
        filter: "blur(80px)"
      }}></div>
      <div style={{
        position: "absolute",
        bottom: "-150px",
        left: "-150px",
        width: "400px",
        height: "400px",
        borderRadius: "50%",
        background: "linear-gradient(135deg, #ff6b3520 0%, #f9731620 100%)",
        filter: "blur(60px)"
      }}></div>

      {/* Login Card */}
      <div style={{
        background: "#141414",
        borderRadius: "16px",
        padding: "40px",
        maxWidth: "450px",
        width: "100%",
        border: "1px solid #1a1a1a",
        boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
        position: "relative",
        zIndex: 1
      }}>
        {/* Logo */}
        <div style={{
          textAlign: "center",
          marginBottom: "30px"
        }}>
          <h1 style={{
            fontSize: "32px",
            fontWeight: "800",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            marginBottom: "10px"
          }}>CRM Pro</h1>
          <p style={{
            fontSize: "14px",
            color: "rgba(255,255,255,0.5)"
          }}>Sign in to continue</p>
        </div>

        {/* Login Type Selector */}
        <div style={{
          display: "flex",
          gap: "10px",
          marginBottom: "30px",
          background: "#0a0a0a",
          padding: "4px",
          borderRadius: "8px"
        }}>
          <button
            onClick={() => setLoginType("employee")}
            style={{
              flex: 1,
              padding: "12px",
              border: "none",
              borderRadius: "6px",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.3s",
              background: loginType === "employee" ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" : "transparent",
              color: loginType === "employee" ? "#fff" : "rgba(255,255,255,0.5)"
            }}
          >
            Employee
          </button>
          <button
            onClick={() => setLoginType("client")}
            style={{
              flex: 1,
              padding: "12px",
              border: "none",
              borderRadius: "6px",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.3s",
              background: loginType === "client" ? "linear-gradient(135deg, #10b981 0%, #059669 100%)" : "transparent",
              color: loginType === "client" ? "#fff" : "rgba(255,255,255,0.5)"
            }}
          >
            Client
          </button>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: "20px" }}>
            <label style={{
              display: "block",
              fontSize: "13px",
              fontWeight: "600",
              color: "rgba(255,255,255,0.7)",
              marginBottom: "8px",
              textTransform: "uppercase",
              letterSpacing: "0.5px"
            }}>
              {loginType === "employee" ? "Employee ID" : "Email Address"}
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={loginType === "employee" ? "Enter your employee ID" : "Enter your email"}
              style={{
                width: "100%",
                padding: "14px",
                background: "#0a0a0a",
                border: "1px solid #2a2a2a",
                borderRadius: "8px",
                color: "#fff",
                fontSize: "14px",
                outline: "none",
                transition: "border 0.3s"
              }}
              onFocus={(e) => e.target.style.border = "1px solid #667eea"}
              onBlur={(e) => e.target.style.border = "1px solid #2a2a2a"}
            />
          </div>

          <div style={{ marginBottom: "25px" }}>
            <label style={{
              display: "block",
              fontSize: "13px",
              fontWeight: "600",
              color: "rgba(255,255,255,0.7)",
              marginBottom: "8px",
              textTransform: "uppercase",
              letterSpacing: "0.5px"
            }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              style={{
                width: "100%",
                padding: "14px",
                background: "#0a0a0a",
                border: "1px solid #2a2a2a",
                borderRadius: "8px",
                color: "#fff",
                fontSize: "14px",
                outline: "none",
                transition: "border 0.3s"
              }}
              onFocus={(e) => e.target.style.border = "1px solid #667eea"}
              onBlur={(e) => e.target.style.border = "1px solid #2a2a2a"}
            />
          </div>

          {error && (
            <div style={{
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.3)",
              borderRadius: "8px",
              padding: "12px",
              marginBottom: "20px"
            }}>
              <p style={{
                fontSize: "13px",
                color: "#ef4444",
                margin: 0
              }}>{error}</p>
            </div>
          )}

          <button
            type="submit"
            style={{
              width: "100%",
              padding: "14px",
              background: loginType === "employee" 
                ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                : "linear-gradient(135deg, #10b981 0%, #059669 100%)",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              fontSize: "15px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "transform 0.2s",
              boxShadow: "0 4px 15px rgba(102,126,234,0.3)"
            }}
            onMouseOver={(e) => e.target.style.transform = "translateY(-2px)"}
            onMouseOut={(e) => e.target.style.transform = "translateY(0)"}
          >
            Sign In
          </button>
        </form>

        {/* Footer Info */}
        <div style={{
          marginTop: "25px",
          textAlign: "center"
        }}>
          <p style={{
            fontSize: "12px",
            color: "rgba(255,255,255,0.4)"
          }}>
            {loginType === "employee" 
              ? "Need access? Contact your system administrator"
              : "New client? Contact your account manager"}
          </p>
        </div>
      </div>
    </div>
  );
}
