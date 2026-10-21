/**
 * App.js — AgroVision v2
 */

import React, { useState, useCallback, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import ChatPage from "./pages/ChatPage";
import OnionInfo from "./pages/OnionInfo";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Profile from "./pages/Profile";

import { HistoryContext } from "./context/HistoryContext";
import { LanguageProvider } from "./context/LanguageContext";
import { AuthProvider, useAuth } from "./context/AuthContext";

function MainApp() {

  const { user } = useAuth();

  const [history, setHistory] = useState([]);

  // Load history
  useEffect(() => {

    async function loadHistory() {

      if (user) {

        try {

          const res = await fetch(
            `http://127.0.0.1:8000/auth/history/${user.id}`
          );

          const data = await res.json();

          if (data.status === "success") {

            setHistory(data.history);

          }

        } catch (err) {

          console.error(err);

        }

      } else {

        const localHistory = JSON.parse(
          localStorage.getItem("agrovision_history") || "[]"
        );

        setHistory(localHistory);

      }

    }

    loadHistory();

  }, [user]);

  // Add prediction
  const addHistoryEntry = useCallback((entry) => {

    setHistory((prev) => {

      const updated = [entry, ...prev].slice(0, 50);

      if (!user) {

        localStorage.setItem(
          "agrovision_history",
          JSON.stringify(updated)
        );

      }

      return updated;

    });

  }, [user]);

  // Clear history
  const clearHistory = useCallback(() => {

    setHistory([]);

    if (!user) {

      localStorage.removeItem("agrovision_history");

    }

  }, [user]);

  return (

    <LanguageProvider>

      <HistoryContext.Provider
        value={{
          history,
          addHistoryEntry,
          clearHistory,
        }}
      >

        <div className="min-h-screen bg-gradient-to-br from-primary-50 via-secondary-50 to-highlight-50 flex flex-col">

          <Navbar />

          <main className="flex-1">

            <Routes>

              <Route path="/" element={<Home />} />

              <Route path="/dashboard" element={<Dashboard />} />

              <Route path="/chat" element={<ChatPage />} />

              <Route path="/onion-info" element={<OnionInfo />} />

              <Route path="/profile" element={<Profile />} />

              <Route path="/login" element={<Login />} />

              <Route path="/signup" element={<Signup />} />

              <Route path="*" element={<Navigate to="/" replace />} />

            </Routes>

          </main>

        </div>

      </HistoryContext.Provider>

    </LanguageProvider>

  );

}

function App() {

  return (

    <AuthProvider>

      <MainApp />

    </AuthProvider>

  );

}
export default App;