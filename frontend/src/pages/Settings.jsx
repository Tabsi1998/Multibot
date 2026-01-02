import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Key, Globe, Save, Eye, EyeOff, Bot, Sparkles } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Settings() {
  const [discordToken, setDiscordToken] = useState("");
  const [openaiKey, setOpenaiKey] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [showOpenai, setShowOpenai] = useState(false);
  const [config, setConfig] = useState({ language: "de", prefix: "!" });
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
      setConfig(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const saveTokens = async () => {
    setLoading(true);
    try {
      await axios.post(`${API}/bot/configure`, {
        discord_token: discordToken || undefined,
        openai_api_key: openaiKey || undefined,
      });
      toast.success("Tokens gespeichert! Bitte starte den Bot neu.");
      setDiscordToken("");
      setOpenaiKey("");
    } catch (e) {
      toast.error("Fehler beim Speichern");
    }
    setLoading(false);
  };

  const saveConfig = async () => {
    if (!guildId) {
      toast.error("Bitte wähle zuerst einen Server im Dashboard aus");
      return;
    }
    setLoading(true);
    try {
      await axios.put(`${API}/guilds/${guildId}`, {
        language: config.language,
        prefix: config.prefix,
      });
      toast.success("Einstellungen gespeichert!");
    } catch (e) {
      toast.error("Fehler beim Speichern");
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6 max-w-3xl animate-fade-in">
      {/* Bot Tokens */}
      <Card className="bg-[#2B2D31] border-[#1E1F22]">
        <CardHeader>
          <CardTitle className="text-white font-[Outfit] flex items-center gap-2">
            <Key className="h-5 w-5 text-[#5865F2]" />
            Bot Konfiguration
          </CardTitle>
          <CardDescription className="text-gray-400">
            Konfiguriere die API-Schlüssel für deinen Bot
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Discord Token */}
          <div className="space-y-2">
            <Label className="text-gray-300 flex items-center gap-2">
              <Bot className="h-4 w-4" />
              Discord Bot Token
            </Label>
            <div className="relative">
              <Input
                type={showToken ? "text" : "password"}
                placeholder="Dein Discord Bot Token"
                value={discordToken}
                onChange={(e) => setDiscordToken(e.target.value)}
                className="bg-[#1E1F22] border-none text-white placeholder:text-gray-500 pr-10 font-mono"
                data-testid="discord-token-input"
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-xs text-gray-500">
              Erstelle einen Bot auf{" "}
              <a
                href="https://discord.com/developers/applications"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#5865F2] hover:underline"
              >
                Discord Developer Portal
              </a>
            </p>
          </div>

          {/* OpenAI Key */}
          <div className="space-y-2">
            <Label className="text-gray-300 flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              OpenAI API Key (optional)
            </Label>
            <div className="relative">
              <Input
                type={showOpenai ? "text" : "password"}
                placeholder="sk-..."
                value={openaiKey}
                onChange={(e) => setOpenaiKey(e.target.value)}
                className="bg-[#1E1F22] border-none text-white placeholder:text-gray-500 pr-10 font-mono"
                data-testid="openai-key-input"
              />
              <button
                type="button"
                onClick={() => setShowOpenai(!showOpenai)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showOpenai ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-xs text-gray-500">
              Für KI-Chat Funktion. Leer lassen für Emergent LLM Key.
            </p>
          </div>

          <Button
            onClick={saveTokens}
            disabled={loading || (!discordToken && !openaiKey)}
            className="bg-[#5865F2] hover:bg-[#4752C4] text-white btn-press w-full"
            data-testid="save-tokens-btn"
          >
            <Save className="h-4 w-4 mr-2" />
            Tokens speichern
          </Button>
        </CardContent>
      </Card>

      {/* Server Settings */}
      <Card className="bg-[#2B2D31] border-[#1E1F22]">
        <CardHeader>
          <CardTitle className="text-white font-[Outfit] flex items-center gap-2">
            <Globe className="h-5 w-5 text-[#23A559]" />
            Server Einstellungen
          </CardTitle>
          <CardDescription className="text-gray-400">
            Allgemeine Einstellungen für den ausgewählten Server
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!guildId && (
            <div className="p-4 rounded-lg bg-[#F0B232]/10 border border-[#F0B232]/20">
              <p className="text-[#F0B232] text-sm">
                ⚠️ Bitte wähle zuerst einen Server im Dashboard aus
              </p>
            </div>
          )}

          {/* Language */}
          <div className="space-y-2">
            <Label className="text-gray-300">Sprache</Label>
            <Select
              value={config.language}
              onValueChange={(value) => setConfig({ ...config, language: value })}
              disabled={!guildId}
            >
              <SelectTrigger
                className="bg-[#1E1F22] border-none text-white"
                data-testid="language-select"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1E1F22] border-[#404249]">
                <SelectItem value="de" className="text-white hover:bg-[#404249]">
                  🇩🇪 Deutsch
                </SelectItem>
                <SelectItem value="en" className="text-white hover:bg-[#404249]">
                  🇬🇧 English
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Prefix */}
          <div className="space-y-2">
            <Label className="text-gray-300">Command Prefix</Label>
            <Input
              value={config.prefix}
              onChange={(e) => setConfig({ ...config, prefix: e.target.value })}
              className="bg-[#1E1F22] border-none text-white w-24 font-mono"
              maxLength={3}
              disabled={!guildId}
              data-testid="prefix-input"
            />
            <p className="text-xs text-gray-500">
              Prefix für Custom Commands (z.B. !help)
            </p>
          </div>

          <Button
            onClick={saveConfig}
            disabled={loading || !guildId}
            className="bg-[#23A559] hover:bg-[#1E8E4A] text-white btn-press w-full"
            data-testid="save-config-btn"
          >
            <Save className="h-4 w-4 mr-2" />
            Einstellungen speichern
          </Button>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-[#2B2D31] border-[#1E1F22]">
        <CardHeader>
          <CardTitle className="text-white font-[Outfit]">Bot einrichten</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3 text-gray-300 text-sm">
            <p className="font-medium text-white">Schnellstart:</p>
            <ol className="list-decimal list-inside space-y-2 text-gray-400">
              <li>
                Gehe zum{" "}
                <a
                  href="https://discord.com/developers/applications"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#5865F2] hover:underline"
                >
                  Discord Developer Portal
                </a>
              </li>
              <li>Erstelle eine neue Application</li>
              <li>Gehe zu "Bot" und erstelle einen Bot</li>
              <li>Kopiere den Token und füge ihn oben ein</li>
              <li>
                Aktiviere unter "Privileged Gateway Intents":
                <ul className="list-disc list-inside ml-4 mt-1">
                  <li>SERVER MEMBERS INTENT</li>
                  <li>MESSAGE CONTENT INTENT</li>
                </ul>
              </li>
              <li>
                Lade den Bot auf deinen Server ein via OAuth2 URL Generator:
                <ul className="list-disc list-inside ml-4 mt-1">
                  <li>Scopes: bot, applications.commands</li>
                  <li>Permissions: Administrator</li>
                </ul>
              </li>
              <li>Kopiere die Server ID und füge sie im Dashboard ein</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
