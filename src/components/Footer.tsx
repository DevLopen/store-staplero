import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-industrial text-secondary-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo & Description */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-xl">S</span>
              </div>
              <span className="font-display font-bold text-xl text-primary-foreground">
                Stapler<span className="text-primary">o</span>
              </span>
            </div>
            <p className="text-primary-foreground/70 text-sm max-w-sm">
              Ihre Online-Plattform für die theoretische Ausbildung zum Gabelstaplerfahrer. 
              Lernen Sie flexibel und bereiten Sie sich optimal auf Ihre Prüfung vor.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display font-semibold text-primary-foreground mb-4">
              Schnelllinks
            </h4>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-primary-foreground/70 hover:text-primary text-sm transition-colors">
                  Startseite
                </Link>
              </li>
              <li>
                <a href="/#features" className="text-primary-foreground/70 hover:text-primary text-sm transition-colors">
                  Vorteile
                </a>
              </li>
              <li>
                <a href="/#pricing" className="text-primary-foreground/70 hover:text-primary text-sm transition-colors">
                  Preise
                </a>
              </li>
              <li>
                <Link to="/login" className="text-primary-foreground/70 hover:text-primary text-sm transition-colors">
                  Anmelden
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display font-semibold text-primary-foreground mb-4">
              Kontakt
            </h4>
            <ul className="space-y-2 text-sm text-primary-foreground/70">
              <li>info@staplero.com</li>
              <li>+49 176 22067783</li>
              <li>+49 160 92490070</li>
              <li>Mo-Fr: 9:00 - 17:00 Uhr</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-primary-foreground/10 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-primary-foreground/50 text-sm">
            © 2025 Staplero. Alle Rechte vorbehalten.
          </p>
          <div className="flex gap-6 text-sm">
            <a href="#" className="text-primary-foreground/50 hover:text-primary transition-colors">
              Impressum
            </a>
            <a href="#" className="text-primary-foreground/50 hover:text-primary transition-colors">
              Datenschutz
            </a>
            <a href="#" className="text-primary-foreground/50 hover:text-primary transition-colors">
              AGB
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
