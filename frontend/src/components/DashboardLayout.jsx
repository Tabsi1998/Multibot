import { Outlet, NavLink, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Shield,
  Key,
  Mic,
  Tags,
  Gamepad2,
  Ticket,
  Trophy,
  UserPlus,
  Terminal,
  Bot,
  Newspaper,
  Settings,
  Menu,
  X,
  Circle,
  LogOut,
  Users,
  Crown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const navItems = [
  { path: "/", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/moderation", icon: Shield, label: "Moderation" },
  { path: "/permissions", icon: Key, label: "Berechtigungen" },
  { path: "/temp-channels", icon: Mic, label: "Temp Kanäle" },
  { path: "/reaction-roles", icon: Tags, label: "Reaction Roles" },
  { path: "/games", icon: Gamepad2, label: "Spiele" },
  { path: "/tickets", icon: Ticket, label: "Tickets" },
  { path: "/leveling", icon: Trophy, label: "Leveling" },
  { path: "/welcome", icon: UserPlus, label: "Willkommen" },
  { path: "/commands", icon: Terminal, label: "Commands" },
  { path: "/ai", icon: Bot, label: "KI Chat" },
  { path: "/news", icon: Newspaper, label: "News" },
  { path: "/settings", icon: Settings, label: "Einstellungen" },
];

const adminNavItems = [
  { path: "/users", icon: Users, label: "Benutzer", adminOnly: true },
];

export default function DashboardLayout({ user, onLogout }) {
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

  const allNavItems = user?.is_admin 
    ? [...navItems, ...adminNavItems] 
    : navItems;

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
              {allNavItems.map((item) => {
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
                    } ${item.adminOnly ? "border-l-2 border-[#EB459E]" : ""}`}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                    {item.adminOnly && (
                      <Crown className="h-3 w-3 text-[#EB459E] ml-auto" />
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </ScrollArea>

          {/* User Section */}
          <div className="p-4 border-t border-[#1E1F22]">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-[#3F4147] transition-colors"
                  data-testid="user-menu-trigger"
                >
                  <div className="w-8 h-8 rounded-full bg-[#5865F2] flex items-center justify-center text-white font-bold text-sm">
                    {user?.username?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-white truncate">
                      {user?.username || "Benutzer"}
                    </p>
                    <p className="text-xs text-gray-400 flex items-center gap-1">
                      {user?.is_admin ? (
                        <>
                          <Crown className="h-3 w-3 text-[#EB459E]" />
                          Admin
                        </>
                      ) : (
                        "Benutzer"
                      )}
                    </p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 bg-[#1E1F22] border-[#404249]"
              >
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium text-white">{user?.username}</p>
                  <p className="text-xs text-gray-400">{user?.email}</p>
                </div>
                <DropdownMenuSeparator className="bg-[#404249]" />
                <DropdownMenuItem
                  onClick={onLogout}
                  className="text-[#DA373C] hover:text-white hover:bg-[#DA373C] cursor-pointer"
                  data-testid="logout-btn"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Abmelden
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {/* Top bar */}
        <header className="sticky top-0 z-30 glass border-b border-[#1E1F22] px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white font-[Outfit] md:ml-0 ml-12">
              {allNavItems.find(
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
