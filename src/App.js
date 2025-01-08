import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate, Navigate } from "react-router-dom";
import { GoogleOAuthProvider, useGoogleLogin } from "@react-oauth/google";
import NavBarHeader from "./components/navBar";
import Dashboard from "./page/Dashboard";

function App() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [userName, setUserName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [accessToken, setAccessToken] = useState(null);

  const clientID = "33502154602-a2nbhf8mdce66g1u2t0sk6ad4cbfnf54.apps.googleusercontent.com";

  // Check authentication status on page load
  useEffect(() => {
    const checkAuth = () => {
      const authStatus = localStorage.getItem("isAuthenticated") === "true";
      const savedUserName = localStorage.getItem("userName");
      const token = localStorage.getItem("accessToken");

      if (authStatus && savedUserName && token) {
        setIsAuthenticated(true);
        setUserName(savedUserName);
        setAccessToken(token);
      } else {
        setIsAuthenticated(false);
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      console.log("OAuth2 Token Response:", tokenResponse);
      
      try {
        const userInfoResponse = await fetch(
          'https://www.googleapis.com/oauth2/v3/userinfo',
          {
            headers: {
              Authorization: `Bearer ${tokenResponse.access_token}`,
            },
          }
        );
        
        const userInfo = await userInfoResponse.json();
        console.log("User Info:", userInfo);
        setIsAuthenticated(true);
        setUserName(userInfo.name);
        setAccessToken(tokenResponse.access_token);
        
        localStorage.setItem("isAuthenticated", "true");
        localStorage.setItem("userName", userInfo.name);
        localStorage.setItem("accessToken", tokenResponse.access_token);
        
        navigate("/dashboard");
      } catch (error) {
        console.error("Error fetching user info:", error);
        handleLoginFailure(error);
      }
    },
    onError: (error) => handleLoginFailure(error),
    scope: "https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/userinfo.profile"
  });

  const handleLoginFailure = (error) => {
    console.log("Login Failed:", error);
    setIsAuthenticated(false);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserName("");
    setAccessToken(null);
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("userName");
    localStorage.removeItem("accessToken");
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
                    <button 
                      onClick={() => login()} 
                      className="btn btn-primary"
                    >
                      Continue with Google
                    </button>
                  </GoogleOAuthProvider>
                </div>
              </div>
            )
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated} isLoading={isLoading}>
              <Dashboard token={accessToken} userName={userName} />
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