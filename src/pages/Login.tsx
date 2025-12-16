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

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate login
    setTimeout(() => {
      if (email && password) {
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("userEmail", email);
        
        // Check if admin
        if (email === "admin@staplerschein.de") {
          localStorage.setItem("isAdmin", "true");
        }
        
        toast({
          title: "Erfolgreich angemeldet",
          description: "Willkommen zurück!",
        });
        navigate("/dashboard");
      } else {
        toast({
          title: "Fehler",
          description: "Bitte füllen Sie alle Felder aus.",
          variant: "destructive",
        });
      }
      setIsLoading(false);
    }, 1000);
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
              <Link to="/register" className="text-primary hover:underline font-medium">
                Jetzt registrieren
              </Link>
            </div>

            <div className="mt-4 p-3 bg-muted rounded-lg text-sm text-muted-foreground">
              <p className="font-medium mb-1">Demo-Zugang:</p>
              <p>Admin: admin@staplerschein.de</p>
              <p>Benutzer: beliebige E-Mail</p>
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default Login;
