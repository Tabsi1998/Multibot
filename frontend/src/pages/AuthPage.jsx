import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Bot, LogIn, UserPlus, Eye, EyeOff, Mail, Lock, User } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AuthPage({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        // Login
        const res = await axios.post(`${API}/auth/login`, {
          email: formData.email,
          password: formData.password,
        });
        
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        toast.success("Erfolgreich angemeldet!");
        onLogin(res.data.user);
      } else {
        // Register
        if (formData.username.length < 3) {
          toast.error("Benutzername muss mindestens 3 Zeichen haben");
          setLoading(false);
          return;
        }
        if (formData.password.length < 6) {
          toast.error("Passwort muss mindestens 6 Zeichen haben");
          setLoading(false);
          return;
        }

        const res = await axios.post(`${API}/auth/register`, formData);
        
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        toast.success(res.data.message);
        onLogin(res.data.user);
      }
    } catch (e) {
      toast.error(e.response?.data?.detail || "Ein Fehler ist aufgetreten");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#313338] flex items-center justify-center p-4 noise-bg">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#5865F2] to-[#EB459E] flex items-center justify-center mx-auto mb-4 glow-primary">
            <Bot className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white font-[Outfit]">MultiBot</h1>
          <p className="text-gray-400 mt-1">Command Center</p>
        </div>

        {/* Auth Card */}
        <Card className="bg-[#2B2D31] border-[#1E1F22] animate-slide-up">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-white font-[Outfit]">
              {isLogin ? "Willkommen zurück!" : "Konto erstellen"}
            </CardTitle>
            <CardDescription className="text-gray-400">
              {isLogin
                ? "Melde dich an, um fortzufahren"
                : "Der erste Benutzer wird automatisch Administrator"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username (Register only) */}
              {!isLogin && (
                <div className="space-y-2">
                  <Label className="text-gray-300">Benutzername</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="DeinName"
                      value={formData.username}
                      onChange={(e) =>
                        setFormData({ ...formData, username: e.target.value })
                      }
                      className="bg-[#1E1F22] border-none text-white pl-10"
                      required={!isLogin}
                      data-testid="username-input"
                    />
                  </div>
                </div>
              )}

              {/* Email */}
              <div className="space-y-2">
                <Label className="text-gray-300">E-Mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="email"
                    placeholder="deine@email.de"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="bg-[#1E1F22] border-none text-white pl-10"
                    required
                    data-testid="email-input"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label className="text-gray-300">Passwort</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="bg-[#1E1F22] border-none text-white pl-10 pr-10"
                    required
                    data-testid="password-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white btn-press"
                data-testid="auth-submit-btn"
              >
                {loading ? (
                  <span className="animate-pulse">Bitte warten...</span>
                ) : isLogin ? (
                  <>
                    <LogIn className="h-4 w-4 mr-2" />
                    Anmelden
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Registrieren
                  </>
                )}
              </Button>
            </form>

            {/* Toggle Login/Register */}
            <div className="mt-6 text-center">
              <p className="text-gray-400 text-sm">
                {isLogin ? "Noch kein Konto?" : "Bereits registriert?"}
              </p>
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-[#5865F2] hover:text-[#7289DA] text-sm font-medium mt-1"
                data-testid="toggle-auth-mode"
              >
                {isLogin ? "Jetzt registrieren" : "Zur Anmeldung"}
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Info */}
        <p className="text-center text-gray-500 text-xs mt-6">
          Der erste registrierte Benutzer erhält automatisch Admin-Rechte.
        </p>
      </div>
    </div>
  );
}
