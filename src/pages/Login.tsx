import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Mail, Lock, LogIn } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { saveUserSession } from "@/utils/auth";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        toast({
          title: "Fehler",
          description: data.message || "Fehler beim Anmelden",
          variant: "destructive"
        });
        setIsLoading(false);
        return; // <--- krytyczne, bez tego login() dalej byłby wywołany
      }

// dopiero teraz wywołujemy login
      login(data.user, data.token);

      toast({
        title: "Erfolgreich angemeldet",
        description: "Willkommen zurück!"
      });

      navigate("/dashboard")
    } catch (err) {
      console.error(err);
      toast({
        title: "Fehler",
        description: "Server nicht erreichbar",
        variant: "destructive"
      });
    }

    setIsLoading(false);
  };

  return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />

        <main className="flex-1 flex items-center justify-center py-24 px-4">
          <Card className="w-full max-w-md shadow-xl">
            <CardHeader className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <LogIn className="w-8 h-8 text-primary-foreground" />
              </div>
              <CardTitle className="font-display text-2xl">Anmelden</CardTitle>
              <CardDescription>
                Melden Sie sich an, um auf Ihren Kurs zuzugreifen
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-Mail</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        id="email"
                        type="email"
                        placeholder="ihre@email.de"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Passwort</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10"
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                  {isLoading ? "Wird angemeldet..." : "Anmelden"}
                </Button>
              </form>

              <div className="mt-6 text-center text-sm text-muted-foreground">
                Noch kein Konto?{" "}
                <Link to="/practical-course" className="text-primary hover:underline font-medium">
                  Jetzt registrieren
                </Link>
              </div>
            </CardContent>
          </Card>
        </main>

        <Footer />
      </div>
  );
};

export default Login;
