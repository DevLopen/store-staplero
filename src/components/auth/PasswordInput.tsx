import { forwardRef, useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/LanguageContext";

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">;

/** Pole hasła z ikoną kłódki i przyciskiem pokaż/ukryj (logowanie, rejestracja). */
const PasswordInput = forwardRef<HTMLInputElement, Props>(({ className = "", ...props }, ref) => {
  const [visible, setVisible] = useState(false);
  const { t } = useLanguage();
  return (
    <div className="relative">
      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
      <Input ref={ref} type={visible ? "text" : "password"} className={`pl-10 pr-12 ${className}`} {...props} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute right-0 top-0 h-full w-11 grid place-items-center text-muted-foreground hover:text-foreground rounded-r-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={visible ? t("login.hidePassword") : t("login.showPassword")}
        aria-pressed={visible}
      >
        {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
});
PasswordInput.displayName = "PasswordInput";

export default PasswordInput;
