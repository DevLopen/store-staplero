import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { Location, CourseDate } from "@/data/practicalCourseData";
import { 
  MapPin, 
  Calendar, 
  Clock, 
  CreditCard, 
  User,
  Mail,
  Phone,
  CheckCircle,
  ShieldCheck,
  Loader2
} from "lucide-react";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  location: Location;
  date: CourseDate;
  wantsPlasticCard: boolean;
}

const CheckoutModal = ({ isOpen, onClose, location, date, wantsPlasticCard }: CheckoutModalProps) => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    acceptTerms: false
  });

  const basePrice = location.price;
  const plasticCardPrice = wantsPlasticCard ? 14.99 : 0;
  const totalPrice = basePrice + plasticCardPrice;

  const formatDate = (dateString: string) => {
    const dateObj = new Date(dateString);
    return dateObj.toLocaleDateString('de-DE', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const handleSubmit = async () => {
    if (!formData.firstName || !formData.lastName || !formData.email) {
      toast({
        title: "Fehler",
        description: "Bitte füllen Sie alle Pflichtfelder aus.",
        variant: "destructive"
      });
      return;
    }

    if (!formData.acceptTerms) {
      toast({
        title: "Fehler",
        description: "Bitte akzeptieren Sie die AGB und Datenschutzerklärung.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    toast({
      title: "Buchung erfolgreich!",
      description: `Sie haben erfolgreich einen Platz für den ${formatDate(date.date)} in ${location.city} gebucht.`,
    });
    
    setIsProcessing(false);
    onClose();
    
    // Here would be Stripe integration
    console.log({
      customer: formData,
      location,
      date,
      plasticCard: wantsPlasticCard,
      total: totalPrice
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            Buchung abschließen
          </DialogTitle>
          <DialogDescription>
            Bitte geben Sie Ihre Daten ein, um die Buchung abzuschließen.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Order Summary */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <h3 className="font-semibold text-foreground">Ihre Buchung</h3>
            
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-primary mt-1" />
              <div>
                <p className="font-medium text-sm">{location.city}</p>
                <p className="text-xs text-muted-foreground">{location.address}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Calendar className="w-4 h-4 text-primary mt-1" />
              <div>
                <p className="font-medium text-sm">{formatDate(date.date)}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {date.time}
                </p>
              </div>
            </div>

            <Separator />

            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Praktischer Kurs</span>
                <span>{basePrice.toFixed(2)} €</span>
              </div>
              {wantsPlasticCard && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Plastikkarte</span>
                  <span>14,99 €</span>
                </div>
              )}
              <Separator className="my-2" />
              <div className="flex justify-between font-bold text-lg">
                <span>Gesamt</span>
                <span className="text-primary">{totalPrice.toFixed(2)} €</span>
              </div>
            </div>
          </div>

          {/* Customer Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <User className="w-4 h-4" />
              Persönliche Daten
            </h3>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="firstName">Vorname *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  placeholder="Max"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Nachname *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  placeholder="Mustermann"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                E-Mail *
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="max.mustermann@example.de"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Telefon (optional)
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+49 123 456789"
              />
            </div>
          </div>

          {/* Terms */}
          <div className="flex items-start space-x-3 p-3 border border-border rounded-lg">
            <Checkbox 
              id="terms" 
              checked={formData.acceptTerms}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, acceptTerms: checked === true }))}
            />
            <div className="flex-1">
              <Label htmlFor="terms" className="cursor-pointer text-sm">
                Ich akzeptiere die <a href="#" className="text-primary hover:underline">AGB</a> und <a href="#" className="text-primary hover:underline">Datenschutzerklärung</a> *
              </Label>
            </div>
          </div>

          {/* Security Notice */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="w-4 h-4 text-green-500" />
            <span>Ihre Daten werden sicher übertragen und verschlüsselt gespeichert.</span>
          </div>

          {/* Submit Button */}
          <Button 
            className="w-full" 
            size="lg"
            onClick={handleSubmit}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Wird verarbeitet...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Jetzt verbindlich buchen - {totalPrice.toFixed(2)} €
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CheckoutModal;
