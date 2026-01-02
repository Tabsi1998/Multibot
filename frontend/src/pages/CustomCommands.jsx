import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Terminal, Plus, Trash2, Edit, Code } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function CustomCommands() {
  const [commands, setCommands] = useState([]);
  const [config, setConfig] = useState({ prefix: "!" });
  const [newCommand, setNewCommand] = useState({ name: "", response: "" });
  const [editCommand, setEditCommand] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const guildId = localStorage.getItem("guildId");

  useEffect(() => {
    if (guildId) {
      fetchCommands();
      fetchConfig();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guildId]);

  const fetchCommands = async () => {
    try {
      const res = await axios.get(`${API}/guilds/${guildId}/commands`);
      setCommands(res.data.commands);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchConfig = async () => {
    try {
      const res = await axios.get(`${API}/guilds/${guildId}`);
      setConfig({ prefix: res.data.prefix || "!" });
    } catch (e) {
      console.error(e);
    }
  };

  const createCommand = async () => {
    if (!newCommand.name || !newCommand.response) {
      toast.error("Bitte Name und Antwort eingeben");
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${API}/guilds/${guildId}/commands`, newCommand);
      toast.success("Command erstellt!");
      setNewCommand({ name: "", response: "" });
      setDialogOpen(false);
      fetchCommands();
    } catch (e) {
      toast.error("Fehler beim Erstellen");
    }
    setLoading(false);
  };

  const updateCommand = async () => {
    if (!editCommand) return;
    setLoading(true);
    try {
      // Delete old and create new
      await axios.delete(`${API}/guilds/${guildId}/commands/${editCommand.originalName}`);
      await axios.post(`${API}/guilds/${guildId}/commands`, {
        name: editCommand.name,
        response: editCommand.response,
      });
      toast.success("Command aktualisiert!");
      setEditCommand(null);
      fetchCommands();
    } catch (e) {
      toast.error("Fehler beim Aktualisieren");
    }
    setLoading(false);
  };

  const deleteCommand = async (name) => {
    try {
      await axios.delete(`${API}/guilds/${guildId}/commands/${name}`);
      toast.success("Command gelöscht!");
      fetchCommands();
    } catch (e) {
      toast.error("Fehler beim Löschen");
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white font-[Outfit]">Custom Commands</h2>
          <p className="text-gray-400">
            Erstelle eigene Text-Commands mit dem Prefix{" "}
            <code className="bg-[#1E1F22] px-2 py-0.5 rounded font-mono">
              {config.prefix}
            </code>
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="bg-[#5865F2] hover:bg-[#4752C4] text-white btn-press"
              data-testid="create-command-btn"
            >
              <Plus className="h-4 w-4 mr-2" />
              Neuer Command
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#2B2D31] border-[#1E1F22]">
            <DialogHeader>
              <DialogTitle className="text-white font-[Outfit]">
                Neuen Command erstellen
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-gray-300">Command Name</Label>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">{config.prefix}</span>
                  <Input
                    placeholder="hilfe"
                    value={newCommand.name}
                    onChange={(e) =>
                      setNewCommand({ ...newCommand, name: e.target.value.toLowerCase() })
                    }
                    className="bg-[#1E1F22] border-none text-white"
                    data-testid="new-command-name-input"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Antwort</Label>
                <Textarea
                  placeholder="Das ist die Hilfenachricht..."
                  value={newCommand.response}
                  onChange={(e) =>
                    setNewCommand({ ...newCommand, response: e.target.value })
                  }
                  className="bg-[#1E1F22] border-none text-white min-h-32"
                  data-testid="new-command-response-input"
                />
              </div>
              <Button
                onClick={createCommand}
                disabled={loading}
                className="bg-[#23A559] hover:bg-[#1E8E4A] text-white btn-press w-full"
                data-testid="save-new-command-btn"
              >
                Command erstellen
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Commands List */}
      {commands.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {commands.map((cmd) => (
            <Card
              key={cmd.name}
              className="bg-[#2B2D31] border-[#1E1F22] card-hover"
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white font-mono text-lg">
                    {config.prefix}{cmd.name}
                  </CardTitle>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setEditCommand({
                          ...cmd,
                          originalName: cmd.name,
                        })
                      }
                      className="text-gray-400 hover:text-white h-8 w-8"
                      data-testid={`edit-command-${cmd.name}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteCommand(cmd.name)}
                      className="text-gray-400 hover:text-[#DA373C] h-8 w-8"
                      data-testid={`delete-command-${cmd.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 text-sm whitespace-pre-wrap line-clamp-3">
                  {cmd.response}
                </p>
                {cmd.created_at && (
                  <p className="text-xs text-gray-500 mt-3">
                    Erstellt: {cmd.created_at.slice(0, 10)}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="bg-[#2B2D31] border-[#1E1F22]">
          <CardContent className="py-12">
            <div className="text-center">
              <Terminal className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">Noch keine Custom Commands</p>
              <p className="text-gray-500 text-sm">
                Erstelle deinen ersten Command mit dem Button oben
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editCommand} onOpenChange={() => setEditCommand(null)}>
        <DialogContent className="bg-[#2B2D31] border-[#1E1F22]">
          <DialogHeader>
            <DialogTitle className="text-white font-[Outfit]">
              Command bearbeiten
            </DialogTitle>
          </DialogHeader>
          {editCommand && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-gray-300">Command Name</Label>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">{config.prefix}</span>
                  <Input
                    value={editCommand.name}
                    onChange={(e) =>
                      setEditCommand({
                        ...editCommand,
                        name: e.target.value.toLowerCase(),
                      })
                    }
                    className="bg-[#1E1F22] border-none text-white"
                    data-testid="edit-command-name-input"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Antwort</Label>
                <Textarea
                  value={editCommand.response}
                  onChange={(e) =>
                    setEditCommand({
                      ...editCommand,
                      response: e.target.value,
                    })
                  }
                  className="bg-[#1E1F22] border-none text-white min-h-32"
                  data-testid="edit-command-response-input"
                />
              </div>
              <Button
                onClick={updateCommand}
                disabled={loading}
                className="bg-[#23A559] hover:bg-[#1E8E4A] text-white btn-press w-full"
                data-testid="save-edit-command-btn"
              >
                Änderungen speichern
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
