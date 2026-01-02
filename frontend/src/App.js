import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import DashboardLayout from "@/components/DashboardLayout";
import AuthPage from "@/pages/AuthPage";
import Dashboard from "@/pages/Dashboard";
import Moderation from "@/pages/Moderation";
import Permissions from "@/pages/Permissions";
import TempChannels from "@/pages/TempChannels";
import ReactionRoles from "@/pages/ReactionRoles";
import Games from "@/pages/Games";
import Tickets from "@/pages/Tickets";
import Leveling from "@/pages/Leveling";
import Welcome from "@/pages/Welcome";
import CustomCommands from "@/pages/CustomCommands";
import AISettings from "@/pages/AISettings";
import News from "@/pages/News";
import Settings from "@/pages/Settings";
import UserManagement from "@/pages/UserManagement";
import "@/App.css";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const savedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    
    if (savedUser && token) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#313338] flex items-center justify-center">
        <div className="animate-pulse text-white">Laden...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <AuthPage onLogin={handleLogin} />
        <Toaster position="bottom-right" richColors />
      </>
    );
  }

  return (
    <div className="App min-h-screen bg-[#313338]">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<DashboardLayout user={user} onLogout={handleLogout} />}>
            <Route index element={<Dashboard />} />
            <Route path="moderation" element={<Moderation />} />
            <Route path="permissions" element={<Permissions />} />
            <Route path="temp-channels" element={<TempChannels />} />
            <Route path="reaction-roles" element={<ReactionRoles />} />
            <Route path="games" element={<Games />} />
            <Route path="leveling" element={<Leveling />} />
            <Route path="welcome" element={<Welcome />} />
            <Route path="commands" element={<CustomCommands />} />
            <Route path="ai" element={<AISettings />} />
            <Route path="news" element={<News />} />
            <Route path="settings" element={<Settings />} />
            <Route path="users" element={<UserManagement />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="bottom-right" richColors />
    </div>
  );
}

export default App;
