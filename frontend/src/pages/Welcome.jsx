import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { UserPlus, Save, Plus, Trash2, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Welcome() {
  const [config, setConfig] = useState({
    welcome_enabled: false,
    welcome_channel: "",
    welcome_message: "",
    goodbye_enabled: false,
    goodbye_message: "",
    auto_roles: [],
  });
  const [newAutoRole, setNewAutoRole] = useState("");
  const [loading, setLoading] = useState(false);
  const guildId = localStorage.getItem("guildId");

  useEffect(() => {
    if (guildId) {
      fetchConfig();
    }
  }, [guildId]);

  const fetchConfig = async () => {
    try {
      const res = await axios.get(`${API}/guilds/${guildId}`);
      setConfig({
        welcome_enabled: res.data.welcome_enabled || false,
        welcome_channel: res.data.welcome_channel || "",
        welcome_message: res.data.welcome_message || "",
        goodbye_enabled: res.data.goodbye_enabled || false,
        goodbye_message: res.data.goodbye_message || "",
        auto_roles: res.data.auto_roles || [],
      });
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

  const addAutoRole = () => {
    if (!newAutoRole) return;
    if (config.auto_roles.includes(newAutoRole)) {
      toast.error("Rolle bereits hinzugefügt");
      return;
    }
    setConfig({
      ...config,
      auto_roles: [...config.auto_roles, newAutoRole],
    });
    setNewAutoRole("");
  };

  const removeAutoRole = (roleId) => {
    setConfig({
      ...config,
      auto_roles: config.auto_roles.filter((id) => id !== roleId),
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
    <div className="space-y-6 max-w-3xl animate-fade-in">
      {/* Welcome Message */}
      <Card className="bg-[#2B2D31] border-[#1E1F22]">
        <CardHeader>
          <CardTitle className="text-white font-[Outfit] flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-[#23A559]" />
            Willkommensnachricht
          </CardTitle>
          <CardDescription className="text-gray-400">
            Begrüße neue Mitglieder auf deinem Server
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Enable Switch */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-[#1E1F22]">
            <div>
              <Label className="text-white font-medium">Willkommen aktivieren</Label>
              <p className="text-gray-400 text-sm">Nachricht bei Server-Beitritt</p>
            </div>
            <Switch
              checked={config.welcome_enabled}
              onCheckedChange={(checked) =>
                setConfig({ ...config, welcome_enabled: checked })
              }
              data-testid="welcome-toggle"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-gray-300">Willkommens-Kanal ID</Label>
            <Input
              placeholder="Kanal ID"
              value={config.welcome_channel}
              onChange={(e) => setConfig({ ...config, welcome_channel: e.target.value })}
              className="bg-[#1E1F22] border-none text-white font-mono"
              disabled={!config.welcome_enabled}
              data-testid="welcome-channel-input"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-gray-300">Willkommens-Nachricht</Label>
            <Textarea
              placeholder="Willkommen {user} auf {server}! 🎉"
              value={config.welcome_message}
              onChange={(e) => setConfig({ ...config, welcome_message: e.target.value })}
              className="bg-[#1E1F22] border-none text-white min-h-24"
              disabled={!config.welcome_enabled}
              data-testid="welcome-message-input"
            />
            <p className="text-xs text-gray-500">
              Variablen: {"{user}"} = Benutzer Mention, {"{server}"} = Servername
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Goodbye Message */}
      <Card className="bg-[#2B2D31] border-[#1E1F22]">
        <CardHeader>
          <CardTitle className="text-white font-[Outfit] flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-[#F0B232]" />
            Verabschiedung
          </CardTitle>
          <CardDescription className="text-gray-400">
            Nachricht wenn jemand den Server verlässt
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Enable Switch */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-[#1E1F22]">
            <div>
              <Label className="text-white font-medium">Verabschiedung aktivieren</Label>
              <p className="text-gray-400 text-sm">
                Nachricht im gleichen Kanal wie Willkommen
              </p>
            </div>
            <Switch
              checked={config.goodbye_enabled}
              onCheckedChange={(checked) =>
                setConfig({ ...config, goodbye_enabled: checked })
              }
              data-testid="goodbye-toggle"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-gray-300">Verabschiedungs-Nachricht</Label>
            <Textarea
              placeholder="Auf Wiedersehen {user}! 👋"
              value={config.goodbye_message}
              onChange={(e) => setConfig({ ...config, goodbye_message: e.target.value })}
              className="bg-[#1E1F22] border-none text-white min-h-24"
              disabled={!config.goodbye_enabled}
              data-testid="goodbye-message-input"
            />
          </div>
        </CardContent>
      </Card>

      {/* Auto Roles */}
      <Card className="bg-[#2B2D31] border-[#1E1F22]">
        <CardHeader>
          <CardTitle className="text-white font-[Outfit] flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-[#5865F2]" />
            Auto-Rollen
          </CardTitle>
          <CardDescription className="text-gray-400">
            Rollen die neuen Mitgliedern automatisch gegeben werden
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Rollen-ID"
              value={newAutoRole}
              onChange={(e) => setNewAutoRole(e.target.value)}
              className="bg-[#1E1F22] border-none text-white font-mono"
              data-testid="auto-role-input"
            />
            <Button
              onClick={addAutoRole}
              className="bg-[#5865F2] hover:bg-[#4752C4] text-white btn-press"
              data-testid="add-auto-role-btn"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {config.auto_roles.map((roleId) => (
              <div
                key={roleId}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#5865F2]/20 text-[#5865F2]"
              >
                <span className="font-mono text-sm">{roleId}</span>
                <button
                  onClick={() => removeAutoRole(roleId)}
                  className="hover:text-white"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
            {config.auto_roles.length === 0 && (
              <p className="text-gray-500 text-sm">Keine Auto-Rollen konfiguriert</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <Button
        onClick={saveConfig}
        disabled={loading}
        className="bg-[#23A559] hover:bg-[#1E8E4A] text-white btn-press w-full"
        data-testid="save-welcome-btn"
      >
        <Save className="h-4 w-4 mr-2" />
        Alle Einstellungen speichern
      </Button>
    </div>
  );
}
