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
  Mic,
  Plus,
  Trash2,
  RefreshCw,
  Settings,
  Users,
  Lock,
  EyeOff,
  UserMinus,
  UserPlus,
  Volume2,
  Hash,
  Shield,
  ArrowUp,
  ArrowDown,
  Crown,
  Edit,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { VoiceChannelSelector, CategorySelector } from "@/components/ServerDataSelector";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function TempChannels() {
  const [creators, setCreators] = useState([]);
  const [activeChannels, setActiveChannels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editCreator, setEditCreator] = useState(null);
  const [newCreator, setNewCreator] = useState({
    channel_id: "",
    category_id: "",
    name_template: "🔊 {user}'s Kanal",
    numbering_type: "number",
    position: "bottom",
    default_limit: 0,
    default_bitrate: 64000,
    allow_rename: true,
    allow_limit: true,
    allow_lock: true,
    allow_hide: true,
    allow_kick: true,
    allow_permit: true,
    allow_bitrate: true,
  });
  const guildId = localStorage.getItem("guildId");

  const getAuthHeader = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchCreators = async () => {
    try {
      const res = await axios.get(`${API}/guilds/${guildId}/temp-creators`, { headers: getAuthHeader() });
      setCreators(res.data.creators || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchActiveChannels = async () => {
    try {
      const res = await axios.get(`${API}/guilds/${guildId}/temp-channels`, { headers: getAuthHeader() });
      setActiveChannels(res.data.channels || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (guildId) {
      fetchCreators();
      fetchActiveChannels();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guildId]);

  const createCreator = async () => {
    if (!newCreator.channel_id) {
      toast.error("Bitte wähle einen Creator-Kanal aus");
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${API}/guilds/${guildId}/temp-creators`, newCreator, { headers: getAuthHeader() });
      toast.success("Temp Voice Creator erstellt!");
      setCreateOpen(false);
      resetNewCreator();
      fetchCreators();
    } catch (e) {
      toast.error("Fehler beim Erstellen");
    }
    setLoading(false);
  };

  const updateCreator = async (creatorId, updates) => {
    try {
      await axios.put(`${API}/guilds/${guildId}/temp-creators/${creatorId}`, updates, { headers: getAuthHeader() });
      toast.success("Creator aktualisiert!");
      fetchCreators();
    } catch (e) {
      toast.error("Fehler beim Aktualisieren");
    }
  };

  const deleteCreator = async (creatorId) => {
    try {
      await axios.delete(`${API}/guilds/${guildId}/temp-creators/${creatorId}`, { headers: getAuthHeader() });
      toast.success("Creator gelöscht");
      fetchCreators();
    } catch (e) {
      toast.error("Fehler beim Löschen");
    }
  };

  const deleteChannel = async (channelId) => {
    try {
      await axios.delete(`${API}/guilds/${guildId}/temp-channels/${channelId}`, { headers: getAuthHeader() });
      toast.success("Kanal gelöscht");
      fetchActiveChannels();
    } catch (e) {
      toast.error("Fehler beim Löschen");
    }
  };

  const resetNewCreator = () => {
    setNewCreator({
      channel_id: "",
      category_id: "",
      name_template: "🔊 {user}'s Kanal",
      numbering_type: "number",
      position: "bottom",
      default_limit: 0,
      default_bitrate: 64000,
      allow_rename: true,
      allow_limit: true,
      allow_lock: true,
      allow_hide: true,
      allow_kick: true,
      allow_permit: true,
      allow_bitrate: true,
    });
  };

  const permissionOptions = [
    { key: "allow_rename", label: "Umbenennen", icon: Hash },
    { key: "allow_limit", label: "Limit setzen", icon: Users },
    { key: "allow_lock", label: "Sperren", icon: Lock },
    { key: "allow_hide", label: "Verstecken", icon: EyeOff },
    { key: "allow_kick", label: "Kicken", icon: UserMinus },
    { key: "allow_permit", label: "Erlauben", icon: UserPlus },
    { key: "allow_bitrate", label: "Bitrate", icon: Volume2 },
  ];

  const numberingExamples = {
    number: ["1", "2", "3", "10"],
    letter: ["a", "b", "c", "z"],
    superscript: ["¹", "²", "³", "¹⁰"],
    subscript: ["₁", "₂", "₃", "₁₀"],
    roman: ["i", "ii", "iii", "x"],
  };

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
            Erstelle mehrere Creator-Channels für verschiedene Bereiche
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#5865F2] hover:bg-[#4752C4] text-white">
              <Plus className="h-4 w-4 mr-2" />
              Neuer Creator
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#2B2D31] border-[#1E1F22] text-white max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-[Outfit]">Neuen Temp Voice Creator erstellen</DialogTitle>
              <DialogDescription className="text-gray-400">
                Benutzer die diesem Kanal beitreten, erhalten automatisch einen eigenen
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Basic Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-300">Creator-Channel *</Label>
                  <VoiceChannelSelector
                    value={newCreator.channel_id}
                    onChange={(v) => setNewCreator({ ...newCreator, channel_id: v })}
                    placeholder="Voice-Kanal auswählen"
                    guildId={guildId}
                  />
                  <p className="text-xs text-gray-500">
                    z.B. "🎮 Valorant erstellen"
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-300">Ziel-Kategorie</Label>
                  <CategorySelector
                    value={newCreator.category_id}
                    onChange={(v) => setNewCreator({ ...newCreator, category_id: v })}
                    placeholder="Kategorie auswählen"
                    guildId={guildId}
                  />
                </div>
              </div>

              {/* Name Template */}
              <div className="space-y-2">
                <Label className="text-gray-300">Kanal-Name Template</Label>
                <Input
                  value={newCreator.name_template}
                  onChange={(e) => setNewCreator({ ...newCreator, name_template: e.target.value })}
                  className="bg-[#1E1F22] border-none text-white"
                  placeholder="🔊 {user}'s Kanal"
                />
                <p className="text-xs text-gray-500">
                  Variablen: {"{user}"} = Benutzername, {"{number}"} = Nummer, {"{game}"} = Spielname
                </p>
              </div>

              {/* Numbering & Position */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-300">Nummerierung</Label>
                  <Select
                    value={newCreator.numbering_type}
                    onValueChange={(v) => setNewCreator({ ...newCreator, numbering_type: v })}
                  >
                    <SelectTrigger className="bg-[#1E1F22] border-none text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1E1F22] border-[#404249]">
                      <SelectItem value="number" className="text-white">
                        Zahlen (1, 2, 3...)
                      </SelectItem>
                      <SelectItem value="letter" className="text-white">
                        Buchstaben (a, b, c...)
                      </SelectItem>
                      <SelectItem value="superscript" className="text-white">
                        Hochgestellt (¹, ², ³...)
                      </SelectItem>
                      <SelectItem value="subscript" className="text-white">
                        Tiefgestellt (₁, ₂, ₃...)
                      </SelectItem>
                      <SelectItem value="roman" className="text-white">
                        Römisch (i, ii, iii...)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">
                    Beispiel: {numberingExamples[newCreator.numbering_type]?.join(", ")}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-300">Position</Label>
                  <Select
                    value={newCreator.position}
                    onValueChange={(v) => setNewCreator({ ...newCreator, position: v })}
                  >
                    <SelectTrigger className="bg-[#1E1F22] border-none text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1E1F22] border-[#404249]">
                      <SelectItem value="top" className="text-white">
                        <div className="flex items-center gap-2">
                          <ArrowUp className="h-4 w-4" />
                          Oben (unter Creator)
                        </div>
                      </SelectItem>
                      <SelectItem value="bottom" className="text-white">
                        <div className="flex items-center gap-2">
                          <ArrowDown className="h-4 w-4" />
                          Unten (Ende der Kategorie)
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Defaults */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Label className="text-gray-300">Standard Benutzerlimit</Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[newCreator.default_limit]}
                      onValueChange={([v]) => setNewCreator({ ...newCreator, default_limit: v })}
                      max={99}
                      step={1}
                      className="flex-1"
                    />
                    <span className="text-white font-mono w-12 text-right">
                      {newCreator.default_limit || "∞"}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-gray-300">Standard Bitrate</Label>
                  <Select
                    value={String(newCreator.default_bitrate)}
                    onValueChange={(v) => setNewCreator({ ...newCreator, default_bitrate: parseInt(v) })}
                  >
                    <SelectTrigger className="bg-[#1E1F22] border-none text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1E1F22] border-[#404249]">
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

              {/* Permissions */}
              <div className="space-y-4 border-t border-[#404249] pt-4">
                <h3 className="text-white font-medium flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Benutzer-Berechtigungen
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {permissionOptions.map((perm) => {
                    const Icon = perm.icon;
                    return (
                      <div
                        key={perm.key}
                        className="flex items-center justify-between p-3 rounded-lg bg-[#1E1F22]"
                      >
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-white">{perm.label}</span>
                        </div>
                        <Switch
                          checked={newCreator[perm.key]}
                          onCheckedChange={(v) => setNewCreator({ ...newCreator, [perm.key]: v })}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="ghost" onClick={() => setCreateOpen(false)} className="text-gray-400">
                Abbrechen
              </Button>
              <Button onClick={createCreator} disabled={loading} className="bg-[#5865F2] hover:bg-[#4752C4] text-white">
                Erstellen
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Creators List */}
      <Card className="bg-[#2B2D31] border-[#1E1F22]">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-white font-[Outfit] flex items-center gap-2">
              <Settings className="h-5 w-5 text-[#EB459E]" />
              Temp Voice Creators ({creators.length})
            </CardTitle>
            <CardDescription className="text-gray-400">
              Jeder Creator erstellt automatisch Temp-Channels
            </CardDescription>
          </div>
          <Button onClick={fetchCreators} variant="ghost" size="icon" className="text-gray-400 hover:text-white">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {creators.length > 0 ? (
            <div className="space-y-4">
              {creators.map((creator) => (
                <div
                  key={creator.id}
                  className="p-4 rounded-lg bg-[#1E1F22] border-l-4 border-[#5865F2]"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-[#5865F2]/20">
                          <Mic className="h-5 w-5 text-[#5865F2]" />
                        </div>
                        <div>
                          <p className="text-white font-medium">{creator.name_template}</p>
                          <p className="text-sm text-gray-400">Creator: {creator.channel_id?.slice(0, 12)}...</p>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-3 mt-3 text-xs">
                        <span className="px-2 py-1 rounded bg-[#2B2D31] text-gray-300">
                          {creator.numbering_type === "number" ? "1, 2, 3" :
                           creator.numbering_type === "letter" ? "a, b, c" :
                           creator.numbering_type === "superscript" ? "¹, ², ³" :
                           creator.numbering_type === "subscript" ? "₁, ₂, ₃" :
                           "i, ii, iii"}
                        </span>
                        <span className="px-2 py-1 rounded bg-[#2B2D31] text-gray-300 flex items-center gap-1">
                          {creator.position === "top" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                          {creator.position === "top" ? "Oben" : "Unten"}
                        </span>
                        <span className="px-2 py-1 rounded bg-[#2B2D31] text-gray-300">
                          Limit: {creator.default_limit || "∞"}
                        </span>
                        <span className="px-2 py-1 rounded bg-[#2B2D31] text-gray-300">
                          {creator.default_bitrate / 1000} kbps
                        </span>
                        <span className="px-2 py-1 rounded bg-[#2B2D31] text-gray-300">
                          {creator.channel_counter || 0} erstellt
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={creator.enabled}
                        onCheckedChange={(v) => updateCreator(creator.id, { enabled: v })}
                      />
                      <Button
                        onClick={() => openEditCreator(creator)}
                        variant="ghost"
                        size="icon"
                        className="text-[#5865F2] hover:text-[#5865F2] hover:bg-[#5865F2]/10"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => deleteCreator(creator.id)}
                        variant="ghost"
                        size="icon"
                        className="text-[#DA373C] hover:text-[#DA373C] hover:bg-[#DA373C]/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Mic className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">Keine Temp Voice Creators</p>
              <p className="text-gray-500 text-sm mt-1">
                Erstelle deinen ersten Creator mit dem Button oben
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Creator Dialog */}
      <Dialog open={!!editCreator} onOpenChange={(open) => !open && setEditCreator(null)}>
        <DialogContent className="bg-[#2B2D31] border-[#1E1F22] text-white max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-[Outfit]">Creator bearbeiten</DialogTitle>
            <DialogDescription className="text-gray-400">
              Bearbeite die Einstellungen dieses Temp Voice Creators
            </DialogDescription>
          </DialogHeader>

          {editCreator && (
            <div className="space-y-6 py-4">
              {/* Name Template */}
              <div className="space-y-2">
                <Label className="text-gray-300">Kanal-Name Template</Label>
                <Input
                  value={editCreator.name_template}
                  onChange={(e) => setEditCreator({ ...editCreator, name_template: e.target.value })}
                  className="bg-[#1E1F22] border-none text-white"
                />
                <p className="text-xs text-gray-500">
                  Variablen: {"{user}"} = Benutzername, {"{number}"} = Nummer
                </p>
              </div>

              {/* Numbering & Position */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-300">Nummerierung</Label>
                  <Select 
                    value={editCreator.numbering_type} 
                    onValueChange={(v) => setEditCreator({ ...editCreator, numbering_type: v })}
                  >
                    <SelectTrigger className="bg-[#1E1F22] border-none text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1E1F22] border-[#404249]">
                      <SelectItem value="number" className="text-white">Zahlen (1, 2, 3)</SelectItem>
                      <SelectItem value="letter" className="text-white">Buchstaben (a, b, c)</SelectItem>
                      <SelectItem value="superscript" className="text-white">Hochgestellt (¹, ², ³)</SelectItem>
                      <SelectItem value="subscript" className="text-white">Tiefgestellt (₁, ₂, ₃)</SelectItem>
                      <SelectItem value="roman" className="text-white">Römisch (i, ii, iii)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Position</Label>
                  <Select 
                    value={editCreator.position} 
                    onValueChange={(v) => setEditCreator({ ...editCreator, position: v })}
                  >
                    <SelectTrigger className="bg-[#1E1F22] border-none text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1E1F22] border-[#404249]">
                      <SelectItem value="top" className="text-white">Oben (unter Creator)</SelectItem>
                      <SelectItem value="bottom" className="text-white">Unten (Ende der Kategorie)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Default Settings */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-gray-300">Standard Benutzerlimit: {editCreator.default_limit || "∞"}</Label>
                  <Slider
                    value={[editCreator.default_limit || 0]}
                    onValueChange={([v]) => setEditCreator({ ...editCreator, default_limit: v })}
                    max={99}
                    min={0}
                    step={1}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-300">Standard Bitrate</Label>
                  <Select 
                    value={String(editCreator.default_bitrate)} 
                    onValueChange={(v) => setEditCreator({ ...editCreator, default_bitrate: parseInt(v) })}
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

              {/* Permissions */}
              <div className="space-y-3">
                <Label className="text-gray-300">Benutzer-Berechtigungen</Label>
                <div className="grid grid-cols-2 gap-2">
                  {permissionOptions.map((perm) => {
                    const Icon = perm.icon;
                    return (
                      <div
                        key={perm.key}
                        className="flex items-center justify-between p-2 rounded bg-[#1E1F22]"
                      >
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-white">{perm.label}</span>
                        </div>
                        <Switch
                          checked={editCreator[perm.key]}
                          onCheckedChange={(v) => setEditCreator({ ...editCreator, [perm.key]: v })}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditCreator(null)} className="text-gray-400">
              Abbrechen
            </Button>
            <Button 
              onClick={() => {
                updateCreator(editCreator.id, editCreator);
                setEditCreator(null);
              }} 
              disabled={loading} 
              className="bg-[#23A559] hover:bg-[#1A7F44] text-white"
            >
              <Save className="h-4 w-4 mr-2" />
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Active Channels */}
      <Card className="bg-[#2B2D31] border-[#1E1F22]">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-white font-[Outfit] flex items-center gap-2">
              <Mic className="h-5 w-5 text-[#23A559]" />
              Aktive Temp-Channels ({activeChannels.length})
            </CardTitle>
            <CardDescription className="text-gray-400">
              Alle aktuell existierenden temporären Sprachkanäle
            </CardDescription>
          </div>
          <Button onClick={fetchActiveChannels} variant="ghost" size="icon" className="text-gray-400 hover:text-white">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {activeChannels.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {activeChannels.map((channel) => (
                <div
                  key={channel.channel_id}
                  className="p-3 rounded-lg bg-[#1E1F22] flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-[#23A559]/20">
                      <Mic className="h-4 w-4 text-[#23A559]" />
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium truncate max-w-[150px]">{channel.name}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Crown className="h-3 w-3" />
                          {channel.owner_id?.slice(0, 6)}...
                        </span>
                        {channel.locked && <Lock className="h-3 w-3 text-[#F0B232]" />}
                        {channel.hidden && <EyeOff className="h-3 w-3 text-[#EB459E]" />}
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => deleteChannel(channel.channel_id)}
                    variant="ghost"
                    size="icon"
                    className="text-[#DA373C] hover:text-[#DA373C] h-8 w-8"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Mic className="h-12 w-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500">Keine aktiven Temp-Channels</p>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { cmd: "/vc rename", desc: "Kanal umbenennen" },
              { cmd: "/vc limit", desc: "Benutzerlimit setzen" },
              { cmd: "/vc lock", desc: "Kanal sperren" },
              { cmd: "/vc unlock", desc: "Kanal entsperren" },
              { cmd: "/vc hide", desc: "Kanal verstecken" },
              { cmd: "/vc show", desc: "Kanal sichtbar machen" },
              { cmd: "/vc kick @user", desc: "Benutzer kicken" },
              { cmd: "/vc permit @user", desc: "Benutzer erlauben" },
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
    </div>
  );
}
