import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Seo from "@/components/Seo";
import { Mail, KeyRound, MailCheck, ArrowLeft } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast({
          title: "Fehler",
          description: data.message || "Die Anfrage konnte nicht gesendet werden.",
          variant: "destructive",
        });
      } else {
        // Der Server antwortet immer gleich, egal ob das Konto existiert.
        setSent(true);
      }
    } catch {
      toast({ title: "Fehler", description: "Server nicht erreichbar", variant: "destructive" });
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Seo
        title="Passwort vergessen | STAPLERO"
        description="Setzen Sie Ihr STAPLERO Passwort zurück. Wir senden Ihnen einen Link per E-Mail."
        url="https://staplero.de/forgot-password"
      />
      <Navbar />

      <main className="flex-1 flex items-center justify-center py-24 px-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center bg-primary text-[hsl(var(--on-primary))] rounded-lg">
              {sent ? <MailCheck className="w-8 h-8" /> : <KeyRound className="w-8 h-8" />}
            </div>
            <CardTitle className="font-display text-3xl">{sent ? "E-Mail gesendet" : "Passwort vergessen?"}</CardTitle>
            <CardDescription>
              {sent
                ? "Wenn ein Konto mit dieser E-Mail-Adresse existiert, haben wir Ihnen einen Link zum Zurücksetzen gesendet."
                : "Geben Sie Ihre E-Mail-Adresse ein. Wir senden Ihnen einen Link, mit dem Sie ein neues Passwort festlegen können."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sent ? (
              <div className="space-y-4 text-sm text-muted-foreground">
                <p>
                  Bitte prüfen Sie Ihr Postfach (auch den Spam-Ordner). Der Link ist <strong className="text-foreground">1 Stunde</strong> gültig.
                </p>
                <Button variant="outline" className="w-full" onClick={() => { setSent(false); setEmail(""); }}>
                  Andere E-Mail-Adresse eingeben
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-Mail</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      placeholder="ihre@email.de"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                  {isLoading ? "Wird gesendet..." : "Link anfordern"}
                </Button>
              </form>
            )}

            <div className="mt-6 text-center text-sm">
              <Link to="/login" className="inline-flex items-center gap-1.5 text-primary hover:underline font-medium">
                <ArrowLeft className="w-4 h-4" /> Zurück zur Anmeldung
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default ForgotPassword;
