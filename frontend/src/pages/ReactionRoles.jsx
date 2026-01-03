import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
  Tags,
  Plus,
  Trash2,
  RefreshCw,
  MousePointer,
  Smile,
  Hash,
  Shield,
  Palette,
  MessageSquare,
  Edit,
  Send,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { RoleSelector, TextChannelSelector } from "@/components/ServerDataSelector";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function ReactionRoles() {
  const [reactionRoles, setReactionRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingRR, setEditingRR] = useState(null);
  const [newRR, setNewRR] = useState({
    title: "🎭 Wähle deine Rollen",
    description: "Klicke auf einen Button um die entsprechende Rolle zu erhalten oder zu entfernen.",
    channel_id: "",
    type: "button",
    roles: [{ emoji: "🎮", role_id: "", label: "" }],
    color: "#5865F2",
    embed_image: "",
    embed_thumbnail: "",
  });
  const guildId = localStorage.getItem("guildId");

  const getAuthHeader = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchReactionRoles = async () => {
    try {
      const res = await axios.get(`${API}/guilds/${guildId}/reaction-roles`, {
        headers: getAuthHeader(),
      });
      setReactionRoles(res.data.reaction_roles || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (guildId) {
      fetchReactionRoles();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guildId]);

  const createReactionRole = async () => {
    if (!newRR.title || !newRR.channel_id) {
      toast.error("Bitte fülle Titel und Kanal aus");
      return;
    }

    const validRoles = newRR.roles.filter(r => r.emoji && r.role_id);
    if (validRoles.length === 0) {
      toast.error("Mindestens eine Rolle mit Emoji benötigt");
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API}/guilds/${guildId}/reaction-roles`, {
        ...newRR,
        roles: validRoles,
      }, {
        headers: getAuthHeader(),
      });
      toast.success("Reaction Role erstellt und im Kanal gesendet!");
      setCreateOpen(false);
      resetNewRR();
      fetchReactionRoles();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Fehler beim Erstellen");
    }
    setLoading(false);
  };

  const updateReactionRole = async () => {
    if (!editingRR) return;
    
    setLoading(true);
    try {
      await axios.put(`${API}/guilds/${guildId}/reaction-roles/${editingRR.id}`, editingRR, {
        headers: getAuthHeader(),
      });
      toast.success("Reaction Role aktualisiert!");
      setEditOpen(false);
      setEditingRR(null);
      fetchReactionRoles();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Fehler beim Aktualisieren");
    }
    setLoading(false);
  };

  const deleteReactionRole = async (id) => {
    try {
      await axios.delete(`${API}/guilds/${guildId}/reaction-roles/${id}`, {
        headers: getAuthHeader(),
      });
      toast.success("Reaction Role gelöscht");
      fetchReactionRoles();
    } catch (e) {
      toast.error("Fehler beim Löschen");
    }
  };

  const sendReactionRole = async (id) => {
    try {
      await axios.post(`${API}/guilds/${guildId}/reaction-roles/${id}/send`, {}, {
        headers: getAuthHeader(),
      });
      toast.success("Reaction Role wird in Discord gesendet!");
    } catch (e) {
      toast.error(e.response?.data?.detail || "Fehler beim Senden");
    }
  };

  const resetNewRR = () => {
    setNewRR({
      title: "🎭 Wähle deine Rollen",
      description: "Klicke auf einen Button um die entsprechende Rolle zu erhalten oder zu entfernen.",
      channel_id: "",
      type: "button",
      roles: [{ emoji: "🎮", role_id: "", label: "" }],
      color: "#5865F2",
      embed_image: "",
      embed_thumbnail: "",
    });
  };

  const openEditDialog = (rr) => {
    setEditingRR({
      ...rr,
      roles: rr.roles || [{ emoji: rr.emoji, role_id: rr.role_id, label: "" }],
    });
    setEditOpen(true);
  };

  const addRoleSlot = (isEdit = false) => {
    const target = isEdit ? editingRR : newRR;
    const setter = isEdit ? setEditingRR : setNewRR;
    
    if (target.roles.length >= 10) {
      toast.error("Maximal 10 Rollen pro Nachricht");
      return;
    }
    setter({
      ...target,
      roles: [...target.roles, { emoji: "", role_id: "", label: "" }],
    });
  };

  const removeRoleSlot = (index, isEdit = false) => {
    const target = isEdit ? editingRR : newRR;
    const setter = isEdit ? setEditingRR : setNewRR;
    
    setter({
      ...target,
      roles: target.roles.filter((_, i) => i !== index),
    });
  };

  const updateRole = (index, field, value, isEdit = false) => {
    const target = isEdit ? editingRR : newRR;
    const setter = isEdit ? setEditingRR : setNewRR;
    
    const updated = [...target.roles];
    updated[index][field] = value;
    setter({ ...target, roles: updated });
  };

  // Quick emojis
  const quickEmojis = ["🎮", "🎵", "🎨", "📚", "🏆", "💬", "🔔", "⚡", "🌟", "❤️", "💙", "💚", "💛", "🧡", "💜", "🎯", "🎪", "🎭", "🎬", "📺"];

  // Render role form (shared between create and edit)
  const renderRoleForm = (data, setData, isEdit = false) => (
    <div className="space-y-6 py-4">
      {/* Type Selection */}
      <div className="space-y-2">
        <Label className="text-gray-300">Typ</Label>
        <Select value={data.type} onValueChange={(v) => setData({ ...data, type: v })}>
          <SelectTrigger className="bg-[#1E1F22] border-none text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#1E1F22] border-[#404249]">
            <SelectItem value="button" className="text-white">
              <div className="flex items-center gap-2">
                <MousePointer className="h-4 w-4" />
                Buttons (empfohlen)
              </div>
            </SelectItem>
            <SelectItem value="reaction" className="text-white">
              <div className="flex items-center gap-2">
                <Smile className="h-4 w-4" />
                Emoji Reaktionen
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Channel Selection */}
      <div className="space-y-2">
        <Label className="text-gray-300">Kanal *</Label>
        <TextChannelSelector
          value={data.channel_id}
          onChange={(v) => setData({ ...data, channel_id: v })}
          placeholder="Textkanal auswählen"
          guildId={guildId}
        />
      </div>

      {/* Embed Settings */}
      <div className="p-4 rounded-lg bg-[#1E1F22] space-y-4">
        <h4 className="text-white font-medium flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Embed Einstellungen
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-gray-300">Titel *</Label>
            <Input
              placeholder="🎭 Wähle deine Rollen"
              value={data.title}
              onChange={(e) => setData({ ...data, title: e.target.value })}
              className="bg-[#2B2D31] border-none text-white"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-gray-300">Embed Farbe</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={data.color}
                onChange={(e) => setData({ ...data, color: e.target.value })}
                className="bg-[#2B2D31] border-none w-14 h-10 p-1 cursor-pointer"
              />
              <Input
                value={data.color}
                onChange={(e) => setData({ ...data, color: e.target.value })}
                className="bg-[#2B2D31] border-none text-white font-mono flex-1"
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-gray-300">Beschreibung</Label>
          <Textarea
            placeholder="Klicke auf einen Button um die entsprechende Rolle zu erhalten oder zu entfernen."
            value={data.description}
            onChange={(e) => setData({ ...data, description: e.target.value })}
            className="bg-[#2B2D31] border-none text-white resize-none"
            rows={3}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-gray-300">Bild URL (optional)</Label>
            <Input
              placeholder="https://..."
              value={data.embed_image || ""}
              onChange={(e) => setData({ ...data, embed_image: e.target.value })}
              className="bg-[#2B2D31] border-none text-white"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-gray-300">Thumbnail URL (optional)</Label>
            <Input
              placeholder="https://..."
              value={data.embed_thumbnail || ""}
              onChange={(e) => setData({ ...data, embed_thumbnail: e.target.value })}
              className="bg-[#2B2D31] border-none text-white"
            />
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="p-4 rounded-lg bg-[#36393F] space-y-3">
        <p className="text-xs text-gray-400 uppercase tracking-wider">Vorschau</p>
        <div 
          className="border-l-4 rounded-r bg-[#2F3136] p-4"
          style={{ borderColor: data.color }}
        >
          <p className="text-white font-medium">{data.title || "Titel"}</p>
          <p className="text-sm text-gray-300 mt-1">{data.description || "Beschreibung..."}</p>
          <div className="flex flex-wrap gap-2 mt-3">
            {data.roles.filter(r => r.emoji).map((role, idx) => (
              <div key={idx} className="px-3 py-1.5 rounded bg-[#4F545C] text-white text-sm flex items-center gap-2">
                <span>{role.emoji}</span>
                <span>{role.label || `Rolle ${idx + 1}`}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Roles */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-gray-300">Rollen ({data.roles.length}/10)</Label>
          <Button
            type="button"
            onClick={() => addRoleSlot(isEdit)}
            variant="ghost"
            size="sm"
            className="text-[#5865F2] hover:text-[#5865F2]"
            disabled={data.roles.length >= 10}
          >
            <Plus className="h-4 w-4 mr-1" />
            Rolle hinzufügen
          </Button>
        </div>

        {data.roles.map((role, index) => (
          <div key={index} className="p-4 rounded-lg bg-[#1E1F22] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Rolle #{index + 1}</span>
              {data.roles.length > 1 && (
                <Button
                  type="button"
                  onClick={() => removeRoleSlot(index, isEdit)}
                  variant="ghost"
                  size="icon"
                  className="text-[#DA373C] hover:text-[#DA373C] h-8 w-8"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label className="text-xs text-gray-400">Emoji *</Label>
                <Input
                  placeholder="🎮"
                  value={role.emoji}
                  onChange={(e) => updateRole(index, "emoji", e.target.value, isEdit)}
                  className="bg-[#2B2D31] border-none text-white text-center text-lg"
                />
                <div className="flex flex-wrap gap-1 mt-1">
                  {quickEmojis.slice(0, 10).map((e) => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => updateRole(index, "emoji", e, isEdit)}
                      className="text-lg hover:bg-[#404249] rounded p-0.5 transition-colors"
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-gray-400">Rolle *</Label>
                <RoleSelector
                  value={role.role_id}
                  onChange={(v) => updateRole(index, "role_id", v, isEdit)}
                  placeholder="Rolle auswählen"
                  guildId={guildId}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-gray-400">Button Label</Label>
                <Input
                  placeholder="z.B. Gamer"
                  value={role.label}
                  onChange={(e) => updateRole(index, "label", e.target.value, isEdit)}
                  className="bg-[#2B2D31] border-none text-white"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (!guildId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Tags className="h-12 w-12 text-gray-500 mx-auto mb-4" />
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
            <div className="p-2 rounded-lg bg-[#EB459E]/20">
              <Tags className="h-6 w-6 text-[#EB459E]" />
            </div>
            Reaction Roles
          </h1>
          <p className="text-gray-400 mt-1">
            Lass Benutzer sich selbst Rollen über Reaktionen oder Buttons geben
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#5865F2] hover:bg-[#4752C4] text-white">
              <Plus className="h-4 w-4 mr-2" />
              Neue Reaction Role
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#2B2D31] border-[#1E1F22] text-white max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-[Outfit]">Neue Reaction Role erstellen</DialogTitle>
              <DialogDescription className="text-gray-400">
                Erstelle eine Embed-Nachricht mit Buttons oder Reaktionen für Rollen
              </DialogDescription>
            </DialogHeader>

            {renderRoleForm(newRR, setNewRR, false)}

            <DialogFooter>
              <Button variant="ghost" onClick={() => setCreateOpen(false)} className="text-gray-400">
                Abbrechen
              </Button>
              <Button
                onClick={createReactionRole}
                disabled={loading}
                className="bg-[#5865F2] hover:bg-[#4752C4] text-white"
              >
                <Send className="h-4 w-4 mr-2" />
                Erstellen & Senden
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="bg-[#2B2D31] border-[#1E1F22] text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-[Outfit]">Reaction Role bearbeiten</DialogTitle>
            <DialogDescription className="text-gray-400">
              Bearbeite die Einstellungen dieser Reaction Role
            </DialogDescription>
          </DialogHeader>

          {editingRR && renderRoleForm(editingRR, setEditingRR, true)}

          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditOpen(false)} className="text-gray-400">
              Abbrechen
            </Button>
            <Button
              onClick={updateReactionRole}
              disabled={loading}
              className="bg-[#23A559] hover:bg-[#1A7F44] text-white"
            >
              <Save className="h-4 w-4 mr-2" />
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-[#2B2D31] border-[#1E1F22]">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-[#5865F2]/20">
                <MousePointer className="h-6 w-6 text-[#5865F2]" />
              </div>
              <div>
                <h3 className="text-white font-medium">Button Reaction Roles</h3>
                <p className="text-sm text-gray-400 mt-1">
                  Benutzer klicken auf Buttons unter der Nachricht. Moderner und übersichtlicher.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#2B2D31] border-[#1E1F22]">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-[#F0B232]/20">
                <Smile className="h-6 w-6 text-[#F0B232]" />
              </div>
              <div>
                <h3 className="text-white font-medium">Emoji Reaction Roles</h3>
                <p className="text-sm text-gray-400 mt-1">
                  Klassische Reaktionen mit Emojis. Benutzer reagieren auf die Nachricht.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Existing Reaction Roles */}
      <Card className="bg-[#2B2D31] border-[#1E1F22]">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-white font-[Outfit] flex items-center gap-2">
              <Tags className="h-5 w-5 text-[#EB459E]" />
              Aktive Reaction Roles ({reactionRoles.length})
            </CardTitle>
            <CardDescription className="text-gray-400">
              Alle konfigurierten Reaction Role Nachrichten
            </CardDescription>
          </div>
          <Button onClick={fetchReactionRoles} variant="ghost" size="icon" className="text-gray-400 hover:text-white">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {reactionRoles.length > 0 ? (
            <div className="space-y-4">
              {reactionRoles.map((rr) => (
                <div
                  key={rr.id}
                  className="p-4 rounded-lg bg-[#1E1F22] border-l-4"
                  style={{ borderColor: rr.color || "#5865F2" }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {rr.role_type === "button" ? (
                          <MousePointer className="h-4 w-4 text-[#5865F2]" />
                        ) : (
                          <Smile className="h-4 w-4 text-[#F0B232]" />
                        )}
                        <span className="text-white font-medium">
                          {rr.title || "Reaction Role"}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded bg-gray-700 text-gray-300">
                          {rr.role_type === "button" ? "Button" : "Reaktion"}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400 mt-1 line-clamp-2">{rr.description}</p>
                      <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Hash className="h-3 w-3" />
                          Kanal: {rr.channel_id?.slice(0, 12)}...
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          Nachricht: {rr.message_id?.slice(0, 12)}...
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-lg">{rr.emoji}</span>
                        <span className="text-gray-400">→</span>
                        <span className="text-[#5865F2] text-sm">Rolle {rr.role_id?.slice(0, 12)}...</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => sendReactionRole(rr.id)}
                        variant="ghost"
                        size="sm"
                        className="text-[#23A559] hover:text-[#23A559] hover:bg-[#23A559]/10"
                      >
                        <Send className="h-4 w-4 mr-1" />
                        Senden
                      </Button>
                      <Button
                        onClick={() => openEditDialog(rr)}
                        variant="ghost"
                        size="icon"
                        className="text-[#5865F2] hover:text-[#5865F2] hover:bg-[#5865F2]/10"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => deleteReactionRole(rr.id)}
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
              <Tags className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">Keine Reaction Roles vorhanden</p>
              <p className="text-gray-500 text-sm mt-1">
                Erstelle deine erste Reaction Role mit dem Button oben
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Discord Commands */}
      <Card className="bg-[#2B2D31] border-[#1E1F22]">
        <CardHeader>
          <CardTitle className="text-white font-[Outfit]">Discord Befehle</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { cmd: "/reactionrole create", desc: "Erstelle Button Reaction Roles" },
              { cmd: "/reactionrole reaction", desc: "Füge Emoji Reaktion zu Nachricht hinzu" },
              { cmd: "/reactionrole list", desc: "Liste alle Reaction Roles" },
            ].map((item) => (
              <div key={item.cmd} className="p-3 rounded-lg bg-[#1E1F22] flex items-center gap-3">
                <code className="text-[#EB459E] text-sm font-mono">{item.cmd}</code>
                <span className="text-gray-400 text-sm">{item.desc}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Missing import
import { Save } from "lucide-react";
