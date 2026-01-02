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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Trophy,
  Save,
  Plus,
  Trash2,
  Star,
  Mic,
  MessageSquare,
  Gift,
  Crown,
  RefreshCw,
  Hash,
  Smile,
  Shield,
} from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { RoleSelector, TextChannelSelector, VoiceChannelSelector, EmojiSelector } from "@/components/ServerDataSelector";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Leveling() {
  const [config, setConfig] = useState({
    leveling_enabled: true,
    xp_per_message: 15,
    xp_cooldown: 60,
    level_up_channel: "",
    level_roles: {},
    ignored_channels: [],
    // Voice XP
    voice_xp_enabled: false,
    voice_xp_per_minute: 5,
    voice_xp_min_users: 2,
    voice_afk_channel: "",
  });
  const [rewards, setRewards] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [voiceStats, setVoiceStats] = useState({ active_sessions: 0, total_sessions: 0 });
  const [loading, setLoading] = useState(false);
  const [rewardDialogOpen, setRewardDialogOpen] = useState(false);
  const [newReward, setNewReward] = useState({
    level: 5,
    reward_type: "role",
    reward_value: "",
    reward_name: "",
  });
  const guildId = localStorage.getItem("guildId");

  const getAuthHeader = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchConfig = async () => {
    try {
      const res = await axios.get(`${API}/guilds/${guildId}`, { headers: getAuthHeader() });
      setConfig((prev) => ({ ...prev, ...res.data }));
    } catch (e) {
      console.error(e);
    }
  };

  const fetchRewards = async () => {
    try {
      const res = await axios.get(`${API}/guilds/${guildId}/level-rewards`, { headers: getAuthHeader() });
      setRewards(res.data.rewards || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const res = await axios.get(`${API}/guilds/${guildId}/leaderboard?limit=10`, { headers: getAuthHeader() });
      setLeaderboard(res.data.leaderboard || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchVoiceStats = async () => {
    try {
      const res = await axios.get(`${API}/guilds/${guildId}/voice-stats`, { headers: getAuthHeader() });
      setVoiceStats(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (guildId) {
      fetchConfig();
      fetchRewards();
      fetchLeaderboard();
      fetchVoiceStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guildId]);

  const saveConfig = async () => {
    if (!guildId) {
      toast.error("Bitte wähle zuerst einen Server");
      return;
    }
    setLoading(true);
    try {
      await axios.put(`${API}/guilds/${guildId}`, config, { headers: getAuthHeader() });
      toast.success("Einstellungen gespeichert!");
    } catch (e) {
      toast.error("Fehler beim Speichern");
    }
    setLoading(false);
  };

  const createReward = async () => {
    if (!newReward.level || !newReward.reward_value) {
      toast.error("Bitte Level und Belohnung auswählen");
      return;
    }
    try {
      await axios.post(`${API}/guilds/${guildId}/level-rewards`, newReward, { headers: getAuthHeader() });
      toast.success("Level-Belohnung erstellt!");
      setRewardDialogOpen(false);
      setNewReward({ level: 5, reward_type: "role", reward_value: "", reward_name: "" });
      fetchRewards();
    } catch (e) {
      toast.error("Fehler beim Erstellen");
    }
  };

  const deleteReward = async (rewardId) => {
    try {
      await axios.delete(`${API}/guilds/${guildId}/level-rewards/${rewardId}`, { headers: getAuthHeader() });
      toast.success("Belohnung gelöscht");
      fetchRewards();
    } catch (e) {
      toast.error("Fehler beim Löschen");
    }
  };

  const toggleReward = async (rewardId, enabled) => {
    try {
      await axios.put(`${API}/guilds/${guildId}/level-rewards/${rewardId}/toggle?enabled=${enabled}`, {}, { headers: getAuthHeader() });
      fetchRewards();
    } catch (e) {
      toast.error("Fehler beim Umschalten");
    }
  };

  if (!guildId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Trophy className="h-12 w-12 text-gray-500 mx-auto mb-4" />
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
            <div className="p-2 rounded-lg bg-[#F0B232]/20">
              <Trophy className="h-6 w-6 text-[#F0B232]" />
            </div>
            Leveling System
          </h1>
          <p className="text-gray-400 mt-1">
            XP für Nachrichten und Voice-Zeit, Level-Belohnungen
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

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="bg-[#2B2D31] border-[#1E1F22]">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-[#5865F2]/20">
                <MessageSquare className="h-6 w-6 text-[#5865F2]" />
              </div>
              <div>
                <p className="text-sm text-gray-400">XP/Nachricht</p>
                <p className="text-2xl font-bold text-white">{config.xp_per_message}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#2B2D31] border-[#1E1F22]">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-[#23A559]/20">
                <Mic className="h-6 w-6 text-[#23A559]" />
              </div>
              <div>
                <p className="text-sm text-gray-400">XP/Minute Voice</p>
                <p className="text-2xl font-bold text-white">{config.voice_xp_per_minute}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#2B2D31] border-[#1E1F22]">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-[#F0B232]/20">
                <Gift className="h-6 w-6 text-[#F0B232]" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Level-Belohnungen</p>
                <p className="text-2xl font-bold text-white">{rewards.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#2B2D31] border-[#1E1F22]">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-[#EB459E]/20">
                <Mic className="h-6 w-6 text-[#EB459E]" />
              </div>
              <div>
                <p className="text-sm text-gray-400">In Voice</p>
                <p className="text-2xl font-bold text-white">{voiceStats.active_sessions}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Message XP Settings */}
      <Card className="bg-[#2B2D31] border-[#1E1F22]">
        <CardHeader>
          <CardTitle className="text-white font-[Outfit] flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-[#5865F2]" />
            Nachrichten XP
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Leveling aktivieren</p>
              <p className="text-sm text-gray-400">Benutzer erhalten XP für Nachrichten</p>
            </div>
            <Switch
              checked={config.leveling_enabled}
              onCheckedChange={(v) => setConfig({ ...config, leveling_enabled: v })}
            />
          </div>

          {config.leveling_enabled && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label className="text-gray-300">XP pro Nachricht</Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[config.xp_per_message || 15]}
                      onValueChange={([v]) => setConfig({ ...config, xp_per_message: v })}
                      max={50}
                      min={1}
                      step={1}
                      className="flex-1"
                    />
                    <span className="text-white font-mono w-12 text-right">{config.xp_per_message}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-gray-300">Cooldown (Sekunden)</Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[config.xp_cooldown || 60]}
                      onValueChange={([v]) => setConfig({ ...config, xp_cooldown: v })}
                      max={300}
                      min={10}
                      step={5}
                      className="flex-1"
                    />
                    <span className="text-white font-mono w-12 text-right">{config.xp_cooldown}s</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-300">Level-Up Benachrichtigungs-Kanal</Label>
                <TextChannelSelector
                  value={config.level_up_channel}
                  onChange={(v) => setConfig({ ...config, level_up_channel: v })}
                  placeholder="Kanal auswählen (optional)"
                  guildId={guildId}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Voice XP Settings */}
      <Card className="bg-[#2B2D31] border-[#1E1F22]">
        <CardHeader>
          <CardTitle className="text-white font-[Outfit] flex items-center gap-2">
            <Mic className="h-5 w-5 text-[#23A559]" />
            Voice XP
          </CardTitle>
          <CardDescription className="text-gray-400">
            Benutzer erhalten XP während sie in Voice-Channels sind
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Voice XP aktivieren</p>
              <p className="text-sm text-gray-400">XP für Zeit in Voice-Channels</p>
            </div>
            <Switch
              checked={config.voice_xp_enabled}
              onCheckedChange={(v) => setConfig({ ...config, voice_xp_enabled: v })}
            />
          </div>

          {config.voice_xp_enabled && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label className="text-gray-300">XP pro Minute</Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[config.voice_xp_per_minute || 5]}
                      onValueChange={([v]) => setConfig({ ...config, voice_xp_per_minute: v })}
                      max={20}
                      min={1}
                      step={1}
                      className="flex-1"
                    />
                    <span className="text-white font-mono w-12 text-right">{config.voice_xp_per_minute}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-gray-300">Mindest-Benutzer im Channel</Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[config.voice_xp_min_users || 2]}
                      onValueChange={([v]) => setConfig({ ...config, voice_xp_min_users: v })}
                      max={10}
                      min={1}
                      step={1}
                      className="flex-1"
                    />
                    <span className="text-white font-mono w-12 text-right">{config.voice_xp_min_users}</span>
                  </div>
                  <p className="text-xs text-gray-500">Verhindert AFK-Farming</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-300">AFK-Kanal (kein XP)</Label>
                <VoiceChannelSelector
                  value={config.voice_afk_channel}
                  onChange={(v) => setConfig({ ...config, voice_afk_channel: v })}
                  placeholder="AFK-Kanal auswählen (optional)"
                  guildId={guildId}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Level Rewards */}
      <Card className="bg-[#2B2D31] border-[#1E1F22]">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-white font-[Outfit] flex items-center gap-2">
              <Gift className="h-5 w-5 text-[#F0B232]" />
              Level-Belohnungen ({rewards.length})
            </CardTitle>
            <CardDescription className="text-gray-400">
              Rollen und Emojis die bei bestimmten Leveln freigeschaltet werden
            </CardDescription>
          </div>
          <Dialog open={rewardDialogOpen} onOpenChange={setRewardDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#5865F2] hover:bg-[#4752C4] text-white">
                <Plus className="h-4 w-4 mr-2" />
                Hinzufügen
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#2B2D31] border-[#1E1F22] text-white">
              <DialogHeader>
                <DialogTitle className="font-[Outfit]">Neue Level-Belohnung</DialogTitle>
                <DialogDescription className="text-gray-400">
                  Wähle ein Level und die Belohnung
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label className="text-gray-300">Level</Label>
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    value={newReward.level}
                    onChange={(e) => setNewReward({ ...newReward, level: parseInt(e.target.value) || 1 })}
                    className="bg-[#1E1F22] border-none text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-300">Belohnungs-Typ</Label>
                  <Select
                    value={newReward.reward_type}
                    onValueChange={(v) => setNewReward({ ...newReward, reward_type: v, reward_value: "" })}
                  >
                    <SelectTrigger className="bg-[#1E1F22] border-none text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1E1F22] border-[#404249]">
                      <SelectItem value="role" className="text-white">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          Rolle
                        </div>
                      </SelectItem>
                      <SelectItem value="emoji" className="text-white">
                        <div className="flex items-center gap-2">
                          <Smile className="h-4 w-4" />
                          Emoji Zugang
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-300">
                    {newReward.reward_type === "role" ? "Rolle" : "Emoji"}
                  </Label>
                  {newReward.reward_type === "role" ? (
                    <RoleSelector
                      value={newReward.reward_value}
                      onChange={(v) => setNewReward({ ...newReward, reward_value: v })}
                      placeholder="Rolle auswählen"
                      guildId={guildId}
                    />
                  ) : (
                    <EmojiSelector
                      value={newReward.reward_value}
                      onChange={(v) => setNewReward({ ...newReward, reward_value: v })}
                      placeholder="Emoji auswählen"
                      guildId={guildId}
                    />
                  )}
                </div>
              </div>

              <DialogFooter>
                <Button variant="ghost" onClick={() => setRewardDialogOpen(false)} className="text-gray-400">
                  Abbrechen
                </Button>
                <Button onClick={createReward} className="bg-[#5865F2] hover:bg-[#4752C4] text-white">
                  Erstellen
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {rewards.length > 0 ? (
            <div className="space-y-3">
              {rewards.sort((a, b) => a.level - b.level).map((reward) => (
                <div
                  key={reward.id}
                  className={`flex items-center justify-between p-4 rounded-lg bg-[#1E1F22] ${!reward.enabled ? "opacity-50" : ""}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-[#F0B232]/20">
                      <span className="text-[#F0B232] font-bold">{reward.level}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        {reward.reward_type === "role" ? (
                          <Shield className="h-4 w-4 text-[#5865F2]" />
                        ) : (
                          <Smile className="h-4 w-4 text-[#F0B232]" />
                        )}
                        <span className="text-white font-medium">
                          {reward.reward_name || reward.reward_value}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">
                        Level {reward.level} • {reward.reward_type === "role" ? "Rolle" : "Emoji"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={reward.enabled}
                      onCheckedChange={(v) => toggleReward(reward.id, v)}
                    />
                    <Button
                      onClick={() => deleteReward(reward.id)}
                      variant="ghost"
                      size="icon"
                      className="text-[#DA373C] hover:text-[#DA373C] hover:bg-[#DA373C]/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Gift className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">Keine Level-Belohnungen</p>
              <p className="text-gray-500 text-sm mt-1">
                Füge Belohnungen hinzu um Spieler zu motivieren
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Leaderboard */}
      <Card className="bg-[#2B2D31] border-[#1E1F22]">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-white font-[Outfit] flex items-center gap-2">
              <Crown className="h-5 w-5 text-[#F0B232]" />
              Top 10 Rangliste
            </CardTitle>
          </div>
          <Button
            onClick={fetchLeaderboard}
            variant="ghost"
            size="icon"
            className="text-gray-400 hover:text-white"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {leaderboard.length > 0 ? (
            <div className="space-y-2">
              {leaderboard.map((user, index) => (
                <div
                  key={user.user_id}
                  className="flex items-center justify-between p-3 rounded-lg bg-[#1E1F22]"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      index === 0 ? "bg-[#F0B232]/20 text-[#F0B232]" :
                      index === 1 ? "bg-gray-400/20 text-gray-400" :
                      index === 2 ? "bg-[#CD7F32]/20 text-[#CD7F32]" :
                      "bg-gray-600/20 text-gray-500"
                    } font-bold`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-white font-medium">{user.user_id.slice(0, 8)}...</p>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span>💬 {user.messages || 0}</span>
                        <span>🎤 {user.voice_minutes || 0} min</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[#F0B232] font-bold">Level {user.level}</p>
                    <p className="text-xs text-gray-500">{user.xp} XP</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Trophy className="h-12 w-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500">Noch keine Ranglisten-Daten</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Commands */}
      <Card className="bg-[#2B2D31] border-[#1E1F22]">
        <CardHeader>
          <CardTitle className="text-white font-[Outfit]">Discord Befehle</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { cmd: "/rank", desc: "Zeigt deinen aktuellen Rang" },
              { cmd: "/rank @user", desc: "Zeigt den Rang eines Benutzers" },
              { cmd: "/leaderboard", desc: "Zeigt die Top 10 Rangliste" },
            ].map((item) => (
              <div
                key={item.cmd}
                className="p-3 rounded-lg bg-[#1E1F22] flex items-center gap-3"
              >
                <code className="text-[#F0B232] text-sm font-mono">{item.cmd}</code>
                <span className="text-gray-400 text-sm">{item.desc}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
