import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Users,
  AlertTriangle,
  Terminal,
  Newspaper,
  Trophy,
  Play,
  Square,
  RefreshCw,
  FileText,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [botStatus, setBotStatus] = useState({ running: false, token_configured: false });
  const [guildId, setGuildId] = useState("");
  const [loading, setLoading] = useState(false);
  const [botLogs, setBotLogs] = useState({ logs: "", errors: "" });
  const [showLogs, setShowLogs] = useState(false);

  useEffect(() => {
    fetchBotStatus();
    // Load saved guild ID
    const savedGuildId = localStorage.getItem("guildId");
    if (savedGuildId) {
      setGuildId(savedGuildId);
      fetchStats(savedGuildId);
    }
  }, []);

  const fetchBotStatus = async () => {
    try {
      const res = await axios.get(`${API}/bot/status`);
      setBotStatus(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchBotLogs = async () => {
    try {
      const res = await axios.get(`${API}/bot/logs?lines=100`);
      setBotLogs(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchStats = async (id) => {
    if (!id) return;
    try {
      const res = await axios.get(`${API}/guilds/${id}/stats`);
      setStats(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleGuildIdSave = () => {
    localStorage.setItem("guildId", guildId);
    fetchStats(guildId);
    toast.success("Guild ID gespeichert");
  };

  const startBot = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${API}/bot/start`);
      toast.success(res.data.message || "Bot wird gestartet...");
      setTimeout(() => {
        fetchBotStatus();
        fetchBotLogs();
      }, 3000);
    } catch (e) {
      toast.error(e.response?.data?.detail || "Fehler beim Starten");
      fetchBotLogs();
    }
    setLoading(false);
  };

  const stopBot = async () => {
    setLoading(true);
    try {
      await axios.post(`${API}/bot/stop`);
      toast.success("Bot gestoppt");
      fetchBotStatus();
    } catch (e) {
      toast.error("Fehler beim Stoppen");
    }
    setLoading(false);
  };

  const statCards = [
    {
      title: "Benutzer",
      value: stats?.total_users || 0,
      icon: Users,
      color: "text-[#5865F2]",
      bg: "bg-[#5865F2]/10",
    },
    {
      title: "Verwarnungen",
      value: stats?.total_warnings || 0,
      icon: AlertTriangle,
      color: "text-[#F0B232]",
      bg: "bg-[#F0B232]/10",
    },
    {
      title: "Commands",
      value: stats?.total_commands || 0,
      icon: Terminal,
      color: "text-[#EB459E]",
      bg: "bg-[#EB459E]/10",
    },
    {
      title: "News",
      value: stats?.total_news || 0,
      icon: Newspaper,
      color: "text-[#23A559]",
      bg: "bg-[#23A559]/10",
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Guild ID Input */}
      <Card className="bg-[#2B2D31] border-[#1E1F22]">
        <CardHeader>
          <CardTitle className="text-white font-[Outfit]">Server auswählen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input
              placeholder="Guild/Server ID eingeben"
              value={guildId}
              onChange={(e) => setGuildId(e.target.value)}
              className="bg-[#1E1F22] border-none text-white placeholder:text-gray-500"
              data-testid="guild-id-input"
            />
            <Button
              onClick={handleGuildIdSave}
              className="bg-[#5865F2] hover:bg-[#4752C4] text-white btn-press"
              data-testid="save-guild-btn"
            >
              Speichern
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Rechtsklick auf deinen Server → "Server-ID kopieren" (Entwicklermodus erforderlich)
          </p>
        </CardContent>
      </Card>

      {/* Bot Control */}
      <Card className="bg-[#2B2D31] border-[#1E1F22]">
        <CardHeader>
          <CardTitle className="text-white font-[Outfit]">Bot Steuerung</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div
              className={`w-3 h-3 rounded-full ${
                botStatus.running ? "status-online" : "status-offline"
              }`}
            />
            <span className="text-gray-300">
              {botStatus.running ? "Bot ist online" : "Bot ist offline"}
            </span>
            <div className="flex-1" />
            {botStatus.running ? (
              <Button
                onClick={stopBot}
                disabled={loading}
                variant="destructive"
                className="btn-press"
                data-testid="stop-bot-btn"
              >
                <Square className="h-4 w-4 mr-2" />
                Stoppen
              </Button>
            ) : (
              <Button
                onClick={startBot}
                disabled={loading || !botStatus.token_configured}
                className="bg-[#23A559] hover:bg-[#1E8E4A] text-white btn-press"
                data-testid="start-bot-btn"
              >
                <Play className="h-4 w-4 mr-2" />
                Starten
              </Button>
            )}
            <Button
              onClick={fetchBotStatus}
              variant="ghost"
              size="icon"
              className="text-gray-400 hover:text-white"
              data-testid="refresh-status-btn"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
          {!botStatus.token_configured && (
            <p className="text-sm text-[#DA373C] mt-3">
              ⚠️ Bitte konfiguriere zuerst den Bot Token in den Einstellungen
            </p>
          )}
          
          {/* Bot Logs Section */}
          <div className="border-t border-[#1E1F22] pt-4">
            <button
              onClick={() => {
                setShowLogs(!showLogs);
                if (!showLogs) fetchBotLogs();
              }}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors w-full"
              data-testid="toggle-logs-btn"
            >
              <FileText className="h-4 w-4" />
              <span className="text-sm">Bot Logs anzeigen</span>
              {showLogs ? <ChevronUp className="h-4 w-4 ml-auto" /> : <ChevronDown className="h-4 w-4 ml-auto" />}
            </button>
            
            {showLogs && (
              <div className="mt-4 space-y-4">
                <div className="flex justify-end">
                  <Button
                    onClick={fetchBotLogs}
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-white"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Aktualisieren
                  </Button>
                </div>
                
                {/* Error Logs */}
                {botLogs.errors && (
                  <div>
                    <p className="text-[#DA373C] text-sm font-medium mb-2">❌ Fehler:</p>
                    <pre className="bg-[#1E1F22] p-3 rounded-lg text-xs text-[#DA373C] overflow-x-auto max-h-40 overflow-y-auto font-mono">
                      {botLogs.errors}
                    </pre>
                  </div>
                )}
                
                {/* Standard Logs */}
                {botLogs.logs && (
                  <div>
                    <p className="text-[#23A559] text-sm font-medium mb-2">📋 Logs:</p>
                    <pre className="bg-[#1E1F22] p-3 rounded-lg text-xs text-gray-300 overflow-x-auto max-h-40 overflow-y-auto font-mono">
                      {botLogs.logs}
                    </pre>
                  </div>
                )}
                
                {!botLogs.logs && !botLogs.errors && (
                  <p className="text-gray-500 text-sm text-center py-4">
                    Keine Logs verfügbar. Starte den Bot um Logs zu sehen.
                  </p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.title}
              className={`bg-[#2B2D31] border-[#1E1F22] card-hover animate-slide-up stagger-${
                index + 1
              }`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-lg ${stat.bg}`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">{stat.title}</p>
                    <p className="text-2xl font-bold text-white font-[Outfit]">
                      {stat.value.toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Leaderboard & Recent Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Users */}
        <Card className="bg-[#2B2D31] border-[#1E1F22]">
          <CardHeader>
            <CardTitle className="text-white font-[Outfit] flex items-center gap-2">
              <Trophy className="h-5 w-5 text-[#F0B232]" />
              Top Benutzer
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.top_users?.length > 0 ? (
              <div className="space-y-3">
                {stats.top_users.map((user, index) => (
                  <div
                    key={user.user_id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-[#1E1F22]"
                  >
                    <span className="text-lg font-bold text-gray-400 w-6">
                      {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `#${index + 1}`}
                    </span>
                    <div className="flex-1">
                      <p className="text-white font-medium font-mono text-sm">
                        {user.user_id.slice(0, 8)}...
                      </p>
                      <p className="text-xs text-gray-400">Level {user.level}</p>
                    </div>
                    <span className="text-[#5865F2] font-bold">
                      {user.xp.toLocaleString()} XP
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">Keine Daten verfügbar</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Mod Actions */}
        <Card className="bg-[#2B2D31] border-[#1E1F22]">
          <CardHeader>
            <CardTitle className="text-white font-[Outfit] flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-[#DA373C]" />
              Letzte Aktionen
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.recent_mod_actions?.length > 0 ? (
              <div className="space-y-3">
                {stats.recent_mod_actions.slice(0, 5).map((action) => (
                  <div
                    key={action.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-[#1E1F22]"
                  >
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        action.action === "ban"
                          ? "bg-[#DA373C]/20 text-[#DA373C]"
                          : action.action === "kick"
                          ? "bg-[#F0B232]/20 text-[#F0B232]"
                          : action.action === "warn"
                          ? "bg-[#EB459E]/20 text-[#EB459E]"
                          : "bg-gray-500/20 text-gray-400"
                      }`}
                    >
                      {action.action.toUpperCase()}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{action.reason}</p>
                      <p className="text-xs text-gray-500 font-mono">
                        {action.timestamp?.slice(0, 10)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">Keine Aktionen</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
