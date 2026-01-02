import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Volume2, Save, Info } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function TempChannels() {
  const [config, setConfig] = useState({
    temp_channels_enabled: false,
    temp_channel_category: "",
    temp_channel_creator: "",
  });
  const [loading, setLoading] = useState(false);
  const guildId = localStorage.getItem("guildId");

  useEffect(() => {
    if (guildId) {
      fetchConfig();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guildId]);

  const fetchConfig = async () => {
    try {
      const res = await axios.get(`${API}/guilds/${guildId}`);
      setConfig({
        temp_channels_enabled: res.data.temp_channels_enabled || false,
        temp_channel_category: res.data.temp_channel_category || "",
        temp_channel_creator: res.data.temp_channel_creator || "",
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

  if (!guildId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">Bitte wähle zuerst einen Server im Dashboard aus</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl animate-fade-in">
      {/* Main Settings */}
      <Card className="bg-[#2B2D31] border-[#1E1F22]">
        <CardHeader>
          <CardTitle className="text-white font-[Outfit] flex items-center gap-2">
            <Volume2 className="h-5 w-5 text-[#5865F2]" />
            Temporäre Kanäle
          </CardTitle>
          <CardDescription className="text-gray-400">
            Automatisch erstellte Voice-Kanäle die sich löschen wenn leer
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable Switch */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-[#1E1F22]">
            <div>
              <Label className="text-white font-medium">Temp Kanäle aktivieren</Label>
              <p className="text-gray-400 text-sm">
                Benutzer können eigene Voice-Kanäle erstellen
              </p>
            </div>
            <Switch
              checked={config.temp_channels_enabled}
              onCheckedChange={(checked) =>
                setConfig({ ...config, temp_channels_enabled: checked })
              }
              data-testid="temp-channels-toggle"
            />
          </div>

          {/* Category ID */}
          <div className="space-y-2">
            <Label className="text-gray-300">Kategorie ID</Label>
            <Input
              placeholder="Kategorie ID für temp Kanäle"
              value={config.temp_channel_category}
              onChange={(e) =>
                setConfig({ ...config, temp_channel_category: e.target.value })
              }
              className="bg-[#1E1F22] border-none text-white font-mono"
              disabled={!config.temp_channels_enabled}
              data-testid="temp-category-input"
            />
            <p className="text-xs text-gray-500">
              In dieser Kategorie werden die temp Kanäle erstellt
            </p>
          </div>

          {/* Creator Channel ID */}
          <div className="space-y-2">
            <Label className="text-gray-300">Creator Kanal ID</Label>
            <Input
              placeholder="Voice Kanal ID"
              value={config.temp_channel_creator}
              onChange={(e) =>
                setConfig({ ...config, temp_channel_creator: e.target.value })
              }
              className="bg-[#1E1F22] border-none text-white font-mono"
              disabled={!config.temp_channels_enabled}
              data-testid="temp-creator-input"
            />
            <p className="text-xs text-gray-500">
              Wenn jemand diesen Kanal betritt, wird ein neuer temp Kanal erstellt
            </p>
          </div>

          <Button
            onClick={saveConfig}
            disabled={loading}
            className="bg-[#5865F2] hover:bg-[#4752C4] text-white btn-press w-full"
            data-testid="save-temp-channels-btn"
          >
            <Save className="h-4 w-4 mr-2" />
            Speichern
          </Button>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-[#2B2D31] border-[#1E1F22]">
        <CardHeader>
          <CardTitle className="text-white font-[Outfit] flex items-center gap-2">
            <Info className="h-5 w-5 text-[#23A559]" />
            So funktioniert es
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-gray-300 text-sm">
          <ol className="list-decimal list-inside space-y-3">
            <li>
              Erstelle eine Kategorie für temporäre Kanäle (z.B. "🔊 Temp Voice")
            </li>
            <li>
              Erstelle einen Voice-Kanal als "Creator" (z.B. "➕ Kanal erstellen")
            </li>
            <li>Kopiere die IDs und füge sie oben ein</li>
            <li>Aktiviere das Feature</li>
          </ol>
          <div className="p-4 rounded-lg bg-[#1E1F22] mt-4">
            <p className="text-white font-medium mb-2">Features:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-400">
              <li>Eigener Kanal mit dem Namen des Erstellers</li>
              <li>Ersteller kann den Kanal verwalten</li>
              <li>Automatische Löschung wenn leer</li>
              <li>Limit von 10 Benutzern pro Kanal</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
