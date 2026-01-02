import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Bot, Save, Sparkles, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AISettings() {
  const [config, setConfig] = useState({
    ai_enabled: false,
    ai_channel: "",
    ai_system_prompt: "Du bist ein freundlicher Discord-Bot Assistent.",
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
        ai_enabled: res.data.ai_enabled || false,
        ai_channel: res.data.ai_channel || "",
        ai_system_prompt:
          res.data.ai_system_prompt || "Du bist ein freundlicher Discord-Bot Assistent.",
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
            <Bot className="h-5 w-5 text-[#5865F2]" />
            KI Chat Integration
          </CardTitle>
          <CardDescription className="text-gray-400">
            ChatGPT-powered Antworten in einem bestimmten Kanal
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable Switch */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-[#1E1F22]">
            <div>
              <Label className="text-white font-medium">KI Chat aktivieren</Label>
              <p className="text-gray-400 text-sm">
                Bot antwortet auf alle Nachrichten im AI Kanal
              </p>
            </div>
            <Switch
              checked={config.ai_enabled}
              onCheckedChange={(checked) => setConfig({ ...config, ai_enabled: checked })}
              data-testid="ai-toggle"
            />
          </div>

          {/* AI Channel */}
          <div className="space-y-2">
            <Label className="text-gray-300">AI Kanal ID</Label>
            <Input
              placeholder="Kanal ID für AI Antworten"
              value={config.ai_channel}
              onChange={(e) => setConfig({ ...config, ai_channel: e.target.value })}
              className="bg-[#1E1F22] border-none text-white font-mono"
              disabled={!config.ai_enabled}
              data-testid="ai-channel-input"
            />
            <p className="text-xs text-gray-500">
              In diesem Kanal antwortet der Bot mit KI auf jede Nachricht
            </p>
          </div>

          {/* System Prompt */}
          <div className="space-y-2">
            <Label className="text-gray-300">System Prompt</Label>
            <Textarea
              placeholder="Du bist ein freundlicher Discord-Bot Assistent..."
              value={config.ai_system_prompt}
              onChange={(e) => setConfig({ ...config, ai_system_prompt: e.target.value })}
              className="bg-[#1E1F22] border-none text-white min-h-32"
              disabled={!config.ai_enabled}
              data-testid="ai-prompt-input"
            />
            <p className="text-xs text-gray-500">
              Definiert die Persönlichkeit und den Kontext der KI
            </p>
          </div>

          <Button
            onClick={saveConfig}
            disabled={loading}
            className="bg-[#5865F2] hover:bg-[#4752C4] text-white btn-press w-full"
            data-testid="save-ai-btn"
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
            <Sparkles className="h-5 w-5 text-[#F0B232]" />
            Tipps für den System Prompt
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3 text-gray-300 text-sm">
            <p>Der System Prompt bestimmt wie die KI antwortet. Beispiele:</p>
            <div className="space-y-2">
              <div className="p-3 rounded-lg bg-[#1E1F22]">
                <p className="text-[#5865F2] font-medium mb-1">Freundlicher Helfer</p>
                <p className="text-gray-400 text-xs">
                  "Du bist ein freundlicher und hilfsbereiter Discord-Bot. Antworte immer
                  höflich und ausführlich auf Deutsch."
                </p>
              </div>
              <div className="p-3 rounded-lg bg-[#1E1F22]">
                <p className="text-[#EB459E] font-medium mb-1">Gaming Community</p>
                <p className="text-gray-400 text-xs">
                  "Du bist ein Gaming-Experte und hilfst bei Fragen zu Spielen. Benutze
                  gelegentlich Gaming-Slang und Emojis."
                </p>
              </div>
              <div className="p-3 rounded-lg bg-[#1E1F22]">
                <p className="text-[#23A559] font-medium mb-1">Support Bot</p>
                <p className="text-gray-400 text-xs">
                  "Du bist ein Support-Bot für [Server Name]. Beantworte Fragen kurz und
                  präzise. Bei komplexen Problemen verweise auf die Moderatoren."
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Key Notice */}
      <Card className="bg-[#2B2D31] border-[#1E1F22] border-l-4 border-l-[#F0B232]">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <MessageSquare className="h-5 w-5 text-[#F0B232] mt-0.5" />
            <div>
              <p className="text-white font-medium">API Key erforderlich</p>
              <p className="text-gray-400 text-sm">
                Für die KI-Funktion wird ein OpenAI API Key benötigt. Konfiguriere diesen
                in den <span className="text-[#5865F2]">Einstellungen</span>. Alternativ
                wird der Emergent LLM Key verwendet.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
