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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Shield, AlertTriangle, Trash2, Save, Search } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Moderation() {
  const [config, setConfig] = useState({});
  const [warnings, setWarnings] = useState([]);
  const [modLogs, setModLogs] = useState([]);
  const [searchUserId, setSearchUserId] = useState("");
  const [loading, setLoading] = useState(false);
  const guildId = localStorage.getItem("guildId");

  useEffect(() => {
    if (guildId) {
      fetchConfig();
      fetchWarnings();
      fetchModLogs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guildId]);

  const fetchConfig = async () => {
    try {
      const res = await axios.get(`${API}/guilds/${guildId}`);
      setConfig(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchWarnings = async () => {
    try {
      const res = await axios.get(`${API}/guilds/${guildId}/warnings`);
      setWarnings(res.data.warnings);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchModLogs = async () => {
    try {
      const res = await axios.get(`${API}/guilds/${guildId}/modlogs`);
      setModLogs(res.data.logs);
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
      await axios.put(`${API}/guilds/${guildId}`, {
        mod_log_channel: config.mod_log_channel,
        warn_threshold: config.warn_threshold,
        warn_action: config.warn_action,
      });
      toast.success("Einstellungen gespeichert!");
    } catch (e) {
      toast.error("Fehler beim Speichern");
    }
    setLoading(false);
  };

  const clearUserWarnings = async (userId) => {
    try {
      await axios.delete(`${API}/guilds/${guildId}/warnings/${userId}`);
      toast.success("Verwarnungen gelöscht");
      fetchWarnings();
    } catch (e) {
      toast.error("Fehler beim Löschen");
    }
  };

  const filteredWarnings = searchUserId
    ? warnings.filter((w) => w.user_id.includes(searchUserId))
    : warnings;

  // Group warnings by user
  const warningsByUser = filteredWarnings.reduce((acc, warn) => {
    if (!acc[warn.user_id]) {
      acc[warn.user_id] = [];
    }
    acc[warn.user_id].push(warn);
    return acc;
  }, {});

  if (!guildId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">Bitte wähle zuerst einen Server im Dashboard aus</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Settings */}
      <Card className="bg-[#2B2D31] border-[#1E1F22]">
        <CardHeader>
          <CardTitle className="text-white font-[Outfit] flex items-center gap-2">
            <Shield className="h-5 w-5 text-[#5865F2]" />
            Moderations-Einstellungen
          </CardTitle>
          <CardDescription className="text-gray-400">
            Konfiguriere automatische Aktionen bei Verwarnungen
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-gray-300">Mod-Log Kanal ID</Label>
              <Input
                placeholder="Channel ID"
                value={config.mod_log_channel || ""}
                onChange={(e) => setConfig({ ...config, mod_log_channel: e.target.value })}
                className="bg-[#1E1F22] border-none text-white font-mono"
                data-testid="mod-log-channel-input"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Warn Schwelle</Label>
              <Input
                type="number"
                min={1}
                max={10}
                value={config.warn_threshold || 3}
                onChange={(e) =>
                  setConfig({ ...config, warn_threshold: parseInt(e.target.value) })
                }
                className="bg-[#1E1F22] border-none text-white"
                data-testid="warn-threshold-input"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Aktion bei Schwelle</Label>
              <Select
                value={config.warn_action || "mute"}
                onValueChange={(value) => setConfig({ ...config, warn_action: value })}
              >
                <SelectTrigger
                  className="bg-[#1E1F22] border-none text-white"
                  data-testid="warn-action-select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1E1F22] border-[#404249]">
                  <SelectItem value="mute" className="text-white hover:bg-[#404249]">
                    🔇 Stummschalten
                  </SelectItem>
                  <SelectItem value="kick" className="text-white hover:bg-[#404249]">
                    👢 Kicken
                  </SelectItem>
                  <SelectItem value="ban" className="text-white hover:bg-[#404249]">
                    🔨 Bannen
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button
            onClick={saveConfig}
            disabled={loading}
            className="bg-[#5865F2] hover:bg-[#4752C4] text-white btn-press"
            data-testid="save-mod-settings-btn"
          >
            <Save className="h-4 w-4 mr-2" />
            Speichern
          </Button>
        </CardContent>
      </Card>

      {/* Warnings */}
      <Card className="bg-[#2B2D31] border-[#1E1F22]">
        <CardHeader>
          <CardTitle className="text-white font-[Outfit] flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-[#F0B232]" />
            Verwarnungen
          </CardTitle>
          <CardDescription className="text-gray-400">
            Übersicht aller Verwarnungen auf dem Server
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="User ID suchen..."
                value={searchUserId}
                onChange={(e) => setSearchUserId(e.target.value)}
                className="bg-[#1E1F22] border-none text-white pl-10 font-mono"
                data-testid="search-warnings-input"
              />
            </div>
          </div>

          {Object.keys(warningsByUser).length > 0 ? (
            <div className="space-y-4">
              {Object.entries(warningsByUser).map(([userId, userWarnings]) => (
                <div key={userId} className="p-4 rounded-lg bg-[#1E1F22]">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-white font-mono text-sm">{userId}</p>
                      <p className="text-gray-400 text-xs">
                        {userWarnings.length} Verwarnung(en)
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => clearUserWarnings(userId)}
                      className="text-[#DA373C] hover:text-white hover:bg-[#DA373C]"
                      data-testid={`clear-warnings-${userId}`}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Löschen
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {userWarnings.map((warn, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 text-sm p-2 rounded bg-[#2B2D31]"
                      >
                        <span className="text-[#F0B232]">#{idx + 1}</span>
                        <span className="text-gray-300 flex-1">{warn.reason}</span>
                        <span className="text-gray-500 font-mono text-xs">
                          {warn.timestamp?.slice(0, 10)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">Keine Verwarnungen gefunden</p>
          )}
        </CardContent>
      </Card>

      {/* Mod Logs */}
      <Card className="bg-[#2B2D31] border-[#1E1F22]">
        <CardHeader>
          <CardTitle className="text-white font-[Outfit]">Moderations-Log</CardTitle>
        </CardHeader>
        <CardContent>
          {modLogs.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="border-[#404249] hover:bg-transparent">
                  <TableHead className="text-gray-400">Aktion</TableHead>
                  <TableHead className="text-gray-400">Ziel</TableHead>
                  <TableHead className="text-gray-400">Moderator</TableHead>
                  <TableHead className="text-gray-400">Grund</TableHead>
                  <TableHead className="text-gray-400">Datum</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {modLogs.slice(0, 20).map((log) => (
                  <TableRow key={log.id} className="border-[#404249]">
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          log.action === "ban"
                            ? "bg-[#DA373C]/20 text-[#DA373C]"
                            : log.action === "kick"
                            ? "bg-[#F0B232]/20 text-[#F0B232]"
                            : log.action === "warn"
                            ? "bg-[#EB459E]/20 text-[#EB459E]"
                            : "bg-[#5865F2]/20 text-[#5865F2]"
                        }`}
                      >
                        {log.action.toUpperCase()}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-sm text-white">
                      {log.target_id.slice(0, 8)}...
                    </TableCell>
                    <TableCell className="font-mono text-sm text-gray-400">
                      {log.mod_id.slice(0, 8)}...
                    </TableCell>
                    <TableCell className="text-gray-300 max-w-xs truncate">
                      {log.reason}
                    </TableCell>
                    <TableCell className="text-gray-500 font-mono text-xs">
                      {log.timestamp?.slice(0, 10)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-gray-500 text-center py-8">Keine Logs vorhanden</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
