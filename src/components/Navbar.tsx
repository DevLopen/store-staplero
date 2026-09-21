import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, LogOut, LayoutDashboard } from "lucide-react";
import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useAuth } from "@/context/AuthContext";
import logo from "@/assets/staplero-white-cropped.svg";

interface NavbarProps {
  isLoggedIn?: boolean;
  isAdmin?: boolean;
  onLogout?: () => void;
}

const Navbar = ({ isLoggedIn: propLoggedIn, isAdmin: propAdmin, onLogout: propLogout }: NavbarProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const auth = useAuth();

  // AuthContext is the source of truth; props are a fallback for legacy usage
  const isLoggedIn = auth.isLoggedIn ?? propLoggedIn ?? false;
  const isAdmin    = auth.isAdmin    ?? propAdmin    ?? false;

  const handleLogout = () => {
    auth.logout();
    if (propLogout) propLogout();
    navigate("/");
  };

  return (
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">

            {/* Logo + menu — do lewej */}
            <div className="flex items-center gap-8 lg:gap-10">
            <Link to="/" className="flex items-center">
              <img
                  src={logo}
                  alt="Staplero"
                  className="h-10 w-auto"
              />
            </Link>

              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center gap-5 lg:gap-6">
              <Link
                  to="/"
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                      location.pathname === "/" ? "text-primary" : "text-muted-foreground"
                  }`}
              >
                {t('nav.home')}
              </Link>
              <a href="/#features" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
                {t('nav.benefits')}
              </a>
              <a href="/#pricing" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
                {t('nav.pricing')}
              </a>
              <Link
                  to="/kursy"
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                      location.pathname.startsWith("/kursy") ? "text-primary" : "text-muted-foreground"
                  }`}
              >
                {t('nav.courses')}
              </Link>
              <Link
                  to="/firmenschulung-berlin"
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                      location.pathname === "/firmenschulung-berlin" ? "text-primary" : "text-muted-foreground"
                  }`}
              >
                B2B
              </Link>

              </div>
            </div>

            {/* Język + logowanie — po prawej */}
            <div className="hidden md:flex items-center gap-3">
              <LanguageSwitcher />

              {isLoggedIn ? (
                  <>
                    <Link to="/dashboard">
                      <Button variant="default" size="sm">
                        <LayoutDashboard className="w-4 h-4 mr-2" />
                        {t('nav.myCourse')}
                      </Button>
                    </Link>
                    {isAdmin && (
                        <Link to="/admin">
                          <Button variant="outline" size="sm">
                            {t('nav.admin')}
                          </Button>
                        </Link>
                    )}
                    <Button variant="ghost" size="sm" onClick={handleLogout}>
                      <LogOut className="w-4 h-4 mr-2" />
                      {t('nav.logout')}
                    </Button>
                  </>
              ) : (
                  <>
                    <Link to="/login">
                      <Button variant="ghost" size="sm">
                        {t('nav.login')}
                      </Button>
                    </Link>
                  </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center gap-2">
              <LanguageSwitcher />
              <button className="p-2 text-foreground" onClick={() => setIsOpen(!isOpen)}>
                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isOpen && (
              <div className="md:hidden py-4 border-t border-border">
                <div className="flex flex-col gap-3">
                  <Link to="/" className="text-sm font-medium text-foreground hover:text-primary py-2" onClick={() => setIsOpen(false)}>
                    {t('nav.home')}
                  </Link>
                  <a href="/#features" className="text-sm font-medium text-muted-foreground hover:text-primary py-2" onClick={() => setIsOpen(false)}>
                    {t('nav.benefits')}
                  </a>
                  <a href="/#pricing" className="text-sm font-medium text-muted-foreground hover:text-primary py-2" onClick={() => setIsOpen(false)}>
                    {t('nav.pricing')}
                  </a>
                  <Link to="/kursy" className="text-sm font-medium text-muted-foreground hover:text-primary py-2" onClick={() => setIsOpen(false)}>
                    {t('nav.courses')}
                  </Link>
                  <Link to="/firmenschulung-berlin" className="text-sm font-medium text-muted-foreground hover:text-primary py-2" onClick={() => setIsOpen(false)}>
                    B2B
                  </Link>

                  {isLoggedIn ? (
                      <>
                        <Link to="/dashboard" onClick={() => setIsOpen(false)}>
                          <Button variant="default" className="w-full justify-start">
                            <LayoutDashboard className="w-4 h-4 mr-2" />
                            {t('nav.myCourse')}
                          </Button>
                        </Link>
                        {isAdmin && (
                            <Link to="/admin" onClick={() => setIsOpen(false)}>
                              <Button variant="outline" className="w-full">
                                {t('nav.admin')}
                              </Button>
                            </Link>
                        )}
                        <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
                          <LogOut className="w-4 h-4 mr-2" />
                          {t('nav.logout')}
                        </Button>
                      </>
                  ) : (
                      <>
                        <Link to="/login" onClick={() => setIsOpen(false)}>
                          <Button variant="ghost" className="w-full">
                            {t('nav.login')}
                          </Button>
                        </Link>
                      </>
                  )}
                </div>
              </div>
          )}
        </div>
      </nav>
  );
};

export default Navbar;