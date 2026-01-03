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
  Ticket,
  Plus,
  Trash2,
  RefreshCw,
  Settings,
  MessageSquare,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  UserCheck,
  Hash,
  Palette,
  FileText,
  Shield,
  Bell,
  Grip,
  Edit,
  Save,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { RoleSelector, TextChannelSelector, CategorySelector } from "@/components/ServerDataSelector";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Tickets() {
  const [panels, setPanels] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState({ open: 0, claimed: 0, closed: 0, total: 0 });
  const [loading, setLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editPanel, setEditPanel] = useState(null);
  const [newPanel, setNewPanel] = useState({
    channel_id: "",
    title: "🎫 Support Tickets",
    description: "Klicke auf den Button um ein Ticket zu erstellen.",
    color: "#5865F2",
    button_label: "Ticket erstellen",
    button_emoji: "🎫",
    ticket_category: "",
    ticket_name_template: "ticket-{number}",
    categories: [],
    custom_fields: [],
    support_roles: [],
    ping_roles: [],
    claim_enabled: true,
    transcript_enabled: true,
  });
  const [newCategory, setNewCategory] = useState({ name: "", emoji: "", description: "" });
  const [newField, setNewField] = useState({ label: "", type: "text", required: false, options: [] });
  const guildId = localStorage.getItem("guildId");

  const getAuthHeader = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchPanels = async () => {
    try {
      const res = await axios.get(`${API}/guilds/${guildId}/ticket-panels`, { headers: getAuthHeader() });
      setPanels(res.data.panels || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchTickets = async () => {
    try {
      const res = await axios.get(`${API}/guilds/${guildId}/tickets`, { headers: getAuthHeader() });
      setTickets(res.data.tickets || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await axios.get(`${API}/guilds/${guildId}/tickets/stats`, { headers: getAuthHeader() });
      setStats(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (guildId) {
      fetchPanels();
      fetchTickets();
      fetchStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guildId]);

  const createPanel = async () => {
    if (!newPanel.channel_id) {
      toast.error("Bitte wähle einen Kanal aus");
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${API}/guilds/${guildId}/ticket-panels`, newPanel, { headers: getAuthHeader() });
      toast.success("Ticket-Panel erstellt!");
      setCreateOpen(false);
      resetNewPanel();
      fetchPanels();
    } catch (e) {
      toast.error("Fehler beim Erstellen");
    }
    setLoading(false);
  };

  const deletePanel = async (panelId) => {
    try {
      await axios.delete(`${API}/guilds/${guildId}/ticket-panels/${panelId}`, { headers: getAuthHeader() });
      toast.success("Panel gelöscht");
      fetchPanels();
    } catch (e) {
      toast.error("Fehler beim Löschen");
    }
  };

  const sendPanel = async (panelId) => {
    try {
      const res = await axios.post(`${API}/guilds/${guildId}/ticket-panels/${panelId}/send`, {}, { headers: getAuthHeader() });
      toast.success("Panel wird in Discord gesendet!");
    } catch (e) {
      toast.error(e.response?.data?.detail || "Fehler beim Senden");
    }
  };

  const resetNewPanel = () => {
    setNewPanel({
      channel_id: "",
      title: "🎫 Support Tickets",
      description: "Klicke auf den Button um ein Ticket zu erstellen.",
      color: "#5865F2",
      button_label: "Ticket erstellen",
      button_emoji: "🎫",
      ticket_category: "",
      ticket_name_template: "ticket-{number}",
      categories: [],
      custom_fields: [],
      support_roles: [],
      ping_roles: [],
      claim_enabled: true,
      transcript_enabled: true,
    });
    setNewCategory({ name: "", emoji: "", description: "" });
    setNewField({ label: "", type: "text", required: false, options: [] });
  };

  const openEditPanel = (panel) => {
    setEditPanel({
      ...panel,
      categories: panel.categories || [],
      custom_fields: panel.custom_fields || [],
      support_roles: panel.support_roles || [],
      ping_roles: panel.ping_roles || [],
    });
  };

  const updatePanel = async () => {
    if (!editPanel) return;
    setLoading(true);
    try {
      await axios.put(`${API}/guilds/${guildId}/ticket-panels/${editPanel.id}`, editPanel, { 
        headers: getAuthHeader() 
      });
      toast.success("Panel aktualisiert!");
      setEditPanel(null);
      fetchPanels();
    } catch (e) {
      toast.error("Fehler beim Aktualisieren");
    }
    setLoading(false);
  };

  const addCategoryToEdit = () => {
    if (!newCategory.name) return;
    setEditPanel({
      ...editPanel,
      categories: [...(editPanel.categories || []), { ...newCategory, id: Date.now().toString() }],
    });
    setNewCategory({ name: "", emoji: "", description: "" });
  };

  const removeCategoryFromEdit = (index) => {
    setEditPanel({
      ...editPanel,
      categories: editPanel.categories.filter((_, i) => i !== index),
    });
  };

  const addFieldToEdit = () => {
    if (!newField.label) return;
    setEditPanel({
      ...editPanel,
      custom_fields: [...(editPanel.custom_fields || []), { ...newField, id: Date.now().toString() }],
    });
    setNewField({ label: "", type: "text", required: false, options: [] });
  };

  const removeFieldFromEdit = (index) => {
    setEditPanel({
      ...editPanel,
      custom_fields: editPanel.custom_fields.filter((_, i) => i !== index),
    });
  };

  const addCategory = () => {
    if (!newCategory.name) return;
    setNewPanel({
      ...newPanel,
      categories: [...newPanel.categories, { ...newCategory, id: Date.now().toString() }],
    });
    setNewCategory({ name: "", emoji: "", description: "" });
  };

  const removeCategory = (index) => {
    setNewPanel({
      ...newPanel,
      categories: newPanel.categories.filter((_, i) => i !== index),
    });
  };

  const addField = () => {
    if (!newField.label) return;
    setNewPanel({
      ...newPanel,
      custom_fields: [...newPanel.custom_fields, { ...newField, id: Date.now().toString() }],
    });
    setNewField({ label: "", type: "text", required: false, options: [] });
  };

  const removeField = (index) => {
    setNewPanel({
      ...newPanel,
      custom_fields: newPanel.custom_fields.filter((_, i) => i !== index),
    });
  };

  if (!guildId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Ticket className="h-12 w-12 text-gray-500 mx-auto mb-4" />
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
              <Ticket className="h-6 w-6 text-[#5865F2]" />
            </div>
            Ticket System
          </h1>
          <p className="text-gray-400 mt-1">
            Support-Tickets mit Formularen, Claimen und Transcripts
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#5865F2] hover:bg-[#4752C4] text-white">
              <Plus className="h-4 w-4 mr-2" />
              Neues Panel
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#2B2D31] border-[#1E1F22] text-white max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-[Outfit]">Neues Ticket-Panel erstellen</DialogTitle>
              <DialogDescription className="text-gray-400">
                Erstelle ein Panel mit Button zum Ticket erstellen
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Basic Settings */}
              <div className="space-y-4">
                <h3 className="text-white font-medium flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Grundeinstellungen
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-300">Panel-Kanal *</Label>
                    <TextChannelSelector
                      value={newPanel.channel_id}
                      onChange={(v) => setNewPanel({ ...newPanel, channel_id: v })}
                      placeholder="Kanal auswählen"
                      guildId={guildId}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-gray-300">Ticket-Kategorie</Label>
                    <CategorySelector
                      value={newPanel.ticket_category}
                      onChange={(v) => setNewPanel({ ...newPanel, ticket_category: v })}
                      placeholder="Kategorie für Tickets"
                      guildId={guildId}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-300">Titel</Label>
                    <Input
                      value={newPanel.title}
                      onChange={(e) => setNewPanel({ ...newPanel, title: e.target.value })}
                      className="bg-[#1E1F22] border-none text-white"
                      placeholder="🎫 Support Tickets"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-gray-300">Embed-Farbe</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={newPanel.color}
                        onChange={(e) => setNewPanel({ ...newPanel, color: e.target.value })}
                        className="bg-[#1E1F22] border-none w-14 h-10 p-1 cursor-pointer"
                      />
                      <Input
                        value={newPanel.color}
                        onChange={(e) => setNewPanel({ ...newPanel, color: e.target.value })}
                        className="bg-[#1E1F22] border-none text-white font-mono flex-1"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-300">Beschreibung</Label>
                  <Textarea
                    value={newPanel.description}
                    onChange={(e) => setNewPanel({ ...newPanel, description: e.target.value })}
                    className="bg-[#1E1F22] border-none text-white resize-none"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-300">Button Emoji</Label>
                    <Input
                      value={newPanel.button_emoji}
                      onChange={(e) => setNewPanel({ ...newPanel, button_emoji: e.target.value })}
                      className="bg-[#1E1F22] border-none text-white text-center"
                      placeholder="🎫"
                    />
                  </div>
                  
                  <div className="space-y-2 col-span-2">
                    <Label className="text-gray-300">Button Text</Label>
                    <Input
                      value={newPanel.button_label}
                      onChange={(e) => setNewPanel({ ...newPanel, button_label: e.target.value })}
                      className="bg-[#1E1F22] border-none text-white"
                      placeholder="Ticket erstellen"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-300">Ticket-Kanal Name</Label>
                  <Input
                    value={newPanel.ticket_name_template}
                    onChange={(e) => setNewPanel({ ...newPanel, ticket_name_template: e.target.value })}
                    className="bg-[#1E1F22] border-none text-white font-mono"
                    placeholder="ticket-{number}"
                  />
                  <p className="text-xs text-gray-500">
                    Variablen: {"{number}"} = Ticket-Nummer, {"{user}"} = Benutzername
                  </p>
                </div>
              </div>

              {/* Support Roles */}
              <div className="space-y-4 border-t border-[#404249] pt-4">
                <h3 className="text-white font-medium flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Support-Team
                </h3>
                
                <div className="space-y-2">
                  <Label className="text-gray-300">Support-Rollen (können Tickets sehen & claimen)</Label>
                  <RoleSelector
                    value={newPanel.support_roles}
                    onChange={(v) => setNewPanel({ ...newPanel, support_roles: v })}
                    placeholder="Rollen auswählen"
                    guildId={guildId}
                    multiple
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-300">Ping-Rollen (werden bei neuem Ticket gepingt)</Label>
                  <RoleSelector
                    value={newPanel.ping_roles}
                    onChange={(v) => setNewPanel({ ...newPanel, ping_roles: v })}
                    placeholder="Rollen auswählen"
                    guildId={guildId}
                    multiple
                  />
                </div>

                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={newPanel.claim_enabled}
                      onCheckedChange={(v) => setNewPanel({ ...newPanel, claim_enabled: v })}
                    />
                    <Label className="text-gray-300">Claimen aktivieren</Label>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={newPanel.transcript_enabled}
                      onCheckedChange={(v) => setNewPanel({ ...newPanel, transcript_enabled: v })}
                    />
                    <Label className="text-gray-300">Transcripts aktivieren</Label>
                  </div>
                </div>
              </div>

              {/* Categories */}
              <div className="space-y-4 border-t border-[#404249] pt-4">
                <h3 className="text-white font-medium flex items-center gap-2">
                  <Grip className="h-4 w-4" />
                  Ticket-Kategorien (Dropdown)
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                  <Input
                    value={newCategory.emoji}
                    onChange={(e) => setNewCategory({ ...newCategory, emoji: e.target.value })}
                    className="bg-[#1E1F22] border-none text-white text-center"
                    placeholder="🔧"
                  />
                  <Input
                    value={newCategory.name}
                    onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                    className="bg-[#1E1F22] border-none text-white col-span-2"
                    placeholder="Kategorie Name"
                  />
                  <Button
                    type="button"
                    onClick={addCategory}
                    variant="outline"
                    className="border-[#5865F2] text-[#5865F2]"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {newPanel.categories.length > 0 && (
                  <div className="space-y-2">
                    {newPanel.categories.map((cat, index) => (
                      <div key={index} className="flex items-center justify-between p-2 rounded bg-[#1E1F22]">
                        <span className="text-white">
                          {cat.emoji} {cat.name}
                        </span>
                        <Button
                          type="button"
                          onClick={() => removeCategory(index)}
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-[#DA373C]"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Custom Fields */}
              <div className="space-y-4 border-t border-[#404249] pt-4">
                <h3 className="text-white font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Benutzerdefinierte Felder
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                  <Input
                    value={newField.label}
                    onChange={(e) => setNewField({ ...newField, label: e.target.value })}
                    className="bg-[#1E1F22] border-none text-white col-span-2"
                    placeholder="Feld-Name"
                  />
                  <Select
                    value={newField.type}
                    onValueChange={(v) => setNewField({ ...newField, type: v })}
                  >
                    <SelectTrigger className="bg-[#1E1F22] border-none text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1E1F22] border-[#404249]">
                      <SelectItem value="text" className="text-white">Text</SelectItem>
                      <SelectItem value="textarea" className="text-white">Mehrzeilig</SelectItem>
                      <SelectItem value="dropdown" className="text-white">Dropdown</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    onClick={addField}
                    variant="outline"
                    className="border-[#5865F2] text-[#5865F2]"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {newPanel.custom_fields.length > 0 && (
                  <div className="space-y-2">
                    {newPanel.custom_fields.map((field, index) => (
                      <div key={index} className="flex items-center justify-between p-2 rounded bg-[#1E1F22]">
                        <span className="text-white">
                          {field.label} <span className="text-gray-500">({field.type})</span>
                        </span>
                        <Button
                          type="button"
                          onClick={() => removeField(index)}
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-[#DA373C]"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="ghost" onClick={() => setCreateOpen(false)} className="text-gray-400">
                Abbrechen
              </Button>
              <Button onClick={createPanel} disabled={loading} className="bg-[#5865F2] hover:bg-[#4752C4] text-white">
                <Send className="h-4 w-4 mr-2" />
                Erstellen
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Panel Dialog */}
      <Dialog open={!!editPanel} onOpenChange={(open) => !open && setEditPanel(null)}>
        <DialogContent className="bg-[#2B2D31] border-[#1E1F22] text-white max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-[Outfit]">Panel bearbeiten</DialogTitle>
            <DialogDescription className="text-gray-400">
              Bearbeite die Einstellungen dieses Ticket-Panels
            </DialogDescription>
          </DialogHeader>

          {editPanel && (
            <div className="space-y-6 py-4">
              {/* Embed Settings */}
              <div className="space-y-4">
                <h3 className="text-white font-medium flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Embed Einstellungen
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-300">Titel</Label>
                    <Input
                      value={editPanel.title}
                      onChange={(e) => setEditPanel({ ...editPanel, title: e.target.value })}
                      className="bg-[#1E1F22] border-none text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-300">Embed Farbe</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={editPanel.color}
                        onChange={(e) => setEditPanel({ ...editPanel, color: e.target.value })}
                        className="bg-[#1E1F22] border-none w-14 h-10 p-1 cursor-pointer"
                      />
                      <Input
                        value={editPanel.color}
                        onChange={(e) => setEditPanel({ ...editPanel, color: e.target.value })}
                        className="bg-[#1E1F22] border-none text-white font-mono flex-1"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-300">Beschreibung</Label>
                  <Textarea
                    value={editPanel.description}
                    onChange={(e) => setEditPanel({ ...editPanel, description: e.target.value })}
                    className="bg-[#1E1F22] border-none text-white resize-none"
                    rows={3}
                  />
                </div>

                {/* Preview */}
                <div className="p-4 rounded-lg bg-[#36393F] space-y-3">
                  <p className="text-xs text-gray-400 uppercase tracking-wider">Vorschau</p>
                  <div 
                    className="border-l-4 rounded-r bg-[#2F3136] p-4"
                    style={{ borderColor: editPanel.color }}
                  >
                    <p className="text-white font-medium">{editPanel.title}</p>
                    <p className="text-sm text-gray-300 mt-1">{editPanel.description}</p>
                    <div className="mt-3">
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-[#5865F2] text-white text-sm">
                        <span>{editPanel.button_emoji}</span>
                        <span>{editPanel.button_label}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Button Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-300">Button Emoji</Label>
                  <Input
                    value={editPanel.button_emoji}
                    onChange={(e) => setEditPanel({ ...editPanel, button_emoji: e.target.value })}
                    className="bg-[#1E1F22] border-none text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Button Text</Label>
                  <Input
                    value={editPanel.button_label}
                    onChange={(e) => setEditPanel({ ...editPanel, button_label: e.target.value })}
                    className="bg-[#1E1F22] border-none text-white"
                  />
                </div>
              </div>

              {/* Ticket Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-300">Ticket-Kategorie</Label>
                  <CategorySelector
                    value={editPanel.ticket_category}
                    onChange={(v) => setEditPanel({ ...editPanel, ticket_category: v })}
                    placeholder="Kategorie für neue Tickets"
                    guildId={guildId}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Ticket-Kanal Name</Label>
                  <Input
                    value={editPanel.ticket_name_template}
                    onChange={(e) => setEditPanel({ ...editPanel, ticket_name_template: e.target.value })}
                    className="bg-[#1E1F22] border-none text-white"
                    placeholder="ticket-{number}"
                  />
                </div>
              </div>

              {/* Toggle Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-[#1E1F22]">
                  <div>
                    <p className="text-white">Claimen aktivieren</p>
                    <p className="text-xs text-gray-400">Supporter können Tickets beanspruchen</p>
                  </div>
                  <Switch
                    checked={editPanel.claim_enabled}
                    onCheckedChange={(v) => setEditPanel({ ...editPanel, claim_enabled: v })}
                  />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-[#1E1F22]">
                  <div>
                    <p className="text-white">Transcripts aktivieren</p>
                    <p className="text-xs text-gray-400">Speichere Chat-Verläufe</p>
                  </div>
                  <Switch
                    checked={editPanel.transcript_enabled}
                    onCheckedChange={(v) => setEditPanel({ ...editPanel, transcript_enabled: v })}
                  />
                </div>
              </div>

              {/* Ticket Categories */}
              <div className="space-y-4 border-t border-[#404249] pt-4">
                <h3 className="text-white font-medium flex items-center gap-2">
                  <Grip className="h-4 w-4" />
                  Ticket-Kategorien ({editPanel.categories?.length || 0})
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                  <Input
                    value={newCategory.emoji}
                    onChange={(e) => setNewCategory({ ...newCategory, emoji: e.target.value })}
                    className="bg-[#1E1F22] border-none text-white text-center"
                    placeholder="🔧"
                  />
                  <Input
                    value={newCategory.name}
                    onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                    className="bg-[#1E1F22] border-none text-white col-span-2"
                    placeholder="Kategorie Name"
                  />
                  <Button type="button" onClick={addCategoryToEdit} variant="outline" className="border-[#5865F2] text-[#5865F2]">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {editPanel.categories?.length > 0 && (
                  <div className="space-y-2">
                    {editPanel.categories.map((cat, index) => (
                      <div key={index} className="flex items-center justify-between p-2 rounded bg-[#1E1F22]">
                        <span className="text-white">{cat.emoji} {cat.name}</span>
                        <Button type="button" onClick={() => removeCategoryFromEdit(index)} variant="ghost" size="icon" className="h-6 w-6 text-[#DA373C]">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Custom Fields */}
              <div className="space-y-4 border-t border-[#404249] pt-4">
                <h3 className="text-white font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Benutzerdefinierte Felder ({editPanel.custom_fields?.length || 0})
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                  <Input
                    value={newField.label}
                    onChange={(e) => setNewField({ ...newField, label: e.target.value })}
                    className="bg-[#1E1F22] border-none text-white col-span-2"
                    placeholder="Feld-Name"
                  />
                  <Select value={newField.type} onValueChange={(v) => setNewField({ ...newField, type: v })}>
                    <SelectTrigger className="bg-[#1E1F22] border-none text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1E1F22] border-[#404249]">
                      <SelectItem value="text" className="text-white">Text</SelectItem>
                      <SelectItem value="textarea" className="text-white">Mehrzeilig</SelectItem>
                      <SelectItem value="dropdown" className="text-white">Dropdown</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button type="button" onClick={addFieldToEdit} variant="outline" className="border-[#5865F2] text-[#5865F2]">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {editPanel.custom_fields?.length > 0 && (
                  <div className="space-y-2">
                    {editPanel.custom_fields.map((field, index) => (
                      <div key={index} className="flex items-center justify-between p-2 rounded bg-[#1E1F22]">
                        <span className="text-white">{field.label} <span className="text-gray-500">({field.type})</span></span>
                        <Button type="button" onClick={() => removeFieldFromEdit(index)} variant="ghost" size="icon" className="h-6 w-6 text-[#DA373C]">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditPanel(null)} className="text-gray-400">
              Abbrechen
            </Button>
            <Button onClick={updatePanel} disabled={loading} className="bg-[#23A559] hover:bg-[#1A7F44] text-white">
              <Save className="h-4 w-4 mr-2" />
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="bg-[#2B2D31] border-[#1E1F22]">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-[#F0B232]/20">
                <Clock className="h-6 w-6 text-[#F0B232]" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Offen</p>
                <p className="text-2xl font-bold text-white">{stats.open}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#2B2D31] border-[#1E1F22]">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-[#5865F2]/20">
                <UserCheck className="h-6 w-6 text-[#5865F2]" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Beansprucht</p>
                <p className="text-2xl font-bold text-white">{stats.claimed}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#2B2D31] border-[#1E1F22]">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-[#23A559]/20">
                <CheckCircle className="h-6 w-6 text-[#23A559]" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Geschlossen</p>
                <p className="text-2xl font-bold text-white">{stats.closed}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#2B2D31] border-[#1E1F22]">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-[#EB459E]/20">
                <Ticket className="h-6 w-6 text-[#EB459E]" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Gesamt</p>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Panels */}
      <Card className="bg-[#2B2D31] border-[#1E1F22]">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-white font-[Outfit] flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-[#5865F2]" />
              Ticket-Panels ({panels.length})
            </CardTitle>
            <CardDescription className="text-gray-400">
              Deine konfigurierten Ticket-Panels
            </CardDescription>
          </div>
          <Button onClick={fetchPanels} variant="ghost" size="icon" className="text-gray-400 hover:text-white">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {panels.length > 0 ? (
            <div className="space-y-4">
              {panels.map((panel) => (
                <div
                  key={panel.id}
                  className="p-4 rounded-lg bg-[#1E1F22] border-l-4"
                  style={{ borderColor: panel.color || "#5865F2" }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{panel.button_emoji}</span>
                        <span className="text-white font-medium">{panel.title}</span>
                      </div>
                      <p className="text-sm text-gray-400 mt-1 line-clamp-2">{panel.description}</p>
                      <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Hash className="h-3 w-3" />
                          Kanal: {panel.channel_id?.slice(0, 8)}...
                        </span>
                        <span className="flex items-center gap-1">
                          <Ticket className="h-3 w-3" />
                          Tickets: {panel.ticket_counter || 0}
                        </span>
                        {panel.categories?.length > 0 && (
                          <span className="flex items-center gap-1">
                            <Grip className="h-3 w-3" />
                            {panel.categories.length} Kategorien
                          </span>
                        )}
                        {panel.custom_fields?.length > 0 && (
                          <span className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            {panel.custom_fields.length} Felder
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => sendPanel(panel.id)}
                        variant="ghost"
                        size="sm"
                        className="text-[#23A559] hover:text-[#23A559] hover:bg-[#23A559]/10"
                        title="Im Kanal senden"
                      >
                        <Send className="h-4 w-4 mr-1" />
                        Senden
                      </Button>
                      <Button
                        onClick={() => openEditPanel(panel)}
                        variant="ghost"
                        size="icon"
                        className="text-[#5865F2] hover:text-[#5865F2] hover:bg-[#5865F2]/10"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => deletePanel(panel.id)}
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
              <Ticket className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">Keine Ticket-Panels</p>
              <p className="text-gray-500 text-sm mt-1">
                Erstelle dein erstes Panel mit dem Button oben
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Tickets */}
      <Card className="bg-[#2B2D31] border-[#1E1F22]">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-white font-[Outfit] flex items-center gap-2">
              <Clock className="h-5 w-5 text-[#F0B232]" />
              Letzte Tickets
            </CardTitle>
          </div>
          <Button onClick={fetchTickets} variant="ghost" size="icon" className="text-gray-400 hover:text-white">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {tickets.length > 0 ? (
            <div className="space-y-2">
              {tickets.slice(0, 10).map((ticket) => (
                <div
                  key={ticket.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-[#1E1F22]"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      ticket.status === "open" ? "bg-[#F0B232]/20" :
                      ticket.status === "claimed" ? "bg-[#5865F2]/20" :
                      "bg-[#23A559]/20"
                    }`}>
                      {ticket.status === "open" ? <Clock className="h-4 w-4 text-[#F0B232]" /> :
                       ticket.status === "claimed" ? <UserCheck className="h-4 w-4 text-[#5865F2]" /> :
                       <CheckCircle className="h-4 w-4 text-[#23A559]" />}
                    </div>
                    <div>
                      <p className="text-white font-medium">Ticket #{ticket.ticket_number}</p>
                      <p className="text-xs text-gray-500">
                        {ticket.category || "Allgemein"} • {ticket.user_id?.slice(0, 8)}...
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${
                    ticket.status === "open" ? "bg-[#F0B232]/20 text-[#F0B232]" :
                    ticket.status === "claimed" ? "bg-[#5865F2]/20 text-[#5865F2]" :
                    "bg-[#23A559]/20 text-[#23A559]"
                  }`}>
                    {ticket.status === "open" ? "Offen" : ticket.status === "claimed" ? "Beansprucht" : "Geschlossen"}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Ticket className="h-12 w-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500">Noch keine Tickets</p>
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
              { cmd: "/ticket claim", desc: "Ticket beanspruchen" },
              { cmd: "/ticket close", desc: "Ticket schließen" },
              { cmd: "/ticket add @user", desc: "Benutzer zum Ticket hinzufügen" },
              { cmd: "/ticket remove @user", desc: "Benutzer entfernen" },
              { cmd: "/ticket rename", desc: "Ticket umbenennen" },
              { cmd: "/ticket transcript", desc: "Transcript erstellen" },
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
