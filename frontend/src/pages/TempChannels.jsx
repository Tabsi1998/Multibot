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
  Mic,
  Settings,
  Users,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Crown,
  Hash,
  Save,
  RefreshCw,
  Trash2,
  Plus,
  Volume2,
  UserPlus,
  UserMinus,
  Shield,
} from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function TempChannels() {
  const [config, setConfig] = useState({
    temp_channels_enabled: false,
    temp_channel_category: "",
    temp_channel_creator: "",
    temp_channel_default_name: "🔊 {user}'s Kanal",
    temp_channel_default_limit: 0,
    temp_channel_default_bitrate: 64000,
    temp_channel_allow_rename: true,
    temp_channel_allow_limit: true,
    temp_channel_allow_lock: true,
    temp_channel_allow_hide: true,
    temp_channel_allow_kick: true,
    temp_channel_allow_permit: true,
    temp_channel_allow_bitrate: true,
  });
  const [activeChannels, setActiveChannels] = useState([]);
  const [loading, setLoading] = useState(false);
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
      setConfig((prev) => ({ ...prev, ...res.data }));
    } catch (e) {
      console.error(e);
    }
  };

  const fetchActiveChannels = async () => {
    try {
      const res = await axios.get(`${API}/guilds/${guildId}/temp-channels`, {
        headers: getAuthHeader(),
      });
      setActiveChannels(res.data.channels || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (guildId) {
      fetchConfig();
      fetchActiveChannels();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guildId]);

  const saveConfig = async () => {
    if (!guildId) {
      toast.error("Bitte wähle zuerst einen Server im Dashboard");
      return;
    }
    setLoading(true);
    try {
      await axios.put(`${API}/guilds/${guildId}`, config, {
        headers: getAuthHeader(),
      });
      toast.success("Temp-Channel Einstellungen gespeichert!");
    } catch (e) {
      toast.error("Fehler beim Speichern");
    }
    setLoading(false);
  };

  const deleteChannel = async (channelId) => {
    try {
      await axios.delete(`${API}/guilds/${guildId}/temp-channels/${channelId}`, {
        headers: getAuthHeader(),
      });
      toast.success("Kanal gelöscht");
      fetchActiveChannels();
    } catch (e) {
      toast.error("Fehler beim Löschen");
    }
  };

  const permissionOptions = [
    { key: "temp_channel_allow_rename", label: "Umbenennen", icon: Hash, desc: "Benutzer können ihren Kanal umbenennen" },
    { key: "temp_channel_allow_limit", label: "Limit setzen", icon: Users, desc: "Benutzer können das Userlimit ändern" },
    { key: "temp_channel_allow_lock", label: "Sperren", icon: Lock, desc: "Benutzer können ihren Kanal sperren" },
    { key: "temp_channel_allow_hide", label: "Verstecken", icon: EyeOff, desc: "Benutzer können ihren Kanal verstecken" },
    { key: "temp_channel_allow_kick", label: "Kicken", icon: UserMinus, desc: "Benutzer können andere aus dem Kanal werfen" },
    { key: "temp_channel_allow_permit", label: "Erlauben", icon: UserPlus, desc: "Benutzer können andere in gesperrte Kanäle einladen" },
    { key: "temp_channel_allow_bitrate", label: "Bitrate", icon: Volume2, desc: "Benutzer können die Audioqualität ändern" },
  ];

  if (!guildId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Mic className="h-12 w-12 text-gray-500 mx-auto mb-4" />
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
            <div className="p-2 rounded-lg bg-[#5865F2]/20">
              <Mic className="h-6 w-6 text-[#5865F2]" />
            </div>
            Temp Voice Channels
          </h1>
          <p className="text-gray-400 mt-1">
            Erstelle automatisch temporäre Sprachkanäle für deine Mitglieder
          </p>
        </div>
        <Button
          onClick={saveConfig}
          disabled={loading}
          className="bg-[#5865F2] hover:bg-[#4752C4] text-white"
          data-testid="save-temp-config-btn"
        >
          <Save className="h-4 w-4 mr-2" />
          Speichern
        </Button>
      </div>

      {/* Main Toggle */}
      <Card className="bg-[#2B2D31] border-[#1E1F22]">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg ${config.temp_channels_enabled ? "bg-[#23A559]/20" : "bg-gray-500/20"}`}>
                <Mic className={`h-6 w-6 ${config.temp_channels_enabled ? "text-[#23A559]" : "text-gray-500"}`} />
              </div>
              <div>
                <p className="text-white font-medium">Temp Channels aktivieren</p>
                <p className="text-sm text-gray-400">
                  Benutzer können eigene Sprachkanäle erstellen
                </p>
              </div>
            </div>
            <Switch
              checked={config.temp_channels_enabled}
              onCheckedChange={(v) => setConfig({ ...config, temp_channels_enabled: v })}
              data-testid="temp-channels-toggle"
            />
          </div>
        </CardContent>
      </Card>

      {config.temp_channels_enabled && (
        <>
          {/* Setup Section */}
          <Card className="bg-[#2B2D31] border-[#1E1F22]">
            <CardHeader>
              <CardTitle className="text-white font-[Outfit] flex items-center gap-2">
                <Settings className="h-5 w-5 text-[#EB459E]" />
                Grundeinstellungen
              </CardTitle>
              <CardDescription className="text-gray-400">
                Konfiguriere wie Temp-Channels erstellt werden
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Creator Channel */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-gray-300">Creator Channel ID</Label>
                  <Input
                    placeholder="Voice Channel ID eingeben"
                    value={config.temp_channel_creator || ""}
                    onChange={(e) => setConfig({ ...config, temp_channel_creator: e.target.value })}
                    className="bg-[#1E1F22] border-none text-white font-mono"
                    data-testid="creator-channel-input"
                  />
                  <p className="text-xs text-gray-500">
                    Benutzer die diesem Kanal beitreten, erhalten automatisch einen eigenen
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-300">Kategorie ID</Label>
                  <Input
                    placeholder="Kategorie ID für neue Kanäle"
                    value={config.temp_channel_category || ""}
                    onChange={(e) => setConfig({ ...config, temp_channel_category: e.target.value })}
                    className="bg-[#1E1F22] border-none text-white font-mono"
                    data-testid="category-input"
                  />
                  <p className="text-xs text-gray-500">
                    Neue Kanäle werden in dieser Kategorie erstellt
                  </p>
                </div>
              </div>

              {/* Default Name */}
              <div className="space-y-2">
                <Label className="text-gray-300">Standard Kanal-Name</Label>
                <Input
                  placeholder="🔊 {user}'s Kanal"
                  value={config.temp_channel_default_name || ""}
                  onChange={(e) => setConfig({ ...config, temp_channel_default_name: e.target.value })}
                  className="bg-[#1E1F22] border-none text-white"
                  data-testid="default-name-input"
                />
                <p className="text-xs text-gray-500">
                  Verfügbare Variablen: {"{user}"} = Benutzername
                </p>
              </div>

              {/* Defaults */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label className="text-gray-300">Standard Benutzerlimit</Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[config.temp_channel_default_limit || 0]}
                      onValueChange={([v]) => setConfig({ ...config, temp_channel_default_limit: v })}
                      max={99}
                      step={1}
                      className="flex-1"
                    />
                    <span className="text-white font-mono w-12 text-right">
                      {config.temp_channel_default_limit || 0}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">0 = Unbegrenzt</p>
                </div>

                <div className="space-y-3">
                  <Label className="text-gray-300">Standard Bitrate (kbps)</Label>
                  <Select
                    value={String(config.temp_channel_default_bitrate || 64000)}
                    onValueChange={(v) => setConfig({ ...config, temp_channel_default_bitrate: parseInt(v) })}
                  >
                    <SelectTrigger className="bg-[#1E1F22] border-none text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1E1F22] border-[#404249]">
                      <SelectItem value="8000" className="text-white">8 kbps</SelectItem>
                      <SelectItem value="32000" className="text-white">32 kbps</SelectItem>
                      <SelectItem value="64000" className="text-white">64 kbps</SelectItem>
                      <SelectItem value="96000" className="text-white">96 kbps</SelectItem>
                      <SelectItem value="128000" className="text-white">128 kbps</SelectItem>
                      <SelectItem value="256000" className="text-white">256 kbps</SelectItem>
                      <SelectItem value="384000" className="text-white">384 kbps</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Permissions */}
          <Card className="bg-[#2B2D31] border-[#1E1F22]">
            <CardHeader>
              <CardTitle className="text-white font-[Outfit] flex items-center gap-2">
                <Shield className="h-5 w-5 text-[#F0B232]" />
                Benutzer-Berechtigungen
              </CardTitle>
              <CardDescription className="text-gray-400">
                Was dürfen Kanal-Besitzer mit ihrem Temp-Channel machen?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {permissionOptions.map((perm) => {
                  const Icon = perm.icon;
                  return (
                    <div
                      key={perm.key}
                      className="flex items-center justify-between p-4 rounded-lg bg-[#1E1F22] hover:bg-[#1E1F22]/80 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${config[perm.key] ? "bg-[#23A559]/20" : "bg-gray-500/20"}`}>
                          <Icon className={`h-4 w-4 ${config[perm.key] ? "text-[#23A559]" : "text-gray-500"}`} />
                        </div>
                        <div>
                          <p className="text-white text-sm font-medium">{perm.label}</p>
                          <p className="text-xs text-gray-500">{perm.desc}</p>
                        </div>
                      </div>
                      <Switch
                        checked={config[perm.key] ?? true}
                        onCheckedChange={(v) => setConfig({ ...config, [perm.key]: v })}
                      />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Active Channels */}
          <Card className="bg-[#2B2D31] border-[#1E1F22]">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-white font-[Outfit] flex items-center gap-2">
                  <Mic className="h-5 w-5 text-[#5865F2]" />
                  Aktive Temp-Channels ({activeChannels.length})
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Alle aktuell existierenden temporären Sprachkanäle
                </CardDescription>
              </div>
              <Button
                onClick={fetchActiveChannels}
                variant="ghost"
                size="icon"
                className="text-gray-400 hover:text-white"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              {activeChannels.length > 0 ? (
                <div className="space-y-3">
                  {activeChannels.map((channel) => (
                    <div
                      key={channel.channel_id}
                      className="flex items-center justify-between p-4 rounded-lg bg-[#1E1F22]"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-[#5865F2]/20">
                          <Mic className="h-5 w-5 text-[#5865F2]" />
                        </div>
                        <div>
                          <p className="text-white font-medium">{channel.name}</p>
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Crown className="h-3 w-3" />
                              {channel.owner_id}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {channel.user_limit || "∞"}
                            </span>
                            {channel.locked && (
                              <span className="flex items-center gap-1 text-[#F0B232]">
                                <Lock className="h-3 w-3" />
                                Gesperrt
                              </span>
                            )}
                            {channel.hidden && (
                              <span className="flex items-center gap-1 text-[#EB459E]">
                                <EyeOff className="h-3 w-3" />
                                Versteckt
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        onClick={() => deleteChannel(channel.channel_id)}
                        variant="ghost"
                        size="icon"
                        className="text-[#DA373C] hover:text-[#DA373C] hover:bg-[#DA373C]/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Mic className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500">Keine aktiven Temp-Channels</p>
                  <p className="text-xs text-gray-600 mt-1">
                    Kanäle erscheinen hier sobald sie erstellt werden
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Commands Info */}
          <Card className="bg-[#2B2D31] border-[#1E1F22]">
            <CardHeader>
              <CardTitle className="text-white font-[Outfit]">Discord Befehle</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  { cmd: "/vc rename", desc: "Kanal umbenennen" },
                  { cmd: "/vc limit", desc: "Benutzerlimit setzen" },
                  { cmd: "/vc lock", desc: "Kanal sperren" },
                  { cmd: "/vc unlock", desc: "Kanal entsperren" },
                  { cmd: "/vc kick", desc: "Benutzer kicken" },
                  { cmd: "/vc permit", desc: "Benutzer erlauben" },
                  { cmd: "/vc claim", desc: "Verlassenen Kanal übernehmen" },
                ].map((item) => (
                  <div
                    key={item.cmd}
                    className="p-3 rounded-lg bg-[#1E1F22] flex items-center gap-3"
                  >
                    <code className="text-[#5865F2] text-sm font-mono">{item.cmd}</code>
                    <span className="text-gray-400 text-sm">{item.desc}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
