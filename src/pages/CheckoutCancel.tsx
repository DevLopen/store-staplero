import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { XCircle, ArrowLeft, RotateCcw } from "lucide-react";

const CheckoutCancel = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 pt-24 pb-12">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            {/* Cancel Message */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-warning/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-10 h-10 text-warning" />
              </div>
              <h1 className="font-display text-3xl font-bold text-foreground mb-2">
                Zahlung abgebrochen
              </h1>
              <p className="text-muted-foreground">
                Ihre Bestellung wurde nicht abgeschlossen
              </p>
            </div>

            {/* Info Card */}
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <p className="text-center text-muted-foreground">
                    Sie haben den Zahlungsvorgang abgebrochen. Keine Sorge, es wurden keine
                    Gebühren erhoben.
                  </p>

                  <div className="bg-muted/50 rounded-lg p-4">
                    <h3 className="font-semibold text-foreground mb-2">
                      Was möchten Sie tun?
                    </h3>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Versuchen Sie die Zahlung erneut</li>
                      <li>• Wählen Sie einen anderen Kurs</li>
                      <li>• Kontaktieren Sie uns bei Fragen</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Zurück
              </Button>
              <Button
                className="flex-1"
                onClick={() => navigate("/")}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Zur Startseite
              </Button>
            </div>

            {/* Help Section */}
            <div className="mt-8 text-center">
              <p className="text-sm text-muted-foreground mb-2">
                Brauchen Sie Hilfe?
              </p>
              <a
                href="mailto:info@staplero.de"
                className="text-sm text-primary hover:underline"
              >
                Kontaktieren Sie uns: info@staplero.de
              </a>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CheckoutCancel;