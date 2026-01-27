import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useEffect } from "react";
import { mockLocations, Location, CourseDate } from "@/data/practicalCourseData";
import {
  MapPin,
  Calendar,
  Clock,
  Users,
  CreditCard,
  Award,
  BookOpen,
  CheckCircle,
  AlertCircle
} from "lucide-react";

const PracticalCourse = () => {
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();

  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [selectedDate, setSelectedDate] = useState<CourseDate | null>(null);
  const [wantsPlasticCard, setWantsPlasticCard] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/locations`)
        .then(res => res.json())
        .then(data => {
          const mappedLocations = data.map(loc => ({ ...loc, id: loc._id }));
          setLocations(mappedLocations);
        })
        .catch(err => console.error(err));
  }, []);

  const handleLocationSelect = (location: Location) => {
    if (!location.isActive) return;
    setSelectedLocation(location);
    setSelectedDate(null);
  };

  const handleDateSelect = (date: CourseDate) => {
    if (date.availableSpots === 0) return;
    setSelectedDate(date);
  };

  const handleCheckout = () => {
    if (!selectedLocation || !selectedDate) {
      toast({
        title: t('common.error'),
        description: "Bitte wählen Sie einen Standort und Termin aus.",
        variant: "destructive",
      });
      return;
    }

    // Redirect to checkout with course data
    navigate("/checkout", {
      state: {
        type: "practical",
        courseName: `Praktischer Staplerführerschein - ${selectedLocation.city}`,
        price: selectedLocation.price,
        practicalCourse: {
          locationId: selectedLocation.id,
          locationName: selectedLocation.city,
          locationAddress: selectedLocation.address,
          startDate: selectedDate.startDate,
          endDate: selectedDate.endDate,
          time: selectedDate.time,
          availableSpots: selectedDate.availableSpots,
          price: selectedLocation.price,
          wantsPlasticCard,
        },
      },
    });
  };

  const formatDate = (startDate: string, endDate: string) => {
    if (startDate === endDate) {
      return new Date(startDate).toLocaleDateString('de-DE', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
    return `${new Date(startDate).toLocaleDateString('de-DE', { day: 'numeric', month: 'numeric', year: 'numeric' })} - ${new Date(endDate).toLocaleDateString('de-DE', { day: 'numeric', month: 'numeric', year: 'numeric' })}`;
  };

  return (
      <div className="min-h-screen bg-background">
        <Navbar />

        <main className="pt-24 pb-12">
          {/* Hero Section */}
          <section className="container mx-auto px-4 mb-12">
            <div className="text-center max-w-3xl mx-auto">
              <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
                {t('practical.title')}
              </h1>
              <p className="text-lg text-muted-foreground">
                {t('practical.subtitle')}
              </p>
            </div>
          </section>

          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Course Details & FAQ */}
              <div className="lg:col-span-2 space-y-8">
                {/* Course Details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-primary" />
                      {t('practical.courseDetails')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Clock className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{t('practical.duration')}</p>
                          <p className="text-sm text-muted-foreground">{t('practical.durationText')}</p>
                          <p className="text-sm text-muted-foreground">{t('practical.durationText.2')}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Award className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{t('practical.certificate')}</p>
                          <p className="text-sm text-muted-foreground">{t('practical.certificateText')}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                          <CheckCircle className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{t('practical.included')}</p>
                          <p className="text-sm text-muted-foreground">{t('practical.includedText')}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* FAQ */}
                <Card>
                  <CardHeader>
                    <CardTitle>{t('practical.faq')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="q1">
                        <AccordionTrigger>{t('faq.q1')}</AccordionTrigger>
                        <AccordionContent>{t('faq.a1')}</AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="q2">
                        <AccordionTrigger>{t('faq.q2')}</AccordionTrigger>
                        <AccordionContent>{t('faq.a2')}</AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="q3">
                        <AccordionTrigger>{t('faq.q3')}</AccordionTrigger>
                        <AccordionContent>{t('faq.a3')}</AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="q4">
                        <AccordionTrigger>{t('faq.q4')}</AccordionTrigger>
                        <AccordionContent>{t('faq.a4')}</AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </CardContent>
                </Card>

                {/* Location Selection */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-primary" />
                      {t('practical.selectLocation')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {locations.map((location) => (
                          <Card
                              key={location.id}
                              className={`cursor-pointer transition-all ${
                                  !location.isActive
                                      ? 'opacity-60 cursor-not-allowed'
                                      : selectedLocation?.id === location.id
                                          ? 'ring-2 ring-primary shadow-md'
                                          : 'hover:shadow-md'
                              }`}
                              onClick={() => handleLocationSelect(location)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between mb-2">
                                <h3 className="font-semibold text-foreground">{location.city}</h3>
                                {!location.isActive && (
                                    <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">
                                {t('practical.locationInactive')}
                              </span>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mb-3">{location.address}</p>
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-primary text-lg">{location.price} €</span>
                                <span className="text-xs text-muted-foreground">{t('practical.perPerson')}</span>
                              </div>
                            </CardContent>
                          </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Date Selection */}
                {selectedLocation && selectedLocation.isActive && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Calendar className="w-5 h-5 text-primary" />
                          {t('practical.selectDate')} - {selectedLocation.city}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {selectedLocation.dates.map((date) => (
                              <Card
                                  key={date.id}
                                  className={`cursor-pointer transition-all ${
                                      date.availableSpots === 0
                                          ? 'opacity-50 cursor-not-allowed'
                                          : selectedDate?.id === date.id
                                              ? 'ring-2 ring-primary bg-primary/5'
                                              : 'hover:bg-muted/50'
                                  }`}
                                  onClick={() => handleDateSelect(date)}
                              >
                                <CardContent className="p-4">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="font-medium text-foreground">{formatDate(date.startDate, date.endDate)}</p>
                                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {date.time}
                                      </p>
                                    </div>
                                    <div className="text-right">
                                      <div className="flex items-center gap-1 text-sm">
                                        <Users className="w-4 h-4" />
                                        <span className={date.availableSpots < 5 ? 'text-destructive' : 'text-muted-foreground'}>
                                    {date.availableSpots} Plätze
                                  </span>
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                )}
              </div>

              {/* Right Column - Summary & Payment */}
              <div className="lg:col-span-1">
                <Card className="sticky top-24">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-primary" />
                      Zusammenfassung
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {selectedLocation ? (
                        <>
                          <div className="p-3 bg-muted/50 rounded-lg">
                            <p className="font-medium text-foreground">{selectedLocation.city}</p>
                            <p className="text-sm text-muted-foreground">{selectedLocation.address}</p>
                          </div>

                          {selectedDate && (
                              <div className="p-3 bg-muted/50 rounded-lg">
                                <p className="font-medium text-foreground">{formatDate(selectedDate.startDate, selectedDate.endDate)}</p>
                                <p className="text-sm text-muted-foreground">{selectedDate.time}</p>
                              </div>
                          )}

                          <div className="flex items-start space-x-3 p-3 border border-border rounded-lg">
                            <Checkbox
                                id="plasticCard"
                                checked={wantsPlasticCard}
                                onCheckedChange={(checked) => setWantsPlasticCard(checked === true)}
                            />
                            <div className="flex-1">
                              <Label htmlFor="plasticCard" className="cursor-pointer">
                                {t('practical.plasticCard')}
                              </Label>
                              <p className="text-sm font-medium text-primary">{t('practical.plasticCardPrice')}</p>
                            </div>
                          </div>

                          <div className="border-t border-border pt-4">
                            <div className="flex justify-between text-sm mb-2">
                              <span className="text-muted-foreground">Kurs</span>
                              <span>{selectedLocation.price.toFixed(2)} €</span>
                            </div>
                            {wantsPlasticCard && (
                                <div className="flex justify-between text-sm mb-2">
                                  <span className="text-muted-foreground">Plastikkarte</span>
                                  <span>14,99 €</span>
                                </div>
                            )}
                            <div className="flex justify-between font-bold text-lg mt-3">
                              <span>Gesamt</span>
                              <span className="text-primary">
                            {(selectedLocation.price + (wantsPlasticCard ? 14.99 : 0)).toFixed(2)} €
                          </span>
                            </div>
                          </div>

                          <Button
                              className="w-full"
                              size="lg"
                              disabled={!selectedDate}
                              onClick={handleCheckout}
                          >
                            {t('practical.toPayment')}
                          </Button>

                          {!selectedDate && (
                              <p className="text-sm text-muted-foreground flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" />
                                Bitte wählen Sie einen Termin
                              </p>
                          )}
                        </>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p>Bitte wählen Sie einen Standort</p>
                        </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
  );
};

export default PracticalCourse;