import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Play, Shield, Clock, Award, ChevronRight, Check, BookOpen, Users, Zap } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import heroImage from "@/assets/hero-forklift.jpg";
import warehouseImage from "@/assets/warehouse-interior.jpg";
import controlsImage from "@/assets/forklift-controls.jpg";
import trainingImage from "@/assets/training-room.jpg";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative pt-16 min-h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt="Gabelstaplerfahrer im Lager"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-industrial/95 via-industrial/80 to-transparent" />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-primary/20 text-primary px-4 py-2 rounded-full mb-6 animate-fade-in">
              <Shield className="w-4 h-4" />
              <span className="text-sm font-medium">Anerkannte Theorie-Ausbildung</span>
            </div>
            
            <h1 className="font-display text-4xl md:text-6xl font-bold text-primary-foreground mb-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
              Staplerschein
              <span className="text-gradient block">Online lernen</span>
            </h1>
            
            <p className="text-lg text-primary-foreground/80 mb-8 animate-fade-in" style={{ animationDelay: "0.2s" }}>
              Bereiten Sie sich flexibel und effektiv auf Ihre Gabelstapler-Prüfung vor. 
              Unser umfassender Online-Kurs vermittelt Ihnen alle theoretischen Grundlagen 
              für den sicheren Umgang mit Flurförderzeugen.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 animate-fade-in" style={{ animationDelay: "0.3s" }}>
              <Link to="/register">
                <Button variant="hero" size="xl">
                  <Play className="w-5 h-5" />
                  Jetzt starten
                </Button>
              </Link>
              <a href="#features">
                <Button variant="outline" size="xl" className="border-primary-foreground/30 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20">
                  Mehr erfahren
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </a>
            </div>
            
            <div className="flex items-center gap-8 mt-12 animate-fade-in" style={{ animationDelay: "0.4s" }}>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                <span className="text-primary-foreground/70 text-sm">Flexibles Lernen</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-primary" />
                <span className="text-primary-foreground/70 text-sm">Zertifiziert</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                <span className="text-primary-foreground/70 text-sm">10.000+ Absolventen</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Warum <span className="text-primary">StaplerscheinPro</span>?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Unser Online-Kurs bietet Ihnen alles, was Sie für die theoretische Prüfung benötigen – 
              modern, flexibel und praxisnah.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group bg-card rounded-2xl p-8 shadow-md card-hover border border-border">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <BookOpen className="w-7 h-7 text-primary-foreground" />
              </div>
              <h3 className="font-display text-xl font-semibold text-foreground mb-3">
                Umfassender Lehrplan
              </h3>
              <p className="text-muted-foreground">
                Alle prüfungsrelevanten Themen strukturiert aufbereitet: Sicherheitsvorschriften, 
                Fahrtechnik, rechtliche Grundlagen und mehr.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group bg-card rounded-2xl p-8 shadow-md card-hover border border-border">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Clock className="w-7 h-7 text-primary-foreground" />
              </div>
              <h3 className="font-display text-xl font-semibold text-foreground mb-3">
                Flexibel lernen
              </h3>
              <p className="text-muted-foreground">
                Lernen Sie wann und wo Sie wollen. Unser Kurs ist auf allen Geräten verfügbar 
                und speichert Ihren Fortschritt automatisch.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group bg-card rounded-2xl p-8 shadow-md card-hover border border-border">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Zap className="w-7 h-7 text-primary-foreground" />
              </div>
              <h3 className="font-display text-xl font-semibold text-foreground mb-3">
                Interaktive Inhalte
              </h3>
              <p className="text-muted-foreground">
                Moderne Lernmaterialien mit Bildern, Videos und interaktiven Elementen 
                für maximalen Lernerfolg.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Course Content Section */}
      <section className="py-24 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-6">
                Was Sie lernen werden
              </h2>
              <p className="text-muted-foreground mb-8">
                Unser Kurs deckt alle theoretischen Aspekte ab, die Sie für den sicheren 
                und rechtmäßigen Betrieb eines Gabelstaplers benötigen.
              </p>
              
              <div className="space-y-4">
                {[
                  "Grundlagen der Gabelstapler und Flurförderzeuge",
                  "Gesetzliche Vorschriften und DGUV-Regeln",
                  "Sicherheitsvorschriften und Unfallverhütung",
                  "Technischer Aufbau und Funktionsweise",
                  "Praktische Fahrtechniken und Lasthandhabung",
                  "Wartung und tägliche Kontrollen",
                ].map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 animate-slide-in-left"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0">
                      <Check className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <span className="text-foreground">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <img
                src={warehouseImage}
                alt="Modernes Lager"
                className="rounded-2xl shadow-lg w-full h-48 object-cover"
              />
              <img
                src={controlsImage}
                alt="Stapler Bedienelemente"
                className="rounded-2xl shadow-lg w-full h-48 object-cover mt-8"
              />
              <img
                src={trainingImage}
                alt="Schulungsraum"
                className="rounded-2xl shadow-lg w-full h-48 object-cover col-span-2"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Einfache, transparente Preise
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Voller Zugriff auf alle Kursinhalte für einen fairen Preis.
            </p>
          </div>

          <div className="max-w-lg mx-auto">
            <div className="relative bg-card rounded-3xl p-8 shadow-xl border-2 border-primary overflow-hidden">
              <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-4 py-1 rounded-bl-xl text-sm font-medium">
                Beliebt
              </div>
              
              <div className="text-center mb-8">
                <h3 className="font-display text-2xl font-bold text-foreground mb-2">
                  Monatlicher Zugang
                </h3>
                <p className="text-muted-foreground mb-6">
                  Vollständiger Kurszugang für 30 Tage
                </p>
                <div className="flex items-baseline justify-center gap-2">
                  <span className="font-display text-5xl font-bold text-foreground">€49</span>
                  <span className="text-muted-foreground">/Monat</span>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                {[
                  "Alle Kapitel und Lektionen",
                  "Unbegrenzter Zugang für 30 Tage",
                  "Fortschrittsverfolgung",
                  "Mobile-optimierte Inhalte",
                  "Prüfungsvorbereitung",
                  "Zertifikat nach Abschluss",
                ].map((feature, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-success flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 text-success-foreground" />
                    </div>
                    <span className="text-foreground text-sm">{feature}</span>
                  </div>
                ))}
              </div>

              <Link to="/register" className="block">
                <Button variant="hero" size="xl" className="w-full">
                  Jetzt Zugang kaufen
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-hero">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-primary-foreground mb-6">
            Bereit für Ihren Staplerschein?
          </h2>
          <p className="text-primary-foreground/80 max-w-2xl mx-auto mb-8">
            Starten Sie noch heute und bereiten Sie sich optimal auf Ihre Prüfung vor.
            Tausende Fahrer haben bereits mit uns gelernt.
          </p>
          <Link to="/register">
            <Button variant="hero" size="xl">
              Jetzt registrieren
              <ChevronRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
