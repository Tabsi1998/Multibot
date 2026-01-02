import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Users, Shield, ShieldOff, Trash2, Crown } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, user: null });
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getAuthHeader = () => {
    const token = localStorage.getItem("token");
    return { Authorization: `Bearer ${token}` };
  };

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${API}/auth/users`, {
        headers: getAuthHeader(),
      });
      setUsers(res.data.users);
    } catch (e) {
      toast.error("Fehler beim Laden der Benutzer");
    }
    setLoading(false);
  };

  const toggleAdmin = async (userId, currentStatus) => {
    try {
      await axios.put(
        `${API}/auth/users/${userId}/admin?is_admin=${!currentStatus}`,
        {},
        { headers: getAuthHeader() }
      );
      toast.success(`Admin-Status geändert`);
      fetchUsers();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Fehler beim Ändern");
    }
  };

  const deleteUser = async () => {
    if (!deleteDialog.user) return;
    try {
      await axios.delete(`${API}/auth/users/${deleteDialog.user.id}`, {
        headers: getAuthHeader(),
      });
      toast.success("Benutzer gelöscht");
      setDeleteDialog({ open: false, user: null });
      fetchUsers();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Fehler beim Löschen");
    }
  };

  if (!currentUser.is_admin) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">Nur Administratoren haben Zugriff auf diese Seite.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Card className="bg-[#2B2D31] border-[#1E1F22]">
        <CardHeader>
          <CardTitle className="text-white font-[Outfit] flex items-center gap-2">
            <Users className="h-5 w-5 text-[#5865F2]" />
            Benutzerverwaltung
          </CardTitle>
          <CardDescription className="text-gray-400">
            Verwalte Dashboard-Benutzer und Admin-Rechte
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-gray-500 text-center py-8">Laden...</p>
          ) : users.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="border-[#404249] hover:bg-transparent">
                  <TableHead className="text-gray-400">Benutzer</TableHead>
                  <TableHead className="text-gray-400">E-Mail</TableHead>
                  <TableHead className="text-gray-400">Status</TableHead>
                  <TableHead className="text-gray-400">Erstellt</TableHead>
                  <TableHead className="text-gray-400 text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id} className="border-[#404249]">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium">{user.username}</span>
                        {user.id === currentUser.id && (
                          <Badge variant="outline" className="text-[#5865F2] border-[#5865F2]">
                            Du
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-300">{user.email}</TableCell>
                    <TableCell>
                      {user.is_admin ? (
                        <Badge className="bg-[#EB459E]/20 text-[#EB459E] hover:bg-[#EB459E]/30">
                          <Crown className="h-3 w-3 mr-1" />
                          Admin
                        </Badge>
                      ) : (
                        <Badge className="bg-gray-600/20 text-gray-400">
                          Benutzer
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-gray-500 font-mono text-sm">
                      {user.created_at?.slice(0, 10)}
                    </TableCell>
                    <TableCell className="text-right">
                      {user.id !== currentUser.id && (
                        <div className="flex gap-1 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleAdmin(user.id, user.is_admin)}
                            className={
                              user.is_admin
                                ? "text-gray-400 hover:text-white"
                                : "text-[#EB459E] hover:text-white hover:bg-[#EB459E]/20"
                            }
                            data-testid={`toggle-admin-${user.id}`}
                          >
                            {user.is_admin ? (
                              <>
                                <ShieldOff className="h-4 w-4 mr-1" />
                                Entfernen
                              </>
                            ) : (
                              <>
                                <Shield className="h-4 w-4 mr-1" />
                                Admin
                              </>
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteDialog({ open: true, user })}
                            className="text-[#DA373C] hover:text-white hover:bg-[#DA373C]"
                            data-testid={`delete-user-${user.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-gray-500 text-center py-8">Keine Benutzer gefunden</p>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
        <DialogContent className="bg-[#2B2D31] border-[#1E1F22]">
          <DialogHeader>
            <DialogTitle className="text-white font-[Outfit]">Benutzer löschen?</DialogTitle>
            <DialogDescription className="text-gray-400">
              Möchtest du <span className="text-white font-medium">{deleteDialog.user?.username}</span> wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 justify-end mt-4">
            <Button
              variant="ghost"
              onClick={() => setDeleteDialog({ open: false, user: null })}
              className="text-gray-400"
            >
              Abbrechen
            </Button>
            <Button
              onClick={deleteUser}
              className="bg-[#DA373C] hover:bg-[#BE3238] text-white"
              data-testid="confirm-delete-user"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Löschen
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
