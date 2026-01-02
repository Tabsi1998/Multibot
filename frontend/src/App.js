import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import DashboardLayout from "@/components/DashboardLayout";
import Dashboard from "@/pages/Dashboard";
import Moderation from "@/pages/Moderation";
import Permissions from "@/pages/Permissions";
import TempChannels from "@/pages/TempChannels";
import Leveling from "@/pages/Leveling";
import Welcome from "@/pages/Welcome";
import CustomCommands from "@/pages/CustomCommands";
import AISettings from "@/pages/AISettings";
import News from "@/pages/News";
import Settings from "@/pages/Settings";
import "@/App.css";

function App() {
  return (
    <div className="App min-h-screen bg-[#313338]">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<DashboardLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="moderation" element={<Moderation />} />
            <Route path="permissions" element={<Permissions />} />
            <Route path="temp-channels" element={<TempChannels />} />
            <Route path="leveling" element={<Leveling />} />
            <Route path="welcome" element={<Welcome />} />
            <Route path="commands" element={<CustomCommands />} />
            <Route path="ai" element={<AISettings />} />
            <Route path="news" element={<News />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="bottom-right" richColors />
    </div>
  );
}

export default App;
