import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Gamepad2,
  Dices,
  Target,
  Map,
  Hash,
  Trophy,
  Users,
  Clock,
  Settings,
  Save,
  RefreshCw,
  Play,
  Crown,
} from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Games() {
  const [config, setConfig] = useState({
    games_enabled: true,
    games_channel: "",
  });
  const [activeGames, setActiveGames] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);
  const guildId = localStorage.getItem("guildId");

  const getAuthHeader = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => {
    if (guildId) {
      fetchConfig();
      fetchActiveGames();
      fetchStats();
    }
  }, [guildId]);

  const fetchConfig = async () => {
    try {
      const res = await axios.get(`${API}/guilds/${guildId}`, {
        headers: getAuthHeader(),
      });
      setConfig((prev) => ({ ...prev, ...res.data }));
    } catch (e) {
      console.error(e);
    }
  };

  const fetchActiveGames = async () => {
    try {
      const res = await axios.get(`${API}/guilds/${guildId}/games`, {
        headers: getAuthHeader(),
      });
      setActiveGames(res.data.games || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await axios.get(`${API}/guilds/${guildId}/games/stats`, {
        headers: getAuthHeader(),
      });
      setStats(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const saveConfig = async () => {
    setLoading(true);
    try {
      await axios.put(`${API}/guilds/${guildId}`, config, {
        headers: getAuthHeader(),
      });
      toast.success("Spiele-Einstellungen gespeichert!");
    } catch (e) {
      toast.error("Fehler beim Speichern");
    }
    setLoading(false);
  };

  const games = [
    {
      id: "tictactoe",
      name: "Tic Tac Toe",
      icon: Target,
      color: "#5865F2",
      players: "2 Spieler",
      desc: "Das klassische X und O Spiel. Wer schafft 3 in einer Reihe?",
      command: "/game tictactoe @Gegner",
    },
    {
      id: "stadtlandfluss",
      name: "Stadt Land Fluss",
      icon: Map,
      color: "#23A559",
      players: "2-4 Spieler",
      desc: "Der Klassiker! Finde Wörter zu Kategorien mit dem gleichen Anfangsbuchstaben.",
      command: "/game stadtlandfluss @Spieler2 [@Spieler3] [@Spieler4]",
    },
    {
      id: "coinflip",
      name: "Münzwurf",
      icon: Dices,
      color: "#F0B232",
      players: "1 Spieler",
      desc: "Wirf eine virtuelle Münze - Kopf oder Zahl?",
      command: "/game coinflip",
    },
    {
      id: "dice",
      name: "Würfeln",
      icon: Dices,
      color: "#EB459E",
      players: "1 Spieler",
      desc: "Würfle einen Würfel mit beliebig vielen Seiten.",
      command: "/game dice [Seiten]",
    },
    {
      id: "rps",
      name: "Schere Stein Papier",
      icon: Target,
      color: "#DA373C",
      players: "1 Spieler",
      desc: "Spiele gegen den Bot - wer gewinnt?",
      command: "/game rps",
    },
    {
      id: "8ball",
      name: "8-Ball",
      icon: Target,
      color: "#9146FF",
      players: "1 Spieler",
      desc: "Stelle der magischen 8-Ball eine Ja/Nein Frage.",
      command: "/game 8ball [Frage]",
    },
  ];

  const getGameIcon = (type) => {
    const game = games.find(g => g.id === type);
    return game?.icon || Gamepad2;
  };

  const getGameColor = (type) => {
    const game = games.find(g => g.id === type);
    return game?.color || "#5865F2";
  };

  if (!guildId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Gamepad2 className="h-12 w-12 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400">Bitte wähle zuerst einen Server im Dashboard</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white font-[Outfit] flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#9146FF]/20">
              <Gamepad2 className="h-6 w-6 text-[#9146FF]" />
            </div>
            Discord Spiele
          </h1>
          <p className="text-gray-400 mt-1">
            Spiele direkt in Discord mit Freunden oder alleine
          </p>
        </div>
        <Button
          onClick={saveConfig}
          disabled={loading}
          className="bg-[#5865F2] hover:bg-[#4752C4] text-white"
        >
          <Save className="h-4 w-4 mr-2" />
          Speichern
        </Button>
      </div>

      {/* Settings */}
      <Card className="bg-[#2B2D31] border-[#1E1F22]">
        <CardHeader>
          <CardTitle className="text-white font-[Outfit] flex items-center gap-2">
            <Settings className="h-5 w-5 text-gray-400" />
            Einstellungen
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg ${config.games_enabled ? "bg-[#23A559]/20" : "bg-gray-500/20"}`}>
                <Gamepad2 className={`h-6 w-6 ${config.games_enabled ? "text-[#23A559]" : "text-gray-500"}`} />
              </div>
              <div>
                <p className="text-white font-medium">Spiele aktivieren</p>
                <p className="text-sm text-gray-400">Erlaube Benutzern Spiele auf diesem Server</p>
              </div>
            </div>
            <Switch
              checked={config.games_enabled}
              onCheckedChange={(v) => setConfig({ ...config, games_enabled: v })}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-gray-300">Spiele-Kanal (optional)</Label>
            <Input
              placeholder="Kanal ID - leer für überall"
              value={config.games_channel || ""}
              onChange={(e) => setConfig({ ...config, games_channel: e.target.value })}
              className="bg-[#1E1F22] border-none text-white font-mono"
            />
            <p className="text-xs text-gray-500">
              Wenn gesetzt, können Spiele nur in diesem Kanal gestartet werden
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-[#2B2D31] border-[#1E1F22]">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-[#5865F2]/20">
                <Play className="h-6 w-6 text-[#5865F2]" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Gespielte Spiele</p>
                <p className="text-2xl font-bold text-white">{stats.total_games || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#2B2D31] border-[#1E1F22]">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-[#23A559]/20">
                <Users className="h-6 w-6 text-[#23A559]" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Aktive Spiele</p>
                <p className="text-2xl font-bold text-white">{activeGames.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#2B2D31] border-[#1E1F22]">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-[#F0B232]/20">
                <Trophy className="h-6 w-6 text-[#F0B232]" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Top Spieler</p>
                <p className="text-2xl font-bold text-white">{stats.top_player || "-"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Available Games */}
      <Card className="bg-[#2B2D31] border-[#1E1F22]">
        <CardHeader>
          <CardTitle className="text-white font-[Outfit] flex items-center gap-2">
            <Gamepad2 className="h-5 w-5 text-[#9146FF]" />
            Verfügbare Spiele
          </CardTitle>
          <CardDescription className="text-gray-400">
            Alle Spiele die auf deinem Server gespielt werden können
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {games.map((game) => {
              const Icon = game.icon;
              return (
                <div
                  key={game.id}
                  className="p-4 rounded-lg bg-[#1E1F22] hover:bg-[#1E1F22]/80 transition-colors border-l-4"
                  style={{ borderColor: game.color }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: `${game.color}20` }}
                    >
                      <Icon className="h-5 w-5" style={{ color: game.color }} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="text-white font-medium">{game.name}</h3>
                        <span className="text-xs px-2 py-0.5 rounded bg-gray-700 text-gray-300">
                          {game.players}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400 mt-1">{game.desc}</p>
                      <code className="text-xs mt-2 block text-[#5865F2] bg-[#2B2D31] px-2 py-1 rounded">
                        {game.command}
                      </code>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Active Games */}
      <Card className="bg-[#2B2D31] border-[#1E1F22]">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-white font-[Outfit] flex items-center gap-2">
              <Clock className="h-5 w-5 text-[#F0B232]" />
              Aktive Spiele ({activeGames.length})
            </CardTitle>
            <CardDescription className="text-gray-400">
              Aktuell laufende Spiele auf deinem Server
            </CardDescription>
          </div>
          <Button
            onClick={fetchActiveGames}
            variant="ghost"
            size="icon"
            className="text-gray-400 hover:text-white"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {activeGames.length > 0 ? (
            <div className="space-y-3">
              {activeGames.map((game) => {
                const Icon = getGameIcon(game.game_type);
                const color = getGameColor(game.game_type);
                return (
                  <div
                    key={game.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-[#1E1F22]"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className="p-2 rounded-lg"
                        style={{ backgroundColor: `${color}20` }}
                      >
                        <Icon className="h-5 w-5" style={{ color }} />
                      </div>
                      <div>
                        <p className="text-white font-medium capitalize">
                          {game.game_type?.replace("_", " ")}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Crown className="h-3 w-3" />
                            {game.player1_id?.slice(0, 8)}...
                          </span>
                          {game.player2_id && (
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              vs {game.player2_id?.slice(0, 8)}...
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Hash className="h-3 w-3" />
                            {game.channel_id?.slice(0, 8)}...
                          </span>
                        </div>
                      </div>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        game.status === "active"
                          ? "bg-[#23A559]/20 text-[#23A559]"
                          : game.status === "waiting"
                          ? "bg-[#F0B232]/20 text-[#F0B232]"
                          : "bg-gray-500/20 text-gray-400"
                      }`}
                    >
                      {game.status === "active" ? "Läuft" : game.status === "waiting" ? "Wartet" : game.status}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Gamepad2 className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">Keine aktiven Spiele</p>
              <p className="text-gray-500 text-sm mt-1">
                Starte ein Spiel in Discord mit einem der Befehle oben
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* All Commands */}
      <Card className="bg-[#2B2D31] border-[#1E1F22]">
        <CardHeader>
          <CardTitle className="text-white font-[Outfit]">Alle Spiel-Befehle</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { cmd: "/game tictactoe @user", desc: "Starte TicTacToe gegen jemanden" },
              { cmd: "/game stadtlandfluss @user", desc: "Starte Stadt Land Fluss" },
              { cmd: "/game coinflip", desc: "Wirf eine Münze" },
              { cmd: "/game dice [seiten]", desc: "Würfle einen Würfel" },
              { cmd: "/game rps", desc: "Schere Stein Papier gegen den Bot" },
              { cmd: "/game 8ball [frage]", desc: "Frage die magische 8-Ball" },
            ].map((item) => (
              <div
                key={item.cmd}
                className="p-3 rounded-lg bg-[#1E1F22] flex items-center gap-3"
              >
                <code className="text-[#9146FF] text-sm font-mono">{item.cmd}</code>
                <span className="text-gray-400 text-sm">{item.desc}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
