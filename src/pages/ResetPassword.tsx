import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Seo from "@/components/Seo";
import { Lock, ShieldCheck, ShieldAlert, CheckCircle2 } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const MIN_PASSWORD_LENGTH = 6;

type Status = "checking" | "invalid" | "form" | "done";

const ResetPassword = () => {
  const { token = "" } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [status, setStatus] = useState<Status>("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Beim Öffnen prüfen, ob der Link noch gültig ist
  useEffect(() => {
    let cancelled = false;
    fetch(`${API_URL}/auth/reset-password/${encodeURIComponent(token)}`)
      .then((res) => { if (!cancelled) setStatus(res.ok ? "form" : "invalid"); })
      .catch(() => { if (!cancelled) setStatus("invalid"); });
    return () => { cancelled = true; };
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < MIN_PASSWORD_LENGTH) {
      toast({ title: "Fehler", description: `Das Passwort muss mindestens ${MIN_PASSWORD_LENGTH} Zeichen lang sein.`, variant: "destructive" });
      return;
    }
    if (password !== confirm) {
      toast({ title: "Fehler", description: "Die Passwörter stimmen nicht überein.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        // Link inzwischen abgelaufen oder bereits benutzt
        if (res.status === 400 && /link/i.test(data.message || "")) {
          setStatus("invalid");
        } else {
          toast({ title: "Fehler", description: data.message || "Das Passwort konnte nicht geändert werden.", variant: "destructive" });
        }
      } else {
        setStatus("done");
        setTimeout(() => navigate("/login"), 3500);
      }
    } catch {
      toast({ title: "Fehler", description: "Server nicht erreichbar", variant: "destructive" });
    }
    setIsLoading(false);
  };

  const header = {
    checking: { icon: <Lock className="w-8 h-8" />, title: "Link wird geprüft", desc: "Einen Moment bitte..." },
    invalid: { icon: <ShieldAlert className="w-8 h-8" />, title: "Link ungültig", desc: "Dieser Link ist abgelaufen oder wurde bereits verwendet." },
    form: { icon: <ShieldCheck className="w-8 h-8" />, title: "Neues Passwort", desc: "Legen Sie ein neues Passwort für Ihr Konto fest." },
    done: { icon: <CheckCircle2 className="w-8 h-8" />, title: "Passwort geändert", desc: "Sie können sich jetzt mit Ihrem neuen Passwort anmelden." },
  }[status];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Seo
        title="Neues Passwort festlegen | STAPLERO"
        description="Legen Sie ein neues Passwort für Ihr STAPLERO Konto fest."
        url="https://staplero.de/reset-password"
      />
      <Navbar />

      <main className="flex-1 flex items-center justify-center py-24 px-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center">
            <div className={`w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-lg ${status === "invalid" ? "bg-destructive text-destructive-foreground" : "bg-primary text-[hsl(var(--on-primary))]"}`}>
              {header.icon}
            </div>
            <CardTitle className="font-display text-3xl">{header.title}</CardTitle>
            <CardDescription>{header.desc}</CardDescription>
          </CardHeader>
          <CardContent>
            {status === "form" && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Neues Passwort</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      autoComplete="new-password"
                      placeholder={`Mindestens ${MIN_PASSWORD_LENGTH} Zeichen`}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      minLength={MIN_PASSWORD_LENGTH}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm">Passwort wiederholen</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="confirm"
                      type="password"
                      autoComplete="new-password"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                  {isLoading ? "Wird gespeichert..." : "Passwort speichern"}
                </Button>
              </form>
            )}

            {status === "invalid" && (
              <div className="space-y-3">
                <Link to="/forgot-password">
                  <Button className="w-full" size="lg">Neuen Link anfordern</Button>
                </Link>
              </div>
            )}

            {status === "done" && (
              <Link to="/login">
                <Button className="w-full" size="lg">Zur Anmeldung</Button>
              </Link>
            )}

            {status !== "done" && (
              <div className="mt-6 text-center text-sm">
                <Link to="/login" className="text-primary hover:underline font-medium">Zurück zur Anmeldung</Link>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default ResetPassword;
