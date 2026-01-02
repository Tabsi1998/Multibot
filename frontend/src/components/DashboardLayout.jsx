import { Outlet, NavLink, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Shield,
  Key,
  Volume2,
  Trophy,
  UserPlus,
  Terminal,
  Bot,
  Newspaper,
  Settings,
  Menu,
  X,
  Circle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const navItems = [
  { path: "/", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/moderation", icon: Shield, label: "Moderation" },
  { path: "/permissions", icon: Key, label: "Berechtigungen" },
  { path: "/temp-channels", icon: Volume2, label: "Temp Kanäle" },
  { path: "/leveling", icon: Trophy, label: "Leveling" },
  { path: "/welcome", icon: UserPlus, label: "Willkommen" },
  { path: "/commands", icon: Terminal, label: "Commands" },
  { path: "/ai", icon: Bot, label: "KI Chat" },
  { path: "/news", icon: Newspaper, label: "News" },
  { path: "/settings", icon: Settings, label: "Einstellungen" },
];

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [botStatus, setBotStatus] = useState({ running: false, token_configured: false });
  const location = useLocation();

  useEffect(() => {
    fetchBotStatus();
    const interval = setInterval(fetchBotStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchBotStatus = async () => {
    try {
      const res = await axios.get(`${API}/bot/status`);
      setBotStatus(res.data);
    } catch (e) {
      console.error("Failed to fetch bot status", e);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden noise-bg">
      {/* Mobile sidebar toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        data-testid="sidebar-toggle"
      >
        {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </Button>

      {/* Sidebar */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-64 bg-[#2B2D31] border-r border-[#1E1F22] transform transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
        data-testid="sidebar"
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-[#1E1F22]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#5865F2] to-[#EB459E] flex items-center justify-center">
                <Bot className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-lg text-white tracking-tight font-[Outfit]">
                  MultiBot
                </h1>
                <p className="text-xs text-gray-400">Command Center</p>
              </div>
            </div>
          </div>

          {/* Bot Status */}
          <div className="px-4 py-3 border-b border-[#1E1F22]">
            <div className="flex items-center gap-2">
              <Circle
                className={`h-3 w-3 ${
                  botStatus.running ? "fill-[#23A559] text-[#23A559]" : "fill-gray-500 text-gray-500"
                }`}
              />
              <span className="text-sm text-gray-300">
                {botStatus.running ? "Bot Online" : "Bot Offline"}
              </span>
            </div>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 py-4">
            <nav className="px-3 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  location.pathname === item.path ||
                  (item.path !== "/" && location.pathname.startsWith(item.path));

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    data-testid={`nav-${item.path.replace("/", "") || "dashboard"}`}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? "bg-[#404249] text-white"
                        : "text-gray-400 hover:bg-[#3F4147] hover:text-gray-100"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </NavLink>
                );
              })}
            </nav>
          </ScrollArea>

          {/* Footer */}
          <div className="p-4 border-t border-[#1E1F22]">
            <p className="text-xs text-gray-500 text-center">
              © 2025 Discord MultiBot
            </p>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {/* Top bar */}
        <header className="sticky top-0 z-30 glass border-b border-[#1E1F22] px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white font-[Outfit] md:ml-0 ml-12">
              {navItems.find(
                (item) =>
                  item.path === location.pathname ||
                  (item.path !== "/" && location.pathname.startsWith(item.path))
              )?.label || "Dashboard"}
            </h2>
            <div className="flex items-center gap-3">
              <div
                className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                  botStatus.token_configured
                    ? "badge-success"
                    : "badge-error"
                }`}
              >
                {botStatus.token_configured ? "Token konfiguriert" : "Token fehlt"}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="p-6 relative z-10">
          <Outlet />
        </div>
      </main>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
