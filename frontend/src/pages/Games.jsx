import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
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
  HelpCircle,
  Swords,
  Puzzle,
  Brain,
  Globe,
  Music,
  Calculator,
  MessageCircle,
  Zap,
  Heart,
} from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { TextChannelSelector } from "@/components/ServerDataSelector";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// All available games with full configuration
const AVAILABLE_GAMES = [
  {
    id: "tictactoe",
    name: "Tic Tac Toe",
    icon: Target,
    color: "#5865F2",
    players: "2 Spieler",
    desc: "Das klassische X und O Spiel. Wer schafft 3 in einer Reihe?",
    command: "/game tictactoe @Gegner",
    category: "klassiker",
  },
  {
    id: "stadtlandfluss",
    name: "Stadt Land Fluss",
    icon: Map,
    color: "#23A559",
    players: "2-4 Spieler",
    desc: "Der Klassiker! Finde Wörter zu Kategorien mit dem gleichen Anfangsbuchstaben.",
    command: "/game stadtlandfluss @Spieler2",
    category: "wissen",
  },
  {
    id: "coinflip",
    name: "Münzwurf",
    icon: Dices,
    color: "#F0B232",
    players: "1 Spieler",
    desc: "Wirf eine virtuelle Münze - Kopf oder Zahl?",
    command: "/game coinflip",
    category: "zufall",
  },
  {
    id: "dice",
    name: "Würfeln",
    icon: Dices,
    color: "#EB459E",
    players: "1 Spieler",
    desc: "Würfle einen Würfel mit beliebig vielen Seiten (2-100).",
    command: "/game dice [Seiten]",
    category: "zufall",
  },
  {
    id: "rps",
    name: "Schere Stein Papier",
    icon: Swords,
    color: "#DA373C",
    players: "1 Spieler",
    desc: "Spiele gegen den Bot - wer gewinnt?",
    command: "/game rps",
    category: "klassiker",
  },
  {
    id: "8ball",
    name: "Magische 8-Ball",
    icon: HelpCircle,
    color: "#9146FF",
    players: "1 Spieler",
    desc: "Stelle der magischen 8-Ball eine Ja/Nein Frage.",
    command: "/game 8ball [Frage]",
    category: "spass",
  },
  {
    id: "hangman",
    name: "Galgenmännchen",
    icon: MessageCircle,
    color: "#FF6B6B",
    players: "1+ Spieler",
    desc: "Rate das Wort Buchstabe für Buchstabe bevor das Männchen hängt!",
    command: "/game hangman",
    category: "wissen",
  },
  {
    id: "trivia",
    name: "Quiz / Trivia",
    icon: Brain,
    color: "#4ECDC4",
    players: "1+ Spieler",
    desc: "Teste dein Wissen mit zufälligen Quizfragen aus verschiedenen Kategorien.",
    command: "/game trivia [Kategorie]",
    category: "wissen",
  },
  {
    id: "numberguess",
    name: "Zahlenraten",
    icon: Calculator,
    color: "#45B7D1",
    players: "1 Spieler",
    desc: "Rate eine Zahl zwischen 1 und 100. Höher oder niedriger?",
    command: "/game numberguess",
    category: "zufall",
  },
  {
    id: "wordchain",
    name: "Wortkette",
    icon: Puzzle,
    color: "#96CEB4",
    players: "2+ Spieler",
    desc: "Finde ein Wort das mit dem letzten Buchstaben des vorherigen beginnt!",
    command: "/game wordchain",
    category: "wissen",
  },
  {
    id: "reaction",
    name: "Reaktionstest",
    icon: Zap,
    color: "#FFE66D",
    players: "1+ Spieler",
    desc: "Wer reagiert am schnellsten? Klicke den Button sobald er erscheint!",
    command: "/game reaction",
    category: "geschick",
  },
  {
    id: "memory",
    name: "Memory",
    icon: Heart,
    color: "#F38181",
    players: "1-2 Spieler",
    desc: "Finde die passenden Emoji-Paare! Trainiere dein Gedächtnis.",
    command: "/game memory [@Gegner]",
    category: "geschick",
  },
];

const CATEGORIES = [
  { id: "all", name: "Alle Spiele", icon: Gamepad2 },
  { id: "klassiker", name: "Klassiker", icon: Trophy },
  { id: "wissen", name: "Wissen", icon: Brain },
  { id: "zufall", name: "Zufall", icon: Dices },
  { id: "geschick", name: "Geschicklichkeit", icon: Zap },
  { id: "spass", name: "Spaß", icon: Music },
];

export default function Games() {
  const [config, setConfig] = useState({
    games_enabled: true,
    games_channel: "",
    disabled_games: [],
    game_cooldown: 30,
    max_active_games: 5,
  });
  const [activeGames, setActiveGames] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const guildId = localStorage.getItem("guildId");

  const getAuthHeader = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchConfig = async () => {
    try {
      const res = await axios.get(`${API}/guilds/${guildId}`, {
        headers: getAuthHeader(),
      });
      setConfig((prev) => ({ 
        ...prev, 
        ...res.data,
        disabled_games: res.data.disabled_games || [],
      }));
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

  useEffect(() => {
    if (guildId) {
      fetchConfig();
      fetchActiveGames();
      fetchStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guildId]);

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

  const toggleGame = (gameId) => {
    const disabled = config.disabled_games || [];
    if (disabled.includes(gameId)) {
      setConfig({
        ...config,
        disabled_games: disabled.filter(g => g !== gameId),
      });
    } else {
      setConfig({
        ...config,
        disabled_games: [...disabled, gameId],
      });
    }
  };

  const isGameEnabled = (gameId) => {
    return !(config.disabled_games || []).includes(gameId);
  };

  const enableAllGames = () => {
    setConfig({ ...config, disabled_games: [] });
  };

  const disableAllGames = () => {
    setConfig({ 
      ...config, 
      disabled_games: AVAILABLE_GAMES.map(g => g.id),
    });
  };

  const filteredGames = selectedCategory === "all" 
    ? AVAILABLE_GAMES 
    : AVAILABLE_GAMES.filter(g => g.category === selectedCategory);

  const enabledCount = AVAILABLE_GAMES.filter(g => isGameEnabled(g.id)).length;

  const getGameIcon = (type) => {
    const game = AVAILABLE_GAMES.find(g => g.id === type);
    return game?.icon || Gamepad2;
  };

  const getGameColor = (type) => {
    const game = AVAILABLE_GAMES.find(g => g.id === type);
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
            {AVAILABLE_GAMES.length} Spiele verfügbar • {enabledCount} aktiviert
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

      {/* Global Settings */}
      <Card className="bg-[#2B2D31] border-[#1E1F22]">
        <CardHeader>
          <CardTitle className="text-white font-[Outfit] flex items-center gap-2">
            <Settings className="h-5 w-5 text-gray-400" />
            Globale Einstellungen
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-gray-300">Spiele-Kanal (optional)</Label>
              <TextChannelSelector
                value={config.games_channel || ""}
                onChange={(v) => setConfig({ ...config, games_channel: v })}
                placeholder="Überall erlauben"
                guildId={guildId}
              />
              <p className="text-xs text-gray-500">
                Wenn gesetzt, können Spiele nur in diesem Kanal gestartet werden
              </p>
            </div>

            <div className="space-y-3">
              <Label className="text-gray-300">Cooldown zwischen Spielen: {config.game_cooldown}s</Label>
              <Slider
                value={[config.game_cooldown || 30]}
                onValueChange={([v]) => setConfig({ ...config, game_cooldown: v })}
                max={300}
                min={0}
                step={10}
              />
              <p className="text-xs text-gray-500">
                Zeit die ein Benutzer warten muss bevor er ein neues Spiel starten kann
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-[#404249]">
            <Button
              variant="outline"
              onClick={enableAllGames}
              className="border-[#23A559] text-[#23A559] hover:bg-[#23A559]/10"
            >
              Alle aktivieren
            </Button>
            <Button
              variant="outline"
              onClick={disableAllGames}
              className="border-[#DA373C] text-[#DA373C] hover:bg-[#DA373C]/10"
            >
              Alle deaktivieren
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="bg-[#2B2D31] border-[#1E1F22]">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-[#5865F2]/20">
                <Play className="h-6 w-6 text-[#5865F2]" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Gespielt</p>
                <p className="text-2xl font-bold text-white">{stats.total_games || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#2B2D31] border-[#1E1F22]">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-[#23A559]/20">
                <Gamepad2 className="h-6 w-6 text-[#23A559]" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Aktiviert</p>
                <p className="text-2xl font-bold text-white">{enabledCount}/{AVAILABLE_GAMES.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#2B2D31] border-[#1E1F22]">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-[#F0B232]/20">
                <Users className="h-6 w-6 text-[#F0B232]" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Aktiv</p>
                <p className="text-2xl font-bold text-white">{activeGames.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#2B2D31] border-[#1E1F22]">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-[#EB459E]/20">
                <Trophy className="h-6 w-6 text-[#EB459E]" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Top Spieler</p>
                <p className="text-xl font-bold text-white truncate">{stats.top_player || "-"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = selectedCategory === cat.id;
          return (
            <Button
              key={cat.id}
              variant={isActive ? "default" : "outline"}
              onClick={() => setSelectedCategory(cat.id)}
              className={isActive 
                ? "bg-[#5865F2] hover:bg-[#4752C4] text-white" 
                : "border-[#404249] text-gray-300 hover:text-white hover:border-[#5865F2]"
              }
            >
              <Icon className="h-4 w-4 mr-2" />
              {cat.name}
            </Button>
          );
        })}
      </div>

      {/* Available Games Grid */}
      <Card className="bg-[#2B2D31] border-[#1E1F22]">
        <CardHeader>
          <CardTitle className="text-white font-[Outfit] flex items-center gap-2">
            <Gamepad2 className="h-5 w-5 text-[#9146FF]" />
            Spiele konfigurieren
          </CardTitle>
          <CardDescription className="text-gray-400">
            Aktiviere oder deaktiviere einzelne Spiele für deinen Server
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredGames.map((game) => {
              const Icon = game.icon;
              const enabled = isGameEnabled(game.id);
              return (
                <div
                  key={game.id}
                  className={`p-4 rounded-lg border-l-4 transition-all ${
                    enabled 
                      ? "bg-[#1E1F22] hover:bg-[#1E1F22]/80" 
                      : "bg-[#1E1F22]/50 opacity-60"
                  }`}
                  style={{ borderColor: enabled ? game.color : "#404249" }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      <div
                        className={`p-2 rounded-lg transition-colors ${
                          enabled ? "" : "grayscale"
                        }`}
                        style={{ backgroundColor: `${game.color}20` }}
                      >
                        <Icon 
                          className="h-5 w-5" 
                          style={{ color: enabled ? game.color : "#666" }} 
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className={`font-medium truncate ${enabled ? "text-white" : "text-gray-500"}`}>
                            {game.name}
                          </h3>
                          <span className={`text-xs px-1.5 py-0.5 rounded ${
                            enabled ? "bg-gray-700 text-gray-300" : "bg-gray-800 text-gray-500"
                          }`}>
                            {game.players}
                          </span>
                        </div>
                        <p className={`text-sm mt-1 line-clamp-2 ${
                          enabled ? "text-gray-400" : "text-gray-600"
                        }`}>
                          {game.desc}
                        </p>
                        <code className={`text-xs mt-2 block px-2 py-1 rounded truncate ${
                          enabled 
                            ? "text-[#5865F2] bg-[#2B2D31]" 
                            : "text-gray-600 bg-[#1E1F22]"
                        }`}>
                          {game.command}
                        </code>
                      </div>
                    </div>
                    <Switch
                      checked={enabled}
                      onCheckedChange={() => toggleGame(game.id)}
                    />
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
          <Button onClick={fetchActiveGames} variant="ghost" size="icon" className="text-gray-400 hover:text-white">
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
                      <div className="p-2 rounded-lg" style={{ backgroundColor: `${color}20` }}>
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
                        </div>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${
                      game.status === "active"
                        ? "bg-[#23A559]/20 text-[#23A559]"
                        : "bg-[#F0B232]/20 text-[#F0B232]"
                    }`}>
                      {game.status === "active" ? "Läuft" : "Wartet"}
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
                Starte ein Spiel in Discord mit einem der Befehle
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {AVAILABLE_GAMES.filter(g => isGameEnabled(g.id)).map((game) => (
              <div key={game.id} className="p-3 rounded-lg bg-[#1E1F22] flex items-center gap-3">
                <code className="text-[#9146FF] text-sm font-mono">{game.command}</code>
              </div>
            ))}
          </div>
          {enabledCount === 0 && (
            <p className="text-center text-gray-500 py-4">Keine Spiele aktiviert</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
