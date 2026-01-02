import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Key, Plus, Trash2, Save, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const COMMANDS = [
  { name: "warn", description: "Benutzer verwarnen" },
  { name: "kick", description: "Benutzer kicken" },
  { name: "ban", description: "Benutzer bannen" },
  { name: "mute", description: "Benutzer stummschalten" },
  { name: "clearwarnings", description: "Verwarnungen löschen" },
];

export default function Permissions() {
  const [config, setConfig] = useState({
    admin_roles: [],
    mod_roles: [],
    command_permissions: {},
  });
  const [newAdminRole, setNewAdminRole] = useState("");
  const [newModRole, setNewModRole] = useState("");
  const [loading, setLoading] = useState(false);
  const guildId = localStorage.getItem("guildId");

  useEffect(() => {
    if (guildId) {
      fetchPermissions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guildId]);

  const fetchPermissions = async () => {
    try {
      const res = await axios.get(`${API}/guilds/${guildId}/permissions`);
      setConfig(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const savePermissions = async () => {
    if (!guildId) {
      toast.error("Bitte wähle zuerst einen Server");
      return;
    }
    setLoading(true);
    try {
      await axios.put(`${API}/guilds/${guildId}`, {
        admin_roles: config.admin_roles,
        mod_roles: config.mod_roles,
      });
      toast.success("Berechtigungen gespeichert!");
    } catch (e) {
      toast.error("Fehler beim Speichern");
    }
    setLoading(false);
  };

  const addRole = (type) => {
    const roleId = type === "admin" ? newAdminRole : newModRole;
    if (!roleId) return;

    const key = type === "admin" ? "admin_roles" : "mod_roles";
    if (config[key].includes(roleId)) {
      toast.error("Rolle bereits hinzugefügt");
      return;
    }

    setConfig({
      ...config,
      [key]: [...config[key], roleId],
    });

    if (type === "admin") setNewAdminRole("");
    else setNewModRole("");
  };

  const removeRole = (type, roleId) => {
    const key = type === "admin" ? "admin_roles" : "mod_roles";
    setConfig({
      ...config,
      [key]: config[key].filter((id) => id !== roleId),
    });
  };

  const updateCommandPermission = async (command, roleId) => {
    const currentRoles = config.command_permissions[command] || [];
    const newRoles = currentRoles.includes(roleId)
      ? currentRoles.filter((id) => id !== roleId)
      : [...currentRoles, roleId];

    try {
      await axios.put(`${API}/guilds/${guildId}/permissions`, {
        command,
        role_ids: newRoles,
      });

      setConfig({
        ...config,
        command_permissions: {
          ...config.command_permissions,
          [command]: newRoles,
        },
      });

      toast.success("Command Berechtigung aktualisiert");
    } catch (e) {
      toast.error("Fehler beim Aktualisieren");
    }
  };

  if (!guildId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">Bitte wähle zuerst einen Server im Dashboard aus</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Admin Roles */}
      <Card className="bg-[#2B2D31] border-[#1E1F22]">
        <CardHeader>
          <CardTitle className="text-white font-[Outfit] flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-[#EB459E]" />
            Admin Rollen
          </CardTitle>
          <CardDescription className="text-gray-400">
            Rollen mit vollen Bot-Berechtigungen
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Input
              placeholder="Rollen-ID"
              value={newAdminRole}
              onChange={(e) => setNewAdminRole(e.target.value)}
              className="bg-[#1E1F22] border-none text-white font-mono"
              data-testid="admin-role-input"
            />
            <Button
              onClick={() => addRole("admin")}
              className="bg-[#5865F2] hover:bg-[#4752C4] text-white btn-press"
              data-testid="add-admin-role-btn"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {config.admin_roles.map((roleId) => (
              <div
                key={roleId}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#EB459E]/20 text-[#EB459E]"
              >
                <span className="font-mono text-sm">{roleId}</span>
                <button
                  onClick={() => removeRole("admin", roleId)}
                  className="hover:text-white"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
            {config.admin_roles.length === 0 && (
              <p className="text-gray-500 text-sm">Keine Admin Rollen konfiguriert</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Mod Roles */}
      <Card className="bg-[#2B2D31] border-[#1E1F22]">
        <CardHeader>
          <CardTitle className="text-white font-[Outfit] flex items-center gap-2">
            <Key className="h-5 w-5 text-[#5865F2]" />
            Moderator Rollen
          </CardTitle>
          <CardDescription className="text-gray-400">
            Rollen mit Moderations-Berechtigungen
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Input
              placeholder="Rollen-ID"
              value={newModRole}
              onChange={(e) => setNewModRole(e.target.value)}
              className="bg-[#1E1F22] border-none text-white font-mono"
              data-testid="mod-role-input"
            />
            <Button
              onClick={() => addRole("mod")}
              className="bg-[#5865F2] hover:bg-[#4752C4] text-white btn-press"
              data-testid="add-mod-role-btn"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {config.mod_roles.map((roleId) => (
              <div
                key={roleId}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#5865F2]/20 text-[#5865F2]"
              >
                <span className="font-mono text-sm">{roleId}</span>
                <button
                  onClick={() => removeRole("mod", roleId)}
                  className="hover:text-white"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
            {config.mod_roles.length === 0 && (
              <p className="text-gray-500 text-sm">Keine Mod Rollen konfiguriert</p>
            )}
          </div>

          <Button
            onClick={savePermissions}
            disabled={loading}
            className="bg-[#23A559] hover:bg-[#1E8E4A] text-white btn-press w-full mt-4"
            data-testid="save-permissions-btn"
          >
            <Save className="h-4 w-4 mr-2" />
            Rollen speichern
          </Button>
        </CardContent>
      </Card>

      {/* Command Permissions */}
      <Card className="bg-[#2B2D31] border-[#1E1F22]">
        <CardHeader>
          <CardTitle className="text-white font-[Outfit]">Command Berechtigungen</CardTitle>
          <CardDescription className="text-gray-400">
            Welche Rollen welche Commands nutzen dürfen
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {COMMANDS.map((cmd) => (
              <div key={cmd.name} className="p-4 rounded-lg bg-[#1E1F22]">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-white font-medium">/{cmd.name}</p>
                    <p className="text-gray-500 text-sm">{cmd.description}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <p className="text-xs text-gray-400 w-full mb-2">
                    Erlaubte Rollen (klicken zum Togglen):
                  </p>
                  {[...config.admin_roles, ...config.mod_roles].map((roleId) => {
                    const isAllowed = (config.command_permissions[cmd.name] || []).includes(
                      roleId
                    );
                    return (
                      <button
                        key={roleId}
                        onClick={() => updateCommandPermission(cmd.name, roleId)}
                        className={`px-3 py-1 rounded-full text-sm font-mono transition-all ${
                          isAllowed
                            ? "bg-[#23A559]/20 text-[#23A559]"
                            : "bg-gray-700/50 text-gray-500"
                        }`}
                      >
                        {roleId.slice(0, 8)}...
                      </button>
                    );
                  })}
                  {config.admin_roles.length === 0 && config.mod_roles.length === 0 && (
                    <p className="text-gray-500 text-sm">
                      Füge zuerst Admin/Mod Rollen hinzu
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
