import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate, Navigate } from "react-router-dom";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import NavBarHeader from "./components/navBar";
import Dashboard from "./page/Dashboard";

function App() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(null); 
  const [userName, setUserName] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const clientID =
    "166908675306-m2dbp79c1nudmpe97lm93a5i8ntbcask.apps.googleusercontent.com";

  useEffect(() => {
    const checkAuth = () => {
      const authStatus = localStorage.getItem("isAuthenticated");
      const savedUserName = localStorage.getItem("userName");

      if (authStatus === "true" && savedUserName) {
        setIsAuthenticated(true);
        setUserName(savedUserName);
      } else {
        setIsAuthenticated(false);
      }
      setIsLoading(false);
    };

    checkAuth();

    // Disable scrolling when not authenticated
    if (isLoading || !isAuthenticated) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto'; // Restore scrolling when authenticated
    }

    // Cleanup when the component is unmounted or isLoading changes
    return () => {
      document.body.style.overflow = 'auto'; // Reset overflow when the component unmounts
    };
  }, [isLoading, isAuthenticated]);

  const handleLoginSuccess = (credentialResponse) => {
    console.log("Login Success:", credentialResponse);

    const decoded = JSON.parse(
      atob(credentialResponse.credential.split(".")[1])
    );
    const name = decoded.name;

    setIsAuthenticated(true);
    setUserName(name);

    localStorage.setItem("isAuthenticated", "true");
    localStorage.setItem("userName", name);

    navigate("/dashboard");
  };

  const handleLoginFailure = (error) => {
    console.log("Login Failed:", error);
    setIsAuthenticated(false);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserName("");
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("userName");
    navigate("/");
  };

  if (isLoading) {
    return <div>Loading...</div>; 
  }

  return (
    <div>
      <NavBarHeader userName={userName} handleLogout={handleLogout} />

      <Routes>
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <div className="container-fluid vh-100 d-flex justify-content-center align-items-center">
                <div className="text-center overflow-hidden">
                  <h1 className="mb-4">Please Login to Access Dashboard</h1>
                  <GoogleOAuthProvider clientId={clientID}>
                    <GoogleLogin
                      // width="250"
                      shape="pill"
                      size="medium"
                      text="continue_with"
                      onSuccess={handleLoginSuccess}
                      onError={handleLoginFailure}
                    />
                  </GoogleOAuthProvider>
                </div>
              </div>
            )
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute
              isAuthenticated={isAuthenticated}
              isLoading={isLoading}
            >
              <Dashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
}

function ProtectedRoute({ isAuthenticated, isLoading, children }) {
  if (isLoading) {
    return <div>Loading...</div>; 
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default App;
