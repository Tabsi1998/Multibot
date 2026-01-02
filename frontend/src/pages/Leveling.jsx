import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Trophy, Save, Plus, Trash2, Star } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Leveling() {
  const [config, setConfig] = useState({
    leveling_enabled: true,
    xp_per_message: 15,
    xp_cooldown: 60,
    level_up_channel: "",
    level_roles: {},
    ignored_channels: [],
  });
  const [newLevelRole, setNewLevelRole] = useState({ level: "", role: "" });
  const [newIgnoredChannel, setNewIgnoredChannel] = useState("");
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(false);
  const guildId = localStorage.getItem("guildId");

  useEffect(() => {
    if (guildId) {
      fetchConfig();
      fetchLeaderboard();
    }
  }, [guildId]);

  const fetchConfig = async () => {
    try {
      const res = await axios.get(`${API}/guilds/${guildId}`);
      setConfig({
        leveling_enabled: res.data.leveling_enabled ?? true,
        xp_per_message: res.data.xp_per_message || 15,
        xp_cooldown: res.data.xp_cooldown || 60,
        level_up_channel: res.data.level_up_channel || "",
        level_roles: res.data.level_roles || {},
        ignored_channels: res.data.ignored_channels || [],
      });
    } catch (e) {
      console.error(e);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const res = await axios.get(`${API}/guilds/${guildId}/leaderboard?limit=10`);
      setLeaderboard(res.data.leaderboard);
    } catch (e) {
      console.error(e);
    }
  };

  const saveConfig = async () => {
    if (!guildId) {
      toast.error("Bitte wähle zuerst einen Server");
      return;
    }
    setLoading(true);
    try {
      await axios.put(`${API}/guilds/${guildId}`, config);
      toast.success("Einstellungen gespeichert!");
    } catch (e) {
      toast.error("Fehler beim Speichern");
    }
    setLoading(false);
  };

  const addLevelRole = () => {
    if (!newLevelRole.level || !newLevelRole.role) {
      toast.error("Bitte Level und Rollen-ID eingeben");
      return;
    }
    setConfig({
      ...config,
      level_roles: {
        ...config.level_roles,
        [newLevelRole.level]: newLevelRole.role,
      },
    });
    setNewLevelRole({ level: "", role: "" });
  };

  const removeLevelRole = (level) => {
    const newRoles = { ...config.level_roles };
    delete newRoles[level];
    setConfig({ ...config, level_roles: newRoles });
  };

  const addIgnoredChannel = () => {
    if (!newIgnoredChannel) return;
    if (config.ignored_channels.includes(newIgnoredChannel)) {
      toast.error("Kanal bereits ignoriert");
      return;
    }
    setConfig({
      ...config,
      ignored_channels: [...config.ignored_channels, newIgnoredChannel],
    });
    setNewIgnoredChannel("");
  };

  const removeIgnoredChannel = (channelId) => {
    setConfig({
      ...config,
      ignored_channels: config.ignored_channels.filter((id) => id !== channelId),
    });
  };

  if (!guildId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">Bitte wähle zuerst einen Server im Dashboard aus</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Settings */}
        <div className="space-y-6">
          {/* Main Settings */}
          <Card className="bg-[#2B2D31] border-[#1E1F22]">
            <CardHeader>
              <CardTitle className="text-white font-[Outfit] flex items-center gap-2">
                <Trophy className="h-5 w-5 text-[#F0B232]" />
                Leveling System
              </CardTitle>
              <CardDescription className="text-gray-400">
                XP und Level Einstellungen
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Enable Switch */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-[#1E1F22]">
                <div>
                  <Label className="text-white font-medium">Leveling aktivieren</Label>
                  <p className="text-gray-400 text-sm">Benutzer verdienen XP für Nachrichten</p>
                </div>
                <Switch
                  checked={config.leveling_enabled}
                  onCheckedChange={(checked) =>
                    setConfig({ ...config, leveling_enabled: checked })
                  }
                  data-testid="leveling-toggle"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-300">XP pro Nachricht</Label>
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    value={config.xp_per_message}
                    onChange={(e) =>
                      setConfig({ ...config, xp_per_message: parseInt(e.target.value) })
                    }
                    className="bg-[#1E1F22] border-none text-white"
                    data-testid="xp-per-message-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Cooldown (Sekunden)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={300}
                    value={config.xp_cooldown}
                    onChange={(e) =>
                      setConfig({ ...config, xp_cooldown: parseInt(e.target.value) })
                    }
                    className="bg-[#1E1F22] border-none text-white"
                    data-testid="xp-cooldown-input"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-300">Level-Up Kanal ID</Label>
                <Input
                  placeholder="Kanal für Level-Up Nachrichten"
                  value={config.level_up_channel}
                  onChange={(e) => setConfig({ ...config, level_up_channel: e.target.value })}
                  className="bg-[#1E1F22] border-none text-white font-mono"
                  data-testid="level-up-channel-input"
                />
              </div>

              <Button
                onClick={saveConfig}
                disabled={loading}
                className="bg-[#5865F2] hover:bg-[#4752C4] text-white btn-press w-full"
                data-testid="save-leveling-btn"
              >
                <Save className="h-4 w-4 mr-2" />
                Speichern
              </Button>
            </CardContent>
          </Card>

          {/* Level Roles */}
          <Card className="bg-[#2B2D31] border-[#1E1F22]">
            <CardHeader>
              <CardTitle className="text-white font-[Outfit] flex items-center gap-2">
                <Star className="h-5 w-5 text-[#EB459E]" />
                Level Rollen
              </CardTitle>
              <CardDescription className="text-gray-400">
                Automatische Rollen bei bestimmten Leveln
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Level"
                  value={newLevelRole.level}
                  onChange={(e) =>
                    setNewLevelRole({ ...newLevelRole, level: e.target.value })
                  }
                  className="bg-[#1E1F22] border-none text-white w-24"
                  data-testid="level-role-level-input"
                />
                <Input
                  placeholder="Rollen-ID"
                  value={newLevelRole.role}
                  onChange={(e) =>
                    setNewLevelRole({ ...newLevelRole, role: e.target.value })
                  }
                  className="bg-[#1E1F22] border-none text-white font-mono flex-1"
                  data-testid="level-role-id-input"
                />
                <Button
                  onClick={addLevelRole}
                  className="bg-[#5865F2] hover:bg-[#4752C4] text-white btn-press"
                  data-testid="add-level-role-btn"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-2">
                {Object.entries(config.level_roles)
                  .sort(([a], [b]) => parseInt(a) - parseInt(b))
                  .map(([level, roleId]) => (
                    <div
                      key={level}
                      className="flex items-center justify-between p-3 rounded-lg bg-[#1E1F22]"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-[#F0B232] font-bold">Lvl {level}</span>
                        <span className="text-gray-400">→</span>
                        <span className="text-white font-mono text-sm">{roleId}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeLevelRole(level)}
                        className="text-gray-400 hover:text-[#DA373C]"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                {Object.keys(config.level_roles).length === 0 && (
                  <p className="text-gray-500 text-sm text-center py-4">
                    Keine Level Rollen konfiguriert
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Ignored Channels */}
          <Card className="bg-[#2B2D31] border-[#1E1F22]">
            <CardHeader>
              <CardTitle className="text-white font-[Outfit]">Ignorierte Kanäle</CardTitle>
              <CardDescription className="text-gray-400">
                In diesen Kanälen wird kein XP vergeben
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Kanal-ID"
                  value={newIgnoredChannel}
                  onChange={(e) => setNewIgnoredChannel(e.target.value)}
                  className="bg-[#1E1F22] border-none text-white font-mono"
                  data-testid="ignored-channel-input"
                />
                <Button
                  onClick={addIgnoredChannel}
                  className="bg-[#5865F2] hover:bg-[#4752C4] text-white btn-press"
                  data-testid="add-ignored-channel-btn"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                {config.ignored_channels.map((channelId) => (
                  <div
                    key={channelId}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-700/50 text-gray-300"
                  >
                    <span className="font-mono text-sm">{channelId}</span>
                    <button
                      onClick={() => removeIgnoredChannel(channelId)}
                      className="hover:text-[#DA373C]"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Leaderboard */}
        <Card className="bg-[#2B2D31] border-[#1E1F22] h-fit">
          <CardHeader>
            <CardTitle className="text-white font-[Outfit] flex items-center gap-2">
              <Trophy className="h-5 w-5 text-[#F0B232]" />
              Rangliste
            </CardTitle>
          </CardHeader>
          <CardContent>
            {leaderboard.length > 0 ? (
              <div className="space-y-3">
                {leaderboard.map((user, index) => (
                  <div
                    key={user.user_id}
                    className="flex items-center gap-4 p-4 rounded-lg bg-[#1E1F22]"
                  >
                    <span className="text-2xl w-10 text-center">
                      {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `#${index + 1}`}
                    </span>
                    <div className="flex-1">
                      <p className="text-white font-mono text-sm">{user.user_id}</p>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-[#F0B232]">Lvl {user.level}</span>
                        <span className="text-gray-500">•</span>
                        <span className="text-gray-400">{user.messages} Nachrichten</span>
                      </div>
                    </div>
                    <span className="text-[#5865F2] font-bold text-lg">
                      {user.xp.toLocaleString()} XP
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">Keine Benutzer in der Rangliste</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
