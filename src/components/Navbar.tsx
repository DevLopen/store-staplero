import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, User, LogOut } from "lucide-react";
import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";

interface NavbarProps {
  isLoggedIn?: boolean;
  isAdmin?: boolean;
  onLogout?: () => void;
}

const Navbar = ({ isLoggedIn = false, isAdmin = false, onLogout }: NavbarProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { t } = useLanguage();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xl">S</span>
            </div>
            <span className="font-display font-bold text-xl text-foreground">
              Staplerschein<span className="text-primary">Pro</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              to="/"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                location.pathname === "/" ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {t('nav.home')}
            </Link>
            <a
              href="/#features"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              {t('nav.benefits')}
            </a>
            <a
              href="/#pricing"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              {t('nav.pricing')}
            </a>
            <Link
              to="/practical-course"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                location.pathname === "/practical-course" ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {t('nav.practicalCourse')}
            </Link>
            
            <LanguageSwitcher />
            
            {isLoggedIn ? (
              <>
                <Link to="/dashboard">
                  <Button variant="ghost" size="sm">
                    <User className="w-4 h-4 mr-2" />
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
                <Button variant="ghost" size="sm" onClick={onLogout}>
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
                <Link to="/register">
                  <Button variant="default" size="sm">
                    {t('nav.start')}
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <LanguageSwitcher />
            <button
              className="p-2 text-foreground"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col gap-3">
              <Link
                to="/"
                className="text-sm font-medium text-foreground hover:text-primary py-2"
                onClick={() => setIsOpen(false)}
              >
                {t('nav.home')}
              </Link>
              <a
                href="/#features"
                className="text-sm font-medium text-muted-foreground hover:text-primary py-2"
                onClick={() => setIsOpen(false)}
              >
                {t('nav.benefits')}
              </a>
              <a
                href="/#pricing"
                className="text-sm font-medium text-muted-foreground hover:text-primary py-2"
                onClick={() => setIsOpen(false)}
              >
                {t('nav.pricing')}
              </a>
              <Link
                to="/practical-course"
                className="text-sm font-medium text-muted-foreground hover:text-primary py-2"
                onClick={() => setIsOpen(false)}
              >
                {t('nav.practicalCourse')}
              </Link>
              
              {isLoggedIn ? (
                <>
                  <Link to="/dashboard" onClick={() => setIsOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start">
                      <User className="w-4 h-4 mr-2" />
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
                  <Button variant="ghost" className="w-full justify-start" onClick={onLogout}>
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
                  <Link to="/register" onClick={() => setIsOpen(false)}>
                    <Button variant="default" className="w-full">
                      {t('nav.start')}
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
