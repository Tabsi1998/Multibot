import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Copy,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function ReactionRoles() {
  const [reactionRoles, setReactionRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [newRR, setNewRR] = useState({
    title: "",
    description: "",
    channel_id: "",
    type: "button",
    roles: [{ emoji: "", role_id: "", label: "" }],
    color: "#5865F2",
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
    if (!newRR.title || !newRR.channel_id || newRR.roles.length === 0) {
      toast.error("Bitte fülle alle Pflichtfelder aus");
      return;
    }

    const validRoles = newRR.roles.filter(r => r.emoji && r.role_id);
    if (validRoles.length === 0) {
      toast.error("Mindestens eine Rolle mit Emoji und Rollen-ID benötigt");
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
      toast.success("Reaction Role erstellt!");
      setCreateOpen(false);
      setNewRR({
        title: "",
        description: "",
        channel_id: "",
        type: "button",
        roles: [{ emoji: "", role_id: "", label: "" }],
        color: "#5865F2",
      });
      fetchReactionRoles();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Fehler beim Erstellen");
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

  const addRoleSlot = () => {
    if (newRR.roles.length >= 10) {
      toast.error("Maximal 10 Rollen pro Nachricht");
      return;
    }
    setNewRR({
      ...newRR,
      roles: [...newRR.roles, { emoji: "", role_id: "", label: "" }],
    });
  };

  const removeRoleSlot = (index) => {
    setNewRR({
      ...newRR,
      roles: newRR.roles.filter((_, i) => i !== index),
    });
  };

  const updateRole = (index, field, value) => {
    const updated = [...newRR.roles];
    updated[index][field] = value;
    setNewRR({ ...newRR, roles: updated });
  };

  // Common emojis for quick selection
  const quickEmojis = ["🎮", "🎵", "🎨", "📚", "🏆", "💬", "🔔", "⚡", "🌟", "❤️", "💙", "💚", "💛", "🧡", "💜"];

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
                Erstelle eine Nachricht mit Buttons oder Reaktionen für Rollen
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Type Selection */}
              <div className="space-y-2">
                <Label className="text-gray-300">Typ</Label>
                <Select value={newRR.type} onValueChange={(v) => setNewRR({ ...newRR, type: v })}>
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

              {/* Channel ID */}
              <div className="space-y-2">
                <Label className="text-gray-300">Kanal ID *</Label>
                <Input
                  placeholder="Textkanal ID eingeben"
                  value={newRR.channel_id}
                  onChange={(e) => setNewRR({ ...newRR, channel_id: e.target.value })}
                  className="bg-[#1E1F22] border-none text-white font-mono"
                />
              </div>

              {/* Title & Description */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-300">Titel *</Label>
                  <Input
                    placeholder="🎭 Wähle deine Rollen"
                    value={newRR.title}
                    onChange={(e) => setNewRR({ ...newRR, title: e.target.value })}
                    className="bg-[#1E1F22] border-none text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Embed Farbe</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={newRR.color}
                      onChange={(e) => setNewRR({ ...newRR, color: e.target.value })}
                      className="bg-[#1E1F22] border-none w-14 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={newRR.color}
                      onChange={(e) => setNewRR({ ...newRR, color: e.target.value })}
                      className="bg-[#1E1F22] border-none text-white font-mono flex-1"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-300">Beschreibung</Label>
                <Textarea
                  placeholder="Klicke auf einen Button um die entsprechende Rolle zu erhalten oder zu entfernen."
                  value={newRR.description}
                  onChange={(e) => setNewRR({ ...newRR, description: e.target.value })}
                  className="bg-[#1E1F22] border-none text-white resize-none"
                  rows={3}
                />
              </div>

              {/* Roles */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-gray-300">Rollen</Label>
                  <Button
                    type="button"
                    onClick={addRoleSlot}
                    variant="ghost"
                    size="sm"
                    className="text-[#5865F2] hover:text-[#5865F2]"
                    disabled={newRR.roles.length >= 10}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Rolle hinzufügen
                  </Button>
                </div>

                {newRR.roles.map((role, index) => (
                  <div key={index} className="p-4 rounded-lg bg-[#1E1F22] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Rolle #{index + 1}</span>
                      {newRR.roles.length > 1 && (
                        <Button
                          type="button"
                          onClick={() => removeRoleSlot(index)}
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
                          onChange={(e) => updateRole(index, "emoji", e.target.value)}
                          className="bg-[#2B2D31] border-none text-white text-center"
                        />
                        <div className="flex flex-wrap gap-1 mt-1">
                          {quickEmojis.slice(0, 5).map((e) => (
                            <button
                              key={e}
                              type="button"
                              onClick={() => updateRole(index, "emoji", e)}
                              className="text-lg hover:bg-[#404249] rounded p-1"
                            >
                              {e}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs text-gray-400">Rollen ID *</Label>
                        <Input
                          placeholder="123456789"
                          value={role.role_id}
                          onChange={(e) => updateRole(index, "role_id", e.target.value)}
                          className="bg-[#2B2D31] border-none text-white font-mono"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs text-gray-400">Button Label</Label>
                        <Input
                          placeholder="Gamer"
                          value={role.label}
                          onChange={(e) => updateRole(index, "label", e.target.value)}
                          className="bg-[#2B2D31] border-none text-white"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="ghost"
                onClick={() => setCreateOpen(false)}
                className="text-gray-400"
              >
                Abbrechen
              </Button>
              <Button
                onClick={createReactionRole}
                disabled={loading}
                className="bg-[#5865F2] hover:bg-[#4752C4] text-white"
              >
                Erstellen
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

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
          <Button
            onClick={fetchReactionRoles}
            variant="ghost"
            size="icon"
            className="text-gray-400 hover:text-white"
          >
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
                      <p className="text-sm text-gray-400 mt-1">{rr.description}</p>
                      <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Hash className="h-3 w-3" />
                          Kanal: {rr.channel_id}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          Nachricht: {rr.message_id}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-lg">{rr.emoji}</span>
                        <span className="text-gray-400">→</span>
                        <span className="text-[#5865F2] text-sm">@{rr.role_id}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
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
              <div
                key={item.cmd}
                className="p-3 rounded-lg bg-[#1E1F22] flex items-center gap-3"
              >
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
