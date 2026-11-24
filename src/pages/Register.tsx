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
import { Mail, User, UserPlus, Check, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";

const MIN_PASSWORD = 6; // jak w backendzie (authController.register)
const MAX_NAME = 50;    // na pole, jak w backendzie
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Field = "firstName" | "lastName" | "email" | "password";
// kod błędu z backendu → tekst i pole, na które przenosimy fokus
const ERRORS: Record<string, { key: string; field?: Field }> = {
  MISSING_FIELDS: { key: "register.errMissing" },
  NAME_TOO_LONG: { key: "register.errName" },
  INVALID_EMAIL: { key: "register.errEmail", field: "email" },
  PASSWORD_LENGTH: { key: "register.errPassword", field: "password" },
  REGISTER_NOT_POSSIBLE: { key: "register.errExists", field: "email" },
  RATE_LIMITED: { key: "register.errRate" },
  NETWORK: { key: "register.errServer" },
  SERVER_ERROR: { key: "register.errServer" },
};

const inputCls = "h-11 pl-10";

const Register = () => {
  // Vorname + Nachname zawsze osobno (jeden standard w całym systemie, jak w Checkout)
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<{ code: string; field?: Field } | null>(null);
  const refs = { firstName: useRef<HTMLInputElement>(null), lastName: useRef<HTMLInputElement>(null), email: useRef<HTMLInputElement>(null), password: useRef<HTMLInputElement>(null) };
  const { register } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();

  const passwordOk = password.length >= MIN_PASSWORD;

  const fail = (code: string) => {
    const e = ERRORS[code] || ERRORS.SERVER_ERROR;
    const field = e.field ?? (code === "NAME_TOO_LONG"
      ? (firstName.trim().length > MAX_NAME ? "firstName" : "lastName")
      : !firstName.trim() ? "firstName" : !lastName.trim() ? "lastName" : !email.trim() ? "email" : !password ? "password" : undefined);
    setError({ code: ERRORS[code] ? code : "SERVER_ERROR", field });
    if (field) refs[field].current?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password) return fail("MISSING_FIELDS");
    if (firstName.trim().length > MAX_NAME || lastName.trim().length > MAX_NAME) return fail("NAME_TOO_LONG");
    if (!EMAIL_RE.test(email.trim())) return fail("INVALID_EMAIL");
    if (!passwordOk) return fail("PASSWORD_LENGTH");

    setSubmitting(true);
    try {
      await register(firstName.trim(), lastName.trim(), email.trim(), password, language);
      toast({ title: t("register.successTitle"), description: t("register.successDesc") });
      navigate("/dashboard");
    } catch (err: any) {
      fail(err?.code || "SERVER_ERROR");
      setSubmitting(false);
    }
  };

  const invalid = (f: Field) => (error?.field === f ? { "aria-invalid": true, "aria-describedby": "register-error" } : {});

  // „Es gelten unsere {terms} und unsere {privacy}.” → tekst z dwoma linkami
  const legal = t("register.legal").split(/(\{terms\}|\{privacy\})/).map((part, i) =>
    part === "{terms}" ? <Link key={i} to="/agb" target="_blank" className="underline underline-offset-2 hover:text-foreground">{t("register.terms")}</Link>
      : part === "{privacy}" ? <Link key={i} to="/datenschutz" target="_blank" className="underline underline-offset-2 hover:text-foreground">{t("register.privacy")}</Link>
        : part);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center pt-24 pb-16 md:py-24 px-4">
        <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8 md:gap-12 items-center">
          {/* Co daje konto (desktop) */}
          <div className="hidden md:flex flex-col justify-center">
            <h2 className="font-display text-3xl font-bold text-foreground mb-6">{t("register.sideTitle")}</h2>
            <ul className="space-y-4">
              {["benefit1", "benefit2", "benefit3", "benefit4"].map((k) => (
                <li key={k} className="flex items-start gap-3">
                  <span className="mt-0.5 w-6 h-6 rounded-full bg-success flex items-center justify-center shrink-0" aria-hidden="true">
                    <Check className="w-4 h-4 text-success-foreground" />
                  </span>
                  <span className="text-foreground">{t(`register.${k}`)}</span>
                </li>
              ))}
            </ul>
          </div>

          <Card className="border-0 shadow-none sm:border sm:shadow-xl">
            <CardHeader className="text-center px-0 pt-2 sm:px-6 sm:pt-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center" aria-hidden="true">
                <UserPlus className="w-8 h-8 text-primary-foreground" />
              </div>
              <CardTitle className="font-display text-2xl">{t("register.title")}</CardTitle>
              <CardDescription>{t("register.subtitle")}</CardDescription>
            </CardHeader>
            <CardContent className="px-0 sm:px-6">
              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">{t("register.firstName")}</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
                      <Input id="firstName" ref={refs.firstName} name="firstName" autoComplete="given-name" maxLength={MAX_NAME} value={firstName}
                        onChange={(e) => setFirstName(e.target.value)} className={inputCls} placeholder={t("register.firstNamePlaceholder")} {...invalid("firstName")} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">{t("register.lastName")}</Label>
                    <Input id="lastName" ref={refs.lastName} name="lastName" autoComplete="family-name" maxLength={MAX_NAME} value={lastName}
                      onChange={(e) => setLastName(e.target.value)} className="h-11" placeholder={t("register.lastNamePlaceholder")} {...invalid("lastName")} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">{t("register.email")}</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
                    <Input id="email" ref={refs.email} name="email" type="email" inputMode="email" autoComplete="email" autoCapitalize="none" spellCheck={false}
                      value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} placeholder={t("register.emailPlaceholder")} {...invalid("email")} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">{t("register.password")}</Label>
                  <PasswordInput id="password" ref={refs.password} name="password" autoComplete="new-password" minLength={MIN_PASSWORD} maxLength={128}
                    value={password} onChange={(e) => setPassword(e.target.value)} className="h-11"
                    aria-describedby={error?.field === "password" ? "register-error password-hint" : "password-hint"} aria-invalid={error?.field === "password" || undefined} />
                  <p id="password-hint" className={`flex items-center gap-1.5 text-sm ${passwordOk ? "text-success" : "text-muted-foreground"}`}>
                    <Check className={`w-4 h-4 ${passwordOk ? "opacity-100" : "opacity-40"}`} aria-hidden="true" />
                    {t("register.passwordHint")}
                  </p>
                </div>

                {error && (
                  <div id="register-error" role="alert" className="rounded-md border border-destructive/40 bg-destructive/5 px-3.5 py-3 text-sm text-destructive">
                    <p>{t(ERRORS[error.code].key)}</p>
                    {error.code === "REGISTER_NOT_POSSIBLE" && (
                      <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-medium">
                        <Link to="/login" className="underline underline-offset-2">{t("register.loginLink")}</Link>
                        <Link to="/forgot-password" className="underline underline-offset-2">{t("register.resetLink")}</Link>
                      </p>
                    )}
                  </div>
                )}

                <Button type="submit" variant="hero" className="w-full" size="lg" disabled={submitting} aria-busy={submitting}>
                  {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />{t("register.loading")}</> : t("register.submit")}
                </Button>
                <p className="text-xs text-center text-muted-foreground">{legal}</p>
              </form>
              <div className="mt-6 text-center text-sm text-muted-foreground">
                {t("register.hasAccount")}{" "}
                <Link to="/login" className="text-primary hover:underline font-medium">{t("register.loginLink")}</Link>
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
