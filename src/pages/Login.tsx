import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PasswordInput from "@/components/auth/PasswordInput";
import { Mail, LogIn, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// kod błędu z backendu → tekst w języku strony
const ERRORS: Record<string, string> = {
  MISSING_FIELDS: "login.errMissing",
  LOGIN_FAILED: "login.errFailed",
  RATE_LIMITED: "login.errRate",
  NETWORK: "login.serverError",
};

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login } = useAuth();
  const { t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setError(null);
    if (!email.trim() || !password) {
      setError(ERRORS.MISSING_FIELDS);
      (email.trim() ? passwordRef : emailRef).current?.focus();
      return;
    }
    setIsLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const code = data.code || (res.status === 429 ? "RATE_LIMITED" : "");
        setError(ERRORS[code] || "login.errFailed");
        setIsLoading(false);
        passwordRef.current?.focus();
        return; // bez tego login() dalej byłby wywołany
      }

      login(data.user, data.token);
      toast({ title: t("login.successTitle"), description: t("login.successDesc") });
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      setError(ERRORS.NETWORK);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 flex items-center justify-center pt-24 pb-16 md:py-24 px-4">
        <Card className="w-full max-w-md border-0 shadow-none sm:border sm:shadow-xl">
          <CardHeader className="text-center px-0 pt-2 sm:px-6 sm:pt-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center" aria-hidden="true">
              <LogIn className="w-8 h-8 text-primary-foreground" />
            </div>
            <CardTitle className="font-display text-2xl">{t("login.title")}</CardTitle>
            <CardDescription>{t("login.subtitle")}</CardDescription>
          </CardHeader>
          <CardContent className="px-0 sm:px-6">
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div className="space-y-2">
                <Label htmlFor="email">{t("login.email")}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
                  <Input
                    id="email"
                    ref={emailRef}
                    name="email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    autoCapitalize="none"
                    spellCheck={false}
                    placeholder={t("login.emailPlaceholder")}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11 pl-10"
                    aria-invalid={!!error || undefined}
                    aria-describedby={error ? "login-error" : undefined}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="password">{t("login.password")}</Label>
                  <Link to="/forgot-password" className="text-sm text-primary hover:underline font-medium">
                    {t("login.forgot")}
                  </Link>
                </div>
                <PasswordInput
                  id="password"
                  ref={passwordRef}
                  name="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11"
                  aria-invalid={!!error || undefined}
                  aria-describedby={error ? "login-error" : undefined}
                />
              </div>

              {error && (
                <div id="login-error" role="alert" className="rounded-md border border-destructive/40 bg-destructive/5 px-3.5 py-3 text-sm text-destructive">
                  {t(error)}
                </div>
              )}

              <Button type="submit" className="w-full" size="lg" disabled={isLoading} aria-busy={isLoading}>
                {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />{t("login.loading")}</> : t("login.submit")}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              {t("login.noAccount")}{" "}
              <Link to="/register" className="text-primary hover:underline font-medium">
                {t("login.register")}
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
