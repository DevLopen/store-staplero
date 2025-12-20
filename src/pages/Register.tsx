import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Mail, Lock, User, UserPlus, Check } from "lucide-react";

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (password !== confirmPassword) {
      toast({
        title: "Fehler",
        description: "Die Passwörter stimmen nicht überein.",
        variant: "destructive"
      });
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password })
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("userEmail", data.user.email);
        localStorage.setItem("userName", data.user.name);
        if (data.user.isAdmin) localStorage.setItem("isAdmin", "true");

        toast({
          title: "Registrierung erfolgreich",
          description: "Willkommen bei StaplerscheinPro!"
        });

        navigate("/dashboard");
      } else {
        toast({
          title: "Fehler",
          description: data.message || "Fehler bei der Registrierung",
          variant: "destructive"
        });
      }
    } catch (err) {
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
          <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8">
            {/* Benefits */}
            <div className="hidden md:flex flex-col justify-center">
              <h2 className="font-display text-3xl font-bold text-foreground mb-6">
                Starten Sie Ihre Ausbildung heute
              </h2>
              <div className="space-y-4">
                {[
                  "Vollständiger Zugang zum Theorie-Kurs",
                  "Flexibel lernen – jederzeit, überall",
                  "Fortschritt wird automatisch gespeichert",
                  "Prüfungsvorbereitung inklusive",
                  "30 Tage Zugang für nur €49"
                ].map((benefit, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-success flex items-center justify-center shrink-0">
                        <Check className="w-4 h-4 text-success-foreground" />
                      </div>
                      <span className="text-foreground">{benefit}</span>
                    </div>
                ))}
              </div>
            </div>

            {/* Registration Form */}
            <Card className="shadow-xl">
              <CardHeader className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <UserPlus className="w-8 h-8 text-primary-foreground" />
                </div>
                <CardTitle className="font-display text-2xl">Registrieren</CardTitle>
                <CardDescription>
                  Erstellen Sie Ihr Konto und starten Sie sofort
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                          id="name"
                          type="text"
                          placeholder="Ihr Name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="pl-10"
                      />
                    </div>
                  </div>

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

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Passwort bestätigen</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                          id="confirmPassword"
                          type="password"
                          placeholder="••••••••"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="pl-10"
                      />
                    </div>
                  </div>

                  <Button type="submit" variant="hero" className="w-full" size="lg" disabled={isLoading}>
                    {isLoading ? "Wird registriert..." : "Jetzt für €49 starten"}
                  </Button>
                </form>

                <div className="mt-6 text-center text-sm text-muted-foreground">
                  Bereits ein Konto?{" "}
                  <Link to="/login" className="text-primary hover:underline font-medium">
                    Anmelden
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>

        <Footer />
      </div>
  );
};

export default Register;
