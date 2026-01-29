import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Link } from "react-router-dom";
import {
  Play,
  Shield,
  Clock,
  Award,
  ChevronRight,
  Check,
  BookOpen,
  Users,
  Zap,
  Star,
  Building2,
  Phone,
  Mail,
  MapPin,
  FileCheck,
  GraduationCap,
  Globe,
  Truck,
  RefreshCcw,
  Send,
  Calendar,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import heroImage from "@/assets/bodzio.png";
import warehouseImage from "@/assets/index-1.jpg";
import controlsImage from "@/assets/forklift-controls.jpg";
import trainingImage from "@/assets/training-room.png";

const Index = () => {
  const { toast } = useToast();
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // FAQ toggle state
  const [faqCustomerType, setFaqCustomerType] = useState('b2b');

    const handleContactSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const response = await fetch(`${process.env.VITE_API_URL || 'http://localhost:3001'}/api/contact`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(contactForm),
            });

            const data = await response.json();

            if (response.ok) {
                toast({
                    title: "Nachricht gesendet!",
                    description: "Wir werden uns in Kürze bei Ihnen melden."
                });
                setContactForm({ name: "", email: "", phone: "", company: "", message: "" });
            } else {
                throw new Error(data.error || 'Failed to send message');
            }
        } catch (error) {
            console.error('Contact form error:', error);
            toast({
                title: "Fehler",
                description: "Nachricht konnte nicht gesendet werden. Bitte versuchen Sie es später erneut.",
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

  const googleReviews = [
    {
      name: "Thomas M.",
      rating: 5,
      text: "Super Ausbildung! Der Online-Kurs war sehr gut strukturiert und die praktische Prüfung in Berlin lief reibungslos. Sehr zu empfehlen!",
      date: "vor 2 Wochen"
    },
    {
      name: "Anna K.",
      rating: 5,
      text: "Schnell und professionell. In nur 2 Tagen hatte ich meinen Staplerschein. Das Team ist sehr freundlich und kompetent.",
      date: "vor 1 Monat"
    },
    {
      name: "Markus B.",
      rating: 5,
      text: "Besonders gut für Berufstätige – ich konnte die Theorie abends lernen. Die Praxisschulung war intensiv aber super erklärt.",
      date: "vor 1 Monat"
    },
    {
      name: "Elena W.",
      rating: 5,
      text: "Ukrainische Übersetzung war sehr hilfreich. Professionelle Ausbildung mit echten Praxisübungen. Danke STAPLERO!",
      date: "vor 2 Monaten"
    }
  ];

  // B2B FAQs
  const b2bFaqs = [
    {
      id: 'b2b-1',
      question: 'Bieten Sie auch Inhouse-Schulungen in unserem Unternehmen an?',
      answer: (
          <>
            Ja, wir führen deutschlandweit Inhouse-Schulungen direkt bei Ihnen vor Ort durch. Die Ausbildung erfolgt nach den aktuellen Vorschriften DGUV Vorschrift 68 und DGUV Grundsatz 308-001.
            <br/><br/>
            Die Schulung besteht aus einem Theorieteil mit schriftlicher Prüfung sowie einem Praxisteil mit Fahrprüfung. Unsere Trainer bringen alle erforderlichen Schulungsunterlagen mit. Voraussetzung ist eine geeignete Fläche für die praktischen Übungen.
          </>
      )
    },
    {
      id: 'b2b-2',
      question: 'Wie hoch sind die Kosten für eine Inhouse-Schulung?',
      answer: (
          <>
            Da jede Schulung individuell geplant wird, bitten wir Sie, uns folgende Informationen mitzuteilen. Auf dieser Basis können wir Ihnen ein maßgeschneidertes Angebot erstellen:
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li>Anzahl der Mitarbeitenden, die geschult werden sollen</li>
              <li>Ort der Schulung (wo soll die Ausbildung stattfinden?)</li>
              <li>Geräteart, die die Teilnehmenden bedienen sollen (z. B. Frontstapler, Schubmaststapler, Elektro-Ameise, Hochhubwagen etc.)</li>
              <li>Vorerfahrung der Teilnehmenden (falls bekannt – haben sie bereits praktische Erfahrung?)</li>
            </ul>
            <br/>
            Für Schulungen in rumänischer Sprache fällt zusätzlich ein Dolmetscherzuschlag von 179,99 € netto pro Tag an.
            <br/><br/>
            Kontaktieren Sie uns gern direkt – wir beraten Sie persönlich.
          </>
      )
    },
    {
      id: 'b2b-3',
      question: 'In welchen Sprachen bieten Sie die Schulung an?',
      answer: (
          <>
            Wir führen die Schulung vollständig in der von Ihnen gewünschten Sprache durch – sowohl Theorie- als auch Praxisteil.
            <br/><br/>
            Folgende Sprachen stehen zur Verfügung:
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li>Deutsch</li>
              <li>Polnisch</li>
              <li>Ukrainisch</li>
              <li>Russisch</li>
              <li>Rumänisch (Dolmetscherzuschlag: 179,99 € netto pro Tag)</li>
            </ul>
            <br/>
            Bitte geben Sie bei der Anmeldung an, in welcher Sprache die Schulung und Prüfung erfolgen soll.
          </>
      )
    },
    {
      id: 'b2b-4',
      question: 'Welche Unterlagen und Ausrüstung müssen die Teilnehmenden mitbringen?',
      answer: (
          <>
            Für die Teilnahme benötigen Ihre Mitarbeitenden:
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li>Gültiger Ausweis (Personalausweis oder Reisepass)</li>
              <li>Passfoto (für den Fahrausweis)</li>
              <li>Sicherheitsschuhe (Pflicht für den praktischen Teil)</li>
            </ul>
          </>
      )
    },
    {
      id: 'b2b-5',
      question: 'Erhalten die Teilnehmenden einen anerkannten Staplerschein?',
      answer: (
          <>
            Ja. Nach erfolgreich bestandener Theorie- und Praxisprüfung erhalten alle Teilnehmenden einen offiziellen deutschen Staplerschein, gültig gemäß DGUV Vorschrift 68 und DGUV Grundsatz 308-001 – bundesweit anerkannt.
            <br/><br/>
            Optional bieten wir die Staplero ProCard an – ein robuster Fahrausweis im Scheckkartenformat (ähnlich einem Führerschein), ideal zum Vorzeigen im Betrieb oder bei Kontrollen. Aufpreis: 14,99 € netto pro Person
          </>
      )
    },
    {
      id: 'b2b-6',
      question: 'Was benötigen wir als Unternehmen, um die Schulung bei uns durchzuführen?',
      answer: (
          <>
            Damit wir die Schulung erfolgreich in Ihrem Unternehmen durchführen können, benötigen wir folgende Voraussetzungen vor Ort:
            <br/><br/>
            <strong>Für den ersten Schulungstag (Theorie):</strong> Einen ruhigen Raum mit Tischen und Stühlen für alle Teilnehmenden. Der Raum sollte ausreichend beleuchtet sein und möglichst über Stromanschluss verfügen.
            <br/><br/>
            <strong>Für den zweiten Schulungstag (Praxis):</strong>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li>Einen geeigneten Übungsbereich (z. B. Lagerfläche, Betriebshof), auf dem sicher und ungestört Fahrübungen durchgeführt werden können</li>
              <li>Einen funktionsfähigen Gabelstapler (entsprechend dem Schulungsbedarf – z. B. Frontstapler, Schubmaststapler, Ameise etc.)</li>
              <li>Einige Europaletten und idealerweise Gitterboxen, um praxisnahe Übungen unter realistischen Bedingungen durchführen zu können</li>
            </ul>
            <br/>
            Sollten Sie unsicher sein, ob Ihre Gegebenheiten ausreichen, sprechen Sie uns gerne an – wir beraten Sie individuell.
          </>
      )
    },
    {
      id: 'b2b-7',
      question: 'Wie lange dauert die Ausbildung?',
      answer: (
          <>
            Die Dauer der Schulung richtet sich nach dem Gerätetyp und den Vorkenntnissen der Teilnehmenden.
            <br/><br/>
            <strong>Standard-Schulung (für Gabelstapler): 2 Tage</strong>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li>Tag 1: Theorie mit schriftlicher Prüfung</li>
              <li>Tag 2: Praxis mit Fahrübungen und praktischer Prüfung</li>
            </ul>
            <br/>
            <strong>Verkürzte Schulungsvarianten:</strong>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li><strong>1 Tag:</strong> Für Teilnehmende mit mindestens 6 Monaten praktischer Erfahrung oder bei vorherigem Abschluss unserer Online-Theorieschulung</li>
              <li><strong>2 Tage Praxis:</strong> Wenn die Theorie bereits online absolviert wurde</li>
              <li><strong>3 Tage (intensiv):</strong> Auf Wunsch möglich, z. B. bei Schubmaststaplern</li>
            </ul>
            <br/>
            <strong>Niederhubwagen (Ameise / Schnellläufer): 1 Tag</strong> Schulung inklusive Theorie, Praxis und Prüfung
            <br/><br/>
            Wir beraten Sie gerne individuell zur passenden Schulungsdauer für Ihre Mitarbeitenden – kontaktieren Sie uns einfach.
          </>
      )
    }
  ];

  // B2C FAQs
  const b2cFaqs = [
    {
      id: 'b2c-1',
      question: 'Wann findet die Schulung statt?',
      answer: (
          <>
            Alle aktuellen und kommenden Schulungstermine werden laufend auf unserer Internetseite veröffentlicht.
            <br/><br/>
            Bitte wählen Sie auf der Website ganz unten die Option „Theorie & Praxis – offline", anschließend den für Sie passenden Termin und Standort.
            <br/><br/>
            Nach der Auswahl können Sie sich direkt online anmelden und Ihren Platz buchen.
          </>
      )
    },
    {
      id: 'b2c-2',
      question: 'Wie lange dauert die Ausbildung?',
      answer: (
          <>
            In der Regel dauert die Ausbildung <strong>2 Tage:</strong>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li>Tag 1: Theorie</li>
              <li>Tag 2: Praxis & Prüfung</li>
            </ul>
            <br/>
            <strong>Flexible Variante:</strong> Wenn Sie die Theorie online absolvieren, können Sie:
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li>die Schulung auf 1 Tag verkürzen, oder</li>
              <li>aus 2 Tagen Praxis bestehen lassen.</li>
            </ul>
          </>
      )
    },
    {
      id: 'b2c-3',
      question: 'Was kostet die Schulung?',
      answer: (
          <>
            Die allgemeine Ausbildung (Stufe 1 – Frontstapler) kostet:
            <br/><br/>
            <strong>249,99 € netto</strong> (+ 19 % MwSt.)
            <br/><br/>
            Im Preis enthalten sind Theorie, Praxis, Prüfung und der offizielle DGUV-Staplerschein.
          </>
      )
    },
    {
      id: 'b2c-4',
      question: 'Gibt es zusätzliche Kosten?',
      answer: (
          <>
            Zusätzliche Kosten entstehen nur bei Bedarf, z. B. für:
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li>Zusatzqualifikationen, z. B.
                <ul className="list-disc ml-6 mt-1 space-y-1">
                  <li>Schubmaststapler</li>
                  <li>FFZ mit Fahrerstand (Ameise / Schnellläufer)</li>
                </ul>
              </li>
              <li>STAPLERO ProCard (Ausweis im Kartenformat): 14,99 € extra</li>
            </ul>
          </>
      )
    },
    {
      id: 'b2c-5',
      question: 'In welcher Sprache findet der Kurs statt?',
      answer: (
          <>
            Die Sprache richtet sich nach dem gewählten Standort und der Auswahl bei der Anmeldung.
            <br/><br/>
            <strong>Beispiel:</strong>
            <br/>
            Berlin (auf Deutsch): Die Schulung findet auf Deutsch statt. Empfohlenes Sprachniveau: mindestens B1
            <br/><br/>
            Teilnehmer mit A2-Niveau können ebenfalls teilnehmen, müssen jedoch beachten, dass am Ende eine Prüfung geschrieben wird. Bei Nichtbestehen muss die Prüfung wiederholt werden.
          </>
      )
    },
    {
      id: 'b2c-6',
      question: 'Kann ich den Kurs komplett auf Englisch machen?',
      answer: (
          <>
            Ja.
            <br/><br/>
            Bitte wählen Sie dafür Berlin (auf Englisch) bei der Anmeldung. Der Unterricht und die Prüfungsfragen erfolgen auf Englisch.
          </>
      )
    },
    {
      id: 'b2c-7',
      question: 'Reicht Deutsch A2 oder B1 aus?',
      answer: (
          <>
            Ja, A2 oder B1 reicht in der Regel aus, wenn Sie:
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li>einfache Anweisungen verstehen</li>
              <li>dem Unterricht folgen können</li>
            </ul>
            <br/>
            Bei Sprachproblemen unterstützt der Trainer.
          </>
      )
    },
    {
      id: 'b2c-8',
      question: 'Welche Voraussetzungen muss ich erfüllen?',
      answer: (
          <>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li>Mindestalter: 18 Jahre</li>
              <li>körperlich und geistig geeignet</li>
              <li>Sprachkenntnisse in Deutsch, Englisch, Polnisch, Ukrainisch oder Russisch</li>
            </ul>
            <br/>
            Vorerfahrung ist nicht notwendig.
          </>
      )
    },
    {
      id: 'b2c-9',
      question: 'Wie läuft die Anmeldung ab?',
      answer: (
          <>
            <ol className="list-decimal ml-6 mt-2 space-y-1">
              <li>Wählen Sie Termin und Sprache auf unserer Website</li>
              <li>Registrieren Sie sich online</li>
              <li>Bezahlen Sie die Schulungsgebühr</li>
              <li>Ihr Platz ist reserviert</li>
            </ol>
          </>
      )
    },
    {
      id: 'b2c-10',
      question: 'Kann ich am Kurstag bar bezahlen?',
      answer: (
          <>
            Nein. Die Anmeldung und Zahlung erfolgen online über die Website.
            <br/><br/>
            Barzahlung ist nur nach vorheriger Absprache möglich.
          </>
      )
    },
    {
      id: 'b2c-11',
      question: 'Kann ich kostenlos stornieren?',
      answer: (
          <>
            Ja. Eine kostenfreie Stornierung ist bis 7 Tage vor Kursbeginn möglich.
          </>
      )
    },
    {
      id: 'b2c-12',
      question: 'Ist der Staplerschein in ganz Deutschland gültig?',
      answer: (
          <>
            Ja. Der Staplerschein ist bundesweit gültig und entspricht den DGUV-Vorschriften.
          </>
      )
    },
    {
      id: 'b2c-13',
      question: 'Arbeiten Sie mit Jobcenter oder Agentur für Arbeit?',
      answer: (
          <>
            Nein. Wir nehmen keine Bildungsgutscheine an. Die Schulung ist privat zu bezahlen oder kann vom Arbeitgeber übernommen werden.
          </>
      )
    },
    {
      id: 'b2c-14',
      question: 'Kann ich die Prüfungsfragen vorher bekommen?',
      answer: (
          <>
            Nein. Die Prüfungsfragen sind offiziell und werden nicht vorab ausgegeben.
            <br/><br/>
            Sie können jedoch unsere Online-Theorie-Schulung nutzen und sich flexibel und bequem vorbereiten.
          </>
      )
    }
  ];

  const currentFaqs = faqCustomerType === 'b2b' ? b2bFaqs : b2cFaqs;

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
                <span className="text-sm font-medium">DGUV Vorschrift 68 & Grundsatz 308-001</span>
              </div>

              <h1 className="font-display text-4xl md:text-6xl font-bold text-primary-foreground mb-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
                STAPLERO
                <span className="text-gradient block">Staplerschein in 48h</span>
              </h1>

              <p className="text-lg text-primary-foreground/80 mb-6 animate-fade-in" style={{ animationDelay: "0.2s" }}>
                Schnelle und allgemein gültige Ausbildung zum Staplerfahrer gemäß DGUV Vorschrift 68.
                Theorie online oder vor Ort. Praxis vor Ort. Mit allgemein gültigem Zertifikat und Fahrausweis.
              </p>

              {/* Language Badge - Highlighted */}
              <div className="bg-primary/30 backdrop-blur-sm border border-primary/50 rounded-xl p-4 mb-8 animate-fade-in" style={{ animationDelay: "0.25s" }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <Globe className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold text-primary-foreground">Sprachlich flexibel</p>
                    <p className="text-primary-foreground/80 text-sm">
                      Deutsch, English, Polnisch, Ukrainisch, Russisch und Rumänisch
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 animate-fade-in" style={{ animationDelay: "0.3s" }}>
                <Link to="/practical-course">
                  <Button variant="hero" size="xl">
                    <Play className="w-5 h-5" />
                    Jetzt starten
                  </Button>
                </Link>
                <a href="#b2b">
                  <Button variant="outline" size="xl" className="border-primary-foreground/30 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20">
                    für Firmen
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </a>
              </div>

              <div className="flex items-center gap-8 mt-12 animate-fade-in" style={{ animationDelay: "0.4s" }}>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  <span className="text-primary-foreground/70 text-sm">48h zum Schein</span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-primary" />
                  <span className="text-primary-foreground/70 text-sm">Allgemein gültig</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  <span className="text-primary-foreground/70 text-sm">1.000+ Absolventen</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section className="py-24 bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
                Unsere <span className="text-primary">Leistungen</span>
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                STAPLERO bietet professionelle Staplerausbildung für Privatpersonen und Unternehmen
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="card-hover border-border">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-4">
                    <BookOpen className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">Online Theorie</h3>
                  <p className="text-sm text-muted-foreground">
                    Flexibler Online-Theoriekurs – lernen Sie jederzeit und überall
                  </p>
                </CardContent>
              </Card>

              <Card className="card-hover border-border">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-4">
                    <GraduationCap className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">Präsenz Theorie</h3>
                  <p className="text-sm text-muted-foreground">
                    Theoriekurs vor Ort mit erfahrenen Ausbildern
                  </p>
                </CardContent>
              </Card>

              <Card className="card-hover border-border">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-4">
                    <Truck className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">Praxisausbildung</h3>
                  <p className="text-sm text-muted-foreground">
                    Praxisorientiertes training für maximale Sicherheit im Arbeitsalltag
                  </p>
                </CardContent>
              </Card>

              <Card className="card-hover border-border">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-4">
                    <RefreshCcw className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">Jährliche Unterweisung</h3>
                  <p className="text-sm text-muted-foreground">
                    Pflicht-Unterweisungen nach DGUV Vorschrift 1
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Why Choose Us */}
        <section id="features" className="py-24 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
                Warum <span className="text-primary">STAPLERO</span>?
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Schnell, professionell und anerkannt – Ihre Vorteile auf einen Blick
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <FileCheck className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Anerkannt</h3>
                <p className="text-sm text-muted-foreground">
                  Von allen Betrieben und öffentlichen Einrichtungen anerkannt
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Award className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Professionell</h3>
                <p className="text-sm text-muted-foreground">
                  Top ausgebildete Coaches und perfektes Trainingsgelände
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Schnell</h3>
                <p className="text-sm text-muted-foreground">
                  Sie erhalten Ihren Staplerschein mit minimalem Zeitaufwand
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Transparent</h3>
                <p className="text-sm text-muted-foreground">
                  Pauschalpreis ohne versteckte Kosten
                </p>
              </div>
            </div>

            <div className="mt-16 bg-gradient-hero rounded-2xl p-8 md:p-12 text-center">
              <h3 className="font-display text-2xl md:text-3xl font-bold text-primary-foreground mb-4">
                STAPLERO garantiert
              </h3>
              <p className="text-primary-foreground/80 text-lg max-w-2xl mx-auto">
                Ihren Staplerschein in 48h mit allgemeingültigem Zertifikat und nach den gängigen Richtlinien.
              </p>
            </div>
          </div>
        </section>

        {/* What We Offer */}
        <section className="py-24 bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
                Was wir <span className="text-primary">bieten</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-success flex items-center justify-center shrink-0">
                  <Check className="w-5 h-5 text-success-foreground" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">16 Stunden Schnellkurs</h4>
                  <p className="text-sm text-muted-foreground">Kompakte Ausbildung an nur 2 Tagen</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-success flex items-center justify-center shrink-0">
                  <Check className="w-5 h-5 text-success-foreground" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Inhouse-Kurse</h4>
                  <p className="text-sm text-muted-foreground">Auch für Gruppen direkt bei Ihnen im Unternehmen</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-success flex items-center justify-center shrink-0">
                  <Check className="w-5 h-5 text-success-foreground" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Jährliche Unterweisungen</h4>
                  <p className="text-sm text-muted-foreground">Auch als Inhouse-Variante verfügbar</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-success flex items-center justify-center shrink-0">
                  <Globe className="w-5 h-5 text-success-foreground" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Sprachlich flexibel</h4>
                  <p className="text-sm text-muted-foreground">Deutsch, English, Polnisch, Ukrainisch, Russisch und Rumänisch</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-success flex items-center justify-center shrink-0">
                  <Check className="w-5 h-5 text-success-foreground" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Schubmaststapler</h4>
                  <p className="text-sm text-muted-foreground">Zusatzausbildung für Flurförderzeuge</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-success flex items-center justify-center shrink-0">
                  <Check className="w-5 h-5 text-success-foreground" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Zertifiziert</h4>
                  <p className="text-sm text-muted-foreground">Auf dem deutschen Markt</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Course Content Section */}
        <section className="py-24 bg-background">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-6">
                  Ausbildungsinhalte
                </h2>
                <p className="text-muted-foreground mb-8">
                  DGUV 68 Ausbildung für Flurförderzeuge – alle relevanten Themen praxisnah vermittelt.
                </p>

                <div className="space-y-4">
                  {[
                    "Rechtsgrundlagen",
                    "Maßnahmen zur Unfallverhütung",
                    "Einsatzprüfung",
                    "Fahrverhalten und Fahrzeugcharakteristik",
                    "Sicherheitsregeln – Wie geht man mit Lasten um?",
                    "Praktisches Fahren",
                    "Theoretische und praktische Prüfungen",
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

        {/* Google Reviews Section */}
        <section className="py-24 bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="w-6 h-6 fill-warning text-warning" />
                  ))}
                </div>
                <span className="text-2xl font-bold text-foreground">5.0</span>
              </div>
              <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
                Das sagen unsere <span className="text-primary">Kunden</span>
              </h2>
              <p className="text-muted-foreground">Basierend auf Google Bewertungen</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {googleReviews.map((review, index) => (
                  <Card key={index} className="card-hover">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-1 mb-3">
                        {[...Array(review.rating)].map((_, i) => (
                            <Star key={i} className="w-4 h-4 fill-warning text-warning" />
                        ))}
                      </div>
                      <p className="text-sm text-foreground mb-4">{`"${review.text}"`}</p>
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-foreground">{review.name}</span>
                        <span className="text-xs text-muted-foreground">{review.date}</span>
                      </div>
                    </CardContent>
                  </Card>
              ))}
            </div>
          </div>
        </section>

        {/* B2B Section */}
        <section id="b2b" className="py-24 bg-gradient-hero">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 bg-primary-foreground/10 px-4 py-2 rounded-full mb-6">
                  <Building2 className="w-4 h-4 text-primary-foreground" />
                  <span className="text-sm font-medium text-primary-foreground">Für Unternehmen</span>
                </div>

                <h2 className="font-display text-3xl md:text-4xl font-bold text-primary-foreground mb-6">
                  B2B – Spezielle Konditionen für Ihr Unternehmen
                </h2>

                <p className="text-primary-foreground/80 mb-8">
                  Sie möchten mehrere Mitarbeiter schnell und unkompliziert zum Staplerfahrer fortbilden?
                  Wir bieten Ihnen maßgeschneiderte Lösungen mit speziellen Konditionen für Unternehmen.
                </p>

                <div className="space-y-4">
                  {[
                    "Individuelle Preisgestaltung je nach Mitarbeiteranzahl",
                    "Inhouse-Schulungen direkt bei Ihnen im Betrieb – deutschlandweit",
                    "Flexible Terminplanung nach Ihren Bedürfnissen",
                    "Jährliche Unterweisungen für Ihre gesamte Belegschaft",
                    "Mehrsprachige Ausbildung verfügbar in Deutsch, Englisch, Polnisch, Ukrainisch, Russisch und Rumänisch",
                    "Persönlicher Ansprechpartner für Ihr Unternehmen",
                  ].map((item, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full bg-primary-foreground flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3 text-primary" />
                        </div>
                        <span className="text-primary-foreground/90">{item}</span>
                      </div>
                  ))}
                </div>
              </div>

              <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-2xl p-8 border border-primary-foreground/20">
                <h3 className="font-display text-xl font-semibold text-primary-foreground mb-6">
                  Diese Fragen beantworten wir gerne:
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary-foreground/20 flex items-center justify-center shrink-0">
                      <Users className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <p className="text-primary-foreground/80 text-sm">
                      Sie möchten einen Ihrer Mitarbeiter schnell und unkompliziert zum Staplerfahrer fortbilden?
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary-foreground/20 flex items-center justify-center shrink-0">
                      <RefreshCcw className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <p className="text-primary-foreground/80 text-sm">
                      Sie müssen Ihre Mitarbeiter nach DGUV Vorschrift 1 mindestens einmal jährlich unterweisen lassen?
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary-foreground/20 flex items-center justify-center shrink-0">
                      <Truck className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <p className="text-primary-foreground/80 text-sm">
                      Sie möchten perspektivisch eine Zusatzausbildung für Flurförderzeuge (z. B. Schubmaststapler) machen?
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Large CTA Button at the end */}
            <div className="mt-12 text-center">
              <a href="#contact">
                <Button size="xl" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 text-lg px-12 py-6 h-auto">
                  <Send className="w-6 h-6 mr-3" />
                  Anfrage stellen
                </Button>
              </a>
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

            <Carousel
                opts={{
                  align: "start",
                  loop: false,
                }}
                className="w-full max-w-5xl mx-auto"
            >
              <CarouselContent className="-ml-2 md:-ml-4">
                {/* Offline Practical Course - Active (FIRST on mobile) */}
                <CarouselItem className="pl-2 md:pl-4 basis-[85%] md:basis-1/2 lg:basis-1/3">
                  <div className="relative bg-card rounded-3xl p-6 shadow-xl border-2 border-primary overflow-hidden">
                    <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-4 py-1 rounded-bl-xl text-sm font-medium">
                      Verfügbar
                    </div>
                    <div className="text-center mb-6">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                        <Truck className="w-6 h-6 text-primary" />
                      </div>
                      <h3 className="font-display text-xl font-bold text-foreground mb-2">
                        Praxis-Ausbildung
                      </h3>
                      <p className="text-muted-foreground text-sm mb-4">
                        16-Stunden Schnellkurs inkl. Prüfung
                      </p>
                      <div className="flex items-baseline justify-center gap-2">
                        <span className="font-display text-4xl font-bold text-foreground">€249,99</span>
                        <span className="text-muted-foreground text-sm">/Person</span>
                      </div>
                    </div>

                    <div className="space-y-3 mb-6">
                      {[
                        "2 Tage praktische Ausbildung",
                        "Theoretische & praktische Prüfung",
                        "Offizieller Staplerschein",
                        "Allgemein gültiges Zertifikat",
                      ].map((feature, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full bg-success flex items-center justify-center shrink-0">
                              <Check className="w-2.5 h-2.5 text-success-foreground" />
                            </div>
                            <span className="text-foreground text-xs">{feature}</span>
                          </div>
                      ))}
                    </div>

                    <Link to="/practical-course" className="block">
                      <Button variant="hero" size="lg" className="w-full">
                        <Calendar className="w-4 h-4 mr-2" />
                        Termin buchen
                      </Button>
                    </Link>
                  </div>
                </CarouselItem>

                {/* Online Course - Inactive */}
                <CarouselItem className="pl-2 md:pl-4 basis-[85%] md:basis-1/2 lg:basis-1/3">
                  <div className="relative bg-card rounded-3xl p-6 shadow-xl border-2 border-border overflow-hidden opacity-60">
                    <div className="absolute top-0 right-0 bg-muted text-muted-foreground px-4 py-1 rounded-bl-xl text-sm font-medium">
                      Bald verfügbar
                    </div>
                    <div className="text-center mb-6">
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                        <BookOpen className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <h3 className="font-display text-xl font-bold text-foreground mb-2">
                        Online Theorie
                      </h3>
                      <p className="text-muted-foreground text-sm mb-4">
                        Vollständiger Online-Theoriekurs
                      </p>
                      <div className="flex items-baseline justify-center gap-2">
                        <span className="font-display text-4xl font-bold text-muted-foreground">€49</span>
                        <span className="text-muted-foreground text-sm">/Monat</span>
                      </div>
                    </div>

                    <div className="space-y-3 mb-6">
                      {[
                        "Alle Kapitel und Lektionen",
                        "Unbegrenzter Zugang für 30 Tage",
                        "Fortschrittsverfolgung",
                        "Zertifikat nach Abschluss",
                      ].map((feature, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full bg-muted flex items-center justify-center shrink-0">
                              <Check className="w-2.5 h-2.5 text-muted-foreground" />
                            </div>
                            <span className="text-muted-foreground text-xs">{feature}</span>
                          </div>
                      ))}
                    </div>

                    <Button variant="outline" size="lg" className="w-full" disabled>
                      Bald verfügbar
                    </Button>
                  </div>
                </CarouselItem>

                {/* Präsenz Theorie - Inactive */}
                <CarouselItem className="pl-2 md:pl-4 basis-[85%] md:basis-1/2 lg:basis-1/3">
                  <div className="relative bg-card rounded-3xl p-6 shadow-xl border-2 border-border overflow-hidden opacity-60">
                    <div className="absolute top-0 right-0 bg-muted text-muted-foreground px-4 py-1 rounded-bl-xl text-sm font-medium">
                      Bald verfügbar
                    </div>
                    <div className="text-center mb-6">
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                        <GraduationCap className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <h3 className="font-display text-xl font-bold text-foreground mb-2">
                        Präsenz Theorie
                      </h3>
                      <p className="text-muted-foreground text-sm mb-4">
                        Theoriekurs vor Ort mit Ausbilder
                      </p>
                      <div className="flex items-baseline justify-center gap-2">
                        <span className="font-display text-4xl font-bold text-muted-foreground">€99</span>
                        <span className="text-muted-foreground text-sm">/Person</span>
                      </div>
                    </div>

                    <div className="space-y-3 mb-6">
                      {[
                        "Direkter Kontakt zum Ausbilder",
                        "Gruppenlernen",
                        "Vor-Ort Fragen stellen",
                        "Sofortiges Feedback",
                      ].map((feature, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full bg-muted flex items-center justify-center shrink-0">
                              <Check className="w-2.5 h-2.5 text-muted-foreground" />
                            </div>
                            <span className="text-muted-foreground text-xs">{feature}</span>
                          </div>
                      ))}
                    </div>

                    <Button variant="outline" size="lg" className="w-full" disabled>
                      Bald verfügbar
                    </Button>
                  </div>
                </CarouselItem>
              </CarouselContent>
              <CarouselPrevious className="hidden md:flex -left-12" />
              <CarouselNext className="hidden md:flex -right-12" />
            </Carousel>

            {/* Carousel dots indicator for mobile */}
            <div className="flex justify-center gap-2 mt-6 md:hidden">
              <div className="w-2.5 h-2.5 rounded-full bg-primary"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/30"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/30"></div>
            </div>
            <p className="text-center text-muted-foreground text-xs mt-3 md:hidden">
              Wischen um mehr zu sehen →
            </p>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="py-24 bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div>
                <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-6">
                  Kontaktieren Sie uns
                </h2>
                <p className="text-muted-foreground mb-8">
                  Haben Sie Fragen? Wir helfen Ihnen gerne weiter. Füllen Sie das Formular aus
                  oder kontaktieren Sie uns direkt.
                </p>

                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Phone className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Telefon</p>
                      <p className="font-medium text-foreground">+49 176 22067783</p>
                      <p className="font-medium text-foreground">+49 176 22067783</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Mail className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">E-Mail</p>
                      <p className="font-medium text-foreground">info@staplero.com</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <MapPin className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Standorte</p>
                      <p className="font-medium text-foreground">Berlin, Zgorzelec/Görlitz, München</p>
                    </div>
                  </div>
                </div>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Anfrage senden</CardTitle>
                  <CardDescription>
                    Wir melden uns schnellstmöglich bei Ihnen zurück.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleContactSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="contact-name">Name *</Label>
                        <Input
                            id="contact-name"
                            value={contactForm.name}
                            onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Ihr Name"
                            required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="contact-email">E-Mail *</Label>
                        <Input
                            id="contact-email"
                            type="email"
                            value={contactForm.email}
                            onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                            placeholder="ihre@email.de"
                            required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="contact-phone">Telefon</Label>
                        <Input
                            id="contact-phone"
                            value={contactForm.phone}
                            onChange={(e) => setContactForm(prev => ({ ...prev, phone: e.target.value }))}
                            placeholder="+49 170 1234567"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="contact-company">Firma (optional)</Label>
                        <Input
                            id="contact-company"
                            value={contactForm.company}
                            onChange={(e) => setContactForm(prev => ({ ...prev, company: e.target.value }))}
                            placeholder="Firmenname"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contact-message">Nachricht *</Label>
                      <Textarea
                          id="contact-message"
                          value={contactForm.message}
                          onChange={(e) => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                          placeholder="Wie können wir Ihnen helfen?"
                          rows={4}
                          required
                      />
                    </div>

                    <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                      {isSubmitting ? "Wird gesendet..." : (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            Nachricht senden
                          </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* FAQ Section with B2B/B2C Toggle */}
        <section className="py-24 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
                Häufig gestellte <span className="text-primary">Fragen</span>
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
                Alles, was Sie über unsere Schulungen wissen müssen
              </p>

              {/* Toggle Switch */}
              <div className="inline-flex items-center gap-2 p-1 bg-muted rounded-full">
                <button
                    onClick={() => setFaqCustomerType('b2b')}
                    className={`px-6 py-2.5 rounded-full font-medium transition-all duration-300 ${
                        faqCustomerType === 'b2b'
                            ? 'bg-primary text-primary-foreground shadow-md'
                            : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                  Firmen
                </button>
                <button
                    onClick={() => setFaqCustomerType('b2c')}
                    className={`px-6 py-2.5 rounded-full font-medium transition-all duration-300 ${
                        faqCustomerType === 'b2c'
                            ? 'bg-primary text-primary-foreground shadow-md'
                            : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                  Private Personen
                </button>
              </div>
            </div>

            <div className="max-w-4xl mx-auto">
              <Accordion type="single" collapsible className="w-full space-y-4">
                {currentFaqs.map((faq) => (
                    <AccordionItem key={faq.id} value={faq.id} className="border rounded-lg px-6">
                      <AccordionTrigger className="text-left hover:no-underline">
                        <span className="font-semibold">{faq.question}</span>
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                ))}
              </Accordion>
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
              Starten Sie noch heute und erhalten Sie Ihren Staplerschein in nur 48 Stunden.
              STAPLERO – schnell, professionell, anerkannt.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/practical-course">
                <Button variant="hero" size="xl">
                  Jetzt registrieren
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link to="/practical-course">
                <Button size="xl" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90">
                  Praxiskurs buchen
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <Footer />
      </div>
  );
};

export default Index;