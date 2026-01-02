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
import { Newspaper, Plus, Trash2, Calendar, Clock, Send, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function News() {
  const [news, setNews] = useState([]);
  const [config, setConfig] = useState({ news_channel: "" });
  const [newNews, setNewNews] = useState({
    title: "",
    content: "",
    scheduled_for: "",
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const guildId = localStorage.getItem("guildId");

  useEffect(() => {
    if (guildId) {
      fetchNews();
      fetchConfig();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guildId]);

  const fetchNews = async () => {
    try {
      const res = await axios.get(`${API}/guilds/${guildId}/news`);
      setNews(res.data.news);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchConfig = async () => {
    try {
      const res = await axios.get(`${API}/guilds/${guildId}`);
      setConfig({ news_channel: res.data.news_channel || "" });
    } catch (e) {
      console.error(e);
    }
  };

  const saveNewsChannel = async () => {
    if (!guildId) return;
    try {
      await axios.put(`${API}/guilds/${guildId}`, { news_channel: config.news_channel });
      toast.success("News Kanal gespeichert!");
    } catch (e) {
      toast.error("Fehler beim Speichern");
    }
  };

  const createNews = async () => {
    if (!newNews.title || !newNews.content) {
      toast.error("Bitte Titel und Inhalt eingeben");
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${API}/guilds/${guildId}/news`, {
        title: newNews.title,
        content: newNews.content,
        scheduled_for: newNews.scheduled_for || null,
      });
      toast.success(newNews.scheduled_for ? "News geplant!" : "News erstellt!");
      setNewNews({ title: "", content: "", scheduled_for: "" });
      setDialogOpen(false);
      fetchNews();
    } catch (e) {
      toast.error("Fehler beim Erstellen");
    }
    setLoading(false);
  };

  const deleteNews = async (newsId) => {
    try {
      await axios.delete(`${API}/guilds/${guildId}/news/${newsId}`);
      toast.success("News gelöscht!");
      fetchNews();
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
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white font-[Outfit]">News & Ankündigungen</h2>
          <p className="text-gray-400">Erstelle und plane Ankündigungen für deinen Server</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="bg-[#5865F2] hover:bg-[#4752C4] text-white btn-press"
              data-testid="create-news-btn"
            >
              <Plus className="h-4 w-4 mr-2" />
              Neue News
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#2B2D31] border-[#1E1F22] max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-white font-[Outfit]">Neue News erstellen</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-gray-300">Titel</Label>
                <Input
                  placeholder="Wichtige Ankündigung"
                  value={newNews.title}
                  onChange={(e) => setNewNews({ ...newNews, title: e.target.value })}
                  className="bg-[#1E1F22] border-none text-white"
                  data-testid="news-title-input"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Inhalt</Label>
                <Textarea
                  placeholder="Hier ist der Inhalt deiner News..."
                  value={newNews.content}
                  onChange={(e) => setNewNews({ ...newNews, content: e.target.value })}
                  className="bg-[#1E1F22] border-none text-white min-h-32"
                  data-testid="news-content-input"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Geplante Veröffentlichung (optional)
                </Label>
                <Input
                  type="datetime-local"
                  value={newNews.scheduled_for}
                  onChange={(e) => setNewNews({ ...newNews, scheduled_for: e.target.value })}
                  className="bg-[#1E1F22] border-none text-white"
                  data-testid="news-schedule-input"
                />
                <p className="text-xs text-gray-500">
                  Leer lassen für sofortige Speicherung (manuelles Posten)
                </p>
              </div>
              <Button
                onClick={createNews}
                disabled={loading}
                className="bg-[#23A559] hover:bg-[#1E8E4A] text-white btn-press w-full"
                data-testid="save-news-btn"
              >
                <Send className="h-4 w-4 mr-2" />
                {newNews.scheduled_for ? "News planen" : "News erstellen"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* News Channel Config */}
      <Card className="bg-[#2B2D31] border-[#1E1F22]">
        <CardHeader>
          <CardTitle className="text-white font-[Outfit] flex items-center gap-2">
            <Newspaper className="h-5 w-5 text-[#5865F2]" />
            News Kanal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input
              placeholder="Kanal ID für News"
              value={config.news_channel}
              onChange={(e) => setConfig({ ...config, news_channel: e.target.value })}
              className="bg-[#1E1F22] border-none text-white font-mono"
              data-testid="news-channel-input"
            />
            <Button
              onClick={saveNewsChannel}
              className="bg-[#5865F2] hover:bg-[#4752C4] text-white btn-press"
              data-testid="save-news-channel-btn"
            >
              Speichern
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Geplante News werden automatisch in diesem Kanal gepostet
          </p>
        </CardContent>
      </Card>

      {/* News List */}
      {news.length > 0 ? (
        <div className="space-y-4">
          {news.map((item) => (
            <Card key={item.id} className="bg-[#2B2D31] border-[#1E1F22] card-hover">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      {item.posted ? (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#23A559]/20 text-[#23A559] text-xs">
                          <CheckCircle className="h-3 w-3" />
                          Gepostet
                        </span>
                      ) : item.scheduled_for ? (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#F0B232]/20 text-[#F0B232] text-xs">
                          <Calendar className="h-3 w-3" />
                          Geplant
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-600/20 text-gray-400 text-xs">
                          Entwurf
                        </span>
                      )}
                    </div>
                    <h3 className="text-white font-bold text-lg mb-2">{item.title}</h3>
                    <p className="text-gray-300 text-sm whitespace-pre-wrap line-clamp-3">
                      {item.content}
                    </p>
                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                      <span>Erstellt: {item.created_at?.slice(0, 10)}</span>
                      {item.scheduled_for && (
                        <span className="text-[#F0B232]">
                          Geplant: {new Date(item.scheduled_for).toLocaleString("de-DE")}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteNews(item.id)}
                    className="text-gray-400 hover:text-[#DA373C] shrink-0"
                    data-testid={`delete-news-${item.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="bg-[#2B2D31] border-[#1E1F22]">
          <CardContent className="py-12">
            <div className="text-center">
              <Newspaper className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">Noch keine News erstellt</p>
              <p className="text-gray-500 text-sm">
                Erstelle deine erste Ankündigung mit dem Button oben
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
