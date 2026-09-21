import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Link } from "react-router-dom";
import {
    Shield, Clock, Award, ChevronRight, Check, Users, Star,
    Building2, Phone, Mail, Globe, Send, Calendar,
    Languages, MonitorPlay, Presentation, CalendarCheck, BadgeCheck, GraduationCap,
    Timer, Receipt, UserCheck, Zap, Facebook, Instagram, Linkedin,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import heroImage from "@/assets/bodzio.webp";
import warehouseImage from "@/assets/index-1.jpg";
import controlsImage from "@/assets/forklift-controls.jpg";
import trainingImage from "@/assets/sala.jpg";
import { useLanguage } from "@/contexts/LanguageContext";
import ProductCard from "@/components/ProductCard";
import { getProducts } from "@/api/product.api";
import { Product } from "@/types/product.types";
import { SealBadge, IconForklift, IconPin } from "@/components/BrandIcons";
import { Blob, RackTexture } from "@/components/SectionDecor";
import { Flag, FlagCode } from "@/components/FlagIcons";
import { cn } from "@/lib/utils";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// ─── FAQ data per language ────────────────────────────────────────────────────
const getB2bFaqs = (lang: string): { id: string; question: string; answer: JSX.Element }[] => {
    const data: Record<string, { id: string; question: string; answer: JSX.Element }[]> = {
        de: [
            { id: 'b2b-1', question: 'Bieten Sie auch Inhouse-Schulungen in unserem Unternehmen an?', answer: (<>Ja, wir führen deutschlandweit Inhouse-Schulungen direkt bei Ihnen vor Ort durch. Die Ausbildung erfolgt nach den aktuellen Vorschriften DGUV Vorschrift 68 und DGUV Grundsatz 308-001.<br/><br/>Die Schulung besteht aus einem Theorieteil mit schriftlicher Prüfung sowie einem Praxisteil mit Fahrprüfung. Unsere Trainer bringen alle erforderlichen Schulungsunterlagen mit. Voraussetzung ist eine geeignete Fläche für die praktischen Übungen.</>) },
            { id: 'b2b-2', question: 'Wie hoch sind die Kosten für eine Inhouse-Schulung?', answer: (<>Da jede Schulung individuell geplant wird, bitten wir Sie, uns folgende Informationen mitzuteilen:<ul className="list-disc ml-6 mt-2 space-y-1"><li>Anzahl der Mitarbeitenden</li><li>Ort der Schulung</li><li>Geräteart (z. B. Frontstapler, Schubmaststapler, Elektro-Ameise)</li><li>Vorerfahrung der Teilnehmenden</li></ul><br/>Für Schulungen in rumänischer Sprache fällt ein Dolmetscherzuschlag von 179,99 € netto pro Tag an.<br/><br/>Kontaktieren Sie uns gern direkt.</>) },
            { id: 'b2b-3', question: 'In welchen Sprachen bieten Sie die Schulung an?', answer: (<>Wir führen die Schulung vollständig in der gewünschten Sprache durch.<br/><br/>Verfügbare Sprachen:<ul className="list-disc ml-6 mt-2 space-y-1"><li>Deutsch</li><li>Polnisch</li><li>Ukrainisch</li><li>Russisch</li><li>Rumänisch (Dolmetscherzuschlag: 179,99 € netto/Tag)</li></ul></>) },
            { id: 'b2b-4', question: 'Welche Unterlagen müssen die Teilnehmenden mitbringen?', answer: (<><ul className="list-disc ml-6 mt-2 space-y-1"><li>Gültiger Ausweis (Personalausweis oder Reisepass)</li><li>Passfoto (für den Fahrausweis)</li><li>Sicherheitsschuhe (Pflicht für den praktischen Teil)</li></ul></>) },
            { id: 'b2b-5', question: 'Erhalten die Teilnehmenden einen anerkannten Staplerschein?', answer: (<>Ja. Nach bestandener Prüfung erhalten alle Teilnehmenden einen offiziellen deutschen Staplerschein gemäß DGUV Vorschrift 68, bundesweit anerkannt.</>) },
            { id: 'b2b-6', question: 'Was benötigen wir als Unternehmen vor Ort?', answer: (<><strong>Tag 1 (Theorie):</strong> Ruhiger Raum mit Tischen und Stühlen.<br/><br/><strong>Tag 2 (Praxis):</strong><ul className="list-disc ml-6 mt-2 space-y-1"><li>Geeigneter Übungsbereich (Lagerfläche o. Betriebshof)</li><li>Funktionsfähiger Gabelstapler</li><li>Europaletten und idealerweise Gitterboxen</li></ul></>) },
            { id: 'b2b-7', question: 'Wie lange dauert die Ausbildung?', answer: (<><strong>Standard (Gabelstapler): 2 Tage</strong><ul className="list-disc ml-6 mt-2 space-y-1"><li>Tag 1: Theorie mit schriftlicher Prüfung</li><li>Tag 2: Praxis mit Fahrprüfung</li></ul><br/><strong>Verkürzte Varianten:</strong><ul className="list-disc ml-6 mt-2 space-y-1"><li><strong>1 Tag:</strong> Bei ≥6 Monaten Praxiserfahrung</li><li><strong>3 Tage:</strong> Z. B. bei Schubmaststaplern</li></ul></>) },
        ],
        en: [
            { id: 'b2b-1', question: 'Do you offer in-house training at our company?', answer: (<>Yes, we conduct in-house training directly at your premises throughout Germany, following DGUV Regulation 68 and DGUV Principle 308-001.<br/><br/>Training includes a theory part with a written exam and a practical part with a driving test. Our trainers bring all materials. A suitable area for practical exercises is required.</>) },
            { id: 'b2b-2', question: 'How much does in-house training cost?', answer: (<>Since each training is individually planned, please provide:<ul className="list-disc ml-6 mt-2 space-y-1"><li>Number of employees to be trained</li><li>Location of training</li><li>Type of equipment (e.g. counterbalance forklift, reach truck, pallet truck)</li><li>Prior experience of participants</li></ul><br/>Romanian language training: interpreter surcharge €179.99 net/day.<br/><br/>Contact us directly for a tailored offer.</>) },
            { id: 'b2b-3', question: 'In which languages do you offer training?', answer: (<>We conduct training entirely in your preferred language.<br/><br/>Available languages:<ul className="list-disc ml-6 mt-2 space-y-1"><li>German</li><li>Polish</li><li>Ukrainian</li><li>Russian</li><li>Romanian (interpreter surcharge: €179.99 net/day)</li></ul></>) },
            { id: 'b2b-4', question: 'What must participants bring?', answer: (<><ul className="list-disc ml-6 mt-2 space-y-1"><li>Valid ID (identity card or passport)</li><li>Passport photo (for the driver's license)</li><li>Safety shoes (mandatory for practical part)</li></ul></>) },
            { id: 'b2b-5', question: 'Do participants receive a recognized forklift license?', answer: (<>Yes. After passing, all participants receive an official German forklift license per DGUV Regulation 68, recognized nationwide.</>) },
            { id: 'b2b-6', question: 'What does our company need on-site?', answer: (<><strong>Day 1 (Theory):</strong> Quiet room with tables and chairs.<br/><br/><strong>Day 2 (Practice):</strong><ul className="list-disc ml-6 mt-2 space-y-1"><li>Suitable exercise area (warehouse/yard)</li><li>Functional forklift</li><li>Euro pallets and ideally mesh boxes</li></ul></>) },
            { id: 'b2b-7', question: 'How long does training take?', answer: (<><strong>Standard (forklift): 2 days</strong><ul className="list-disc ml-6 mt-2 space-y-1"><li>Day 1: Theory with written exam</li><li>Day 2: Practice with driving exam</li></ul><br/><strong>Shortened variants:</strong><ul className="list-disc ml-6 mt-2 space-y-1"><li><strong>1 day:</strong> With ≥6 months practical experience</li><li><strong>3 days:</strong> E.g. for reach trucks</li></ul></>) },
        ],
        pl: [
            { id: 'b2b-1', question: 'Czy oferujecie szkolenia u klienta w naszej firmie?', answer: (<>Tak, prowadzimy szkolenia u klienta bezpośrednio na terenie Twojej firmy na terenie całych Niemiec, zgodnie z DGUV Przepis 68 i DGUV Zasada 308-001.<br/><br/>Szkolenie obejmuje część teoretyczną z egzaminem pisemnym i część praktyczną z egzaminem jazdy. Instruktorzy przywożą wszystkie materiały. Wymagany jest odpowiedni teren do ćwiczeń.</>) },
            { id: 'b2b-2', question: 'Ile kosztuje szkolenie u klienta?', answer: (<>Aby przygotować indywidualną ofertę, prosimy o podanie:<ul className="list-disc ml-6 mt-2 space-y-1"><li>Liczby pracowników do przeszkolenia</li><li>Miejsca szkolenia</li><li>Rodzaju urządzenia (np. wózek czołowy, wysokiego składowania, paletowy)</li><li>Wcześniejszego doświadczenia uczestników</li></ul><br/>Szkolenie po rumuńsku: dopłata za tłumacza 179,99 € netto/dzień.<br/><br/>Skontaktuj się z nami bezpośrednio.</>) },
            { id: 'b2b-3', question: 'W jakich językach oferujecie szkolenie?', answer: (<>Prowadzimy szkolenie w całości w wybranym języku.<br/><br/>Dostępne języki:<ul className="list-disc ml-6 mt-2 space-y-1"><li>Niemiecki</li><li>Polski</li><li>Ukraiński</li><li>Rosyjski</li><li>Rumuński (dopłata za tłumacza: 179,99 € netto/dzień)</li></ul></>) },
            { id: 'b2b-4', question: 'Co muszą przynieść uczestnicy?', answer: (<><ul className="list-disc ml-6 mt-2 space-y-1"><li>Ważny dowód tożsamości (dowód osobisty lub paszport)</li><li>Zdjęcie paszportowe (do dowodu kierowcy)</li><li>Obuwie ochronne (obowiązkowe do części praktycznej)</li></ul></>) },
            { id: 'b2b-5', question: 'Czy uczestnicy otrzymują uznawane uprawnienia?', answer: (<>Tak. Po zdaniu egzaminu wszyscy otrzymują oficjalne niemieckie uprawnienia zgodne z DGUV Przepis 68, uznawane w całych Niemczech.</>) },
            { id: 'b2b-6', question: 'Czego potrzebujemy jako firma na miejscu?', answer: (<><strong>Dzień 1 (Teoria):</strong> Cicha sala ze stołami i krzesłami.<br/><br/><strong>Dzień 2 (Praktyka):</strong><ul className="list-disc ml-6 mt-2 space-y-1"><li>Odpowiedni teren do ćwiczeń (magazyn/plac)</li><li>Sprawny wózek widłowy</li><li>Palety euro i najlepiej skrzynki siatkowe</li></ul></>) },
            { id: 'b2b-7', question: 'Jak długo trwa szkolenie?', answer: (<><strong>Standard (wózek widłowy): 2 dni</strong><ul className="list-disc ml-6 mt-2 space-y-1"><li>Dzień 1: Teoria z egzaminem pisemnym</li><li>Dzień 2: Praktyka z egzaminem jazdy</li></ul><br/><strong>Skrócone warianty:</strong><ul className="list-disc ml-6 mt-2 space-y-1"><li><strong>1 dzień:</strong> Przy ≥6 mies. doświadczenia praktycznego</li><li><strong>3 dni:</strong> Np. dla wózków wysokiego składowania</li></ul></>) },
        ],
        uk: [
            { id: 'b2b-1', question: 'Чи пропонуєте ви корпоративне навчання у нашій компанії?', answer: (<>Так, ми проводимо корпоративне навчання по всій Німеччині відповідно до DGUV Приписи 68 та DGUV Принципу 308-001.<br/><br/>Навчання включає теоретичну частину з письмовим іспитом та практичну частину з іспитом з водіння. Тренери привозять усі матеріали. Необхідна відповідна площа для вправ.</>) },
            { id: 'b2b-2', question: 'Скільки коштує корпоративне навчання?', answer: (<>Для підготовки індивідуальної пропозиції, будь ласка, надайте:<ul className="list-disc ml-6 mt-2 space-y-1"><li>Кількість співробітників для навчання</li><li>Місце проведення</li><li>Тип обладнання (навантажувач, штабелеукладач, електровізок)</li><li>Попередній досвід учасників</li></ul><br/>Навчання румунською: доплата за перекладача 179,99 € нетто/день.<br/><br/>Зв'яжіться з нами безпосередньо.</>) },
            { id: 'b2b-3', question: 'Якими мовами ви проводите навчання?', answer: (<>Ми проводимо навчання повністю на вибраній мові.<br/><br/>Доступні мови:<ul className="list-disc ml-6 mt-2 space-y-1"><li>Німецька</li><li>Польська</li><li>Українська</li><li>Російська</li><li>Румунська (доплата за перекладача: 179,99 € нетто/день)</li></ul></>) },
            { id: 'b2b-4', question: 'Що мають принести учасники?', answer: (<><ul className="list-disc ml-6 mt-2 space-y-1"><li>Дійсний документ (ID-картка або паспорт)</li><li>Фото для посвідчення водія</li><li>Захисне взуття (обов'язково для практики)</li></ul></>) },
            { id: 'b2b-5', question: 'Чи отримують учасники визнані права на навантажувач?', answer: (<>Так. Після іспиту всі отримують офіційні права відповідно до DGUV Приписи 68, визнані по всій Німеччині.</>) },
            { id: 'b2b-6', question: 'Що потрібно нашій компанії на місці?', answer: (<><strong>День 1 (Теорія):</strong> Тихе приміщення зі столами та стільцями.<br/><br/><strong>День 2 (Практика):</strong><ul className="list-disc ml-6 mt-2 space-y-1"><li>Відповідний майданчик для вправ</li><li>Справний навантажувач</li><li>Єврощаплети та в ідеалі сітчасті ящики</li></ul></>) },
            { id: 'b2b-7', question: 'Як довго триває навчання?', answer: (<><strong>Стандарт (навантажувач): 2 дні</strong><ul className="list-disc ml-6 mt-2 space-y-1"><li>День 1: Теорія з письмовим іспитом</li><li>День 2: Практика з іспитом з водіння</li></ul><br/><strong>Скорочені варіанти:</strong><ul className="list-disc ml-6 mt-2 space-y-1"><li><strong>1 день:</strong> При ≥6 місяців практичного досвіду</li><li><strong>3 дні:</strong> Напр. для штабелеукладачів</li></ul></>) },
        ],
    };
    return data[lang] ?? data['de'];
};

const getB2cFaqs = (lang: string): { id: string; question: string; answer: JSX.Element }[] => {
    const data: Record<string, { id: string; question: string; answer: JSX.Element }[]> = {
        de: [
            { id: 'b2c-1', question: 'Wann findet die Schulung statt?', answer: (<>Alle Schulungstermine werden auf unserer Website veröffentlicht. Wählen Sie „Theorie &amp; Praxis (offline)", dann Termin und Standort.</>) },
            { id: 'b2c-2', question: 'Wie lange dauert die Ausbildung?', answer: (<>In der Regel <strong>2 Tage:</strong><ul className="list-disc ml-6 mt-2 space-y-1"><li>Tag 1: Theorie</li><li>Tag 2: Praxis &amp; Prüfung</li></ul></>) },
            { id: 'b2c-3', question: 'Was kostet die Schulung?', answer: (<><strong>279,99 € netto</strong> (+ 19% MwSt.), inkl. Theorie, Praxis, Prüfung und offizieller Staplerschein.</>) },
            { id: 'b2c-4', question: 'Gibt es zusätzliche Kosten?', answer: (<>Nur bei Bedarf: Zusatzqualifikationen (Schubmaststapler, Schnellläufer).</>) },
            { id: 'b2c-5', question: 'In welcher Sprache findet der Kurs statt?', answer: (<>Je nach Standort und Anmeldung. Beispiel: Berlin (Deutsch), empfohlenes Niveau B1.</>) },
            { id: 'b2c-6', question: 'Kann ich den Kurs auf Englisch machen?', answer: (<>Ja. Wählen Sie Berlin (Englisch) bei der Anmeldung.</>) },
            { id: 'b2c-7', question: 'Reicht Deutsch A2 oder B1?', answer: (<>Ja, wenn Sie einfache Anweisungen verstehen und dem Unterricht folgen können.</>) },
            { id: 'b2c-8', question: 'Welche Voraussetzungen muss ich erfüllen?', answer: (<><ul className="list-disc ml-6 mt-2 space-y-1"><li>Mindestalter: 18 Jahre</li><li>Körperlich und geistig geeignet</li><li>Sprachkenntnisse: DE, EN, PL, UK oder RU</li></ul></>) },
            { id: 'b2c-9', question: 'Wie läuft die Anmeldung ab?', answer: (<><ol className="list-decimal ml-6 mt-2 space-y-1"><li>Termin und Sprache wählen</li><li>Online registrieren</li><li>Schulungsgebühr bezahlen</li><li>Platz ist reserviert</li></ol></>) },
            { id: 'b2c-10', question: 'Kann ich am Kurstag bar bezahlen?', answer: (<>Nein. Zahlung erfolgt online. Barzahlung nur nach Absprache.</>) },
            { id: 'b2c-11', question: 'Kann ich kostenlos stornieren?', answer: (<>Ja, bis 7 Tage vor Kursbeginn.</>) },
            { id: 'b2c-12', question: 'Ist der Staplerschein bundesweit gültig?', answer: (<>Ja. Der Staplerschein gilt bundesweit gemäß DGUV-Vorschriften.</>) },
            { id: 'b2c-13', question: 'Arbeiten Sie mit dem Jobcenter zusammen?', answer: (<>Nein. Wir nehmen keine Bildungsgutscheine an.</>) },
            { id: 'b2c-14', question: 'Kann ich die Prüfungsfragen vorher bekommen?', answer: (<>Nein. Die Fragen sind offiziell. Zur Vorbereitung empfehlen wir unseren Online-Theoriekurs.</>) },
            { id: 'b2c-15', question: 'Bieten Sie den Staplerschein auch in Berlin und Görlitz an?', answer: (<>Ja. Praxistermine finden regelmäßig in Berlin und in Görlitz / Zgorzelec statt, ideal für die deutsch-polnische Grenzregion. Weitere Standorte, z. B. München, finden Sie auf unserer <a href="/kursy" className="text-primary underline">Kursübersicht</a>.</>) },
        ],
        en: [
            { id: 'b2c-1', question: 'When does the training take place?', answer: (<>All training dates are published on our website. Select "Theory &amp; Practice (offline)", then choose your date and location.</>) },
            { id: 'b2c-2', question: 'How long does training take?', answer: (<>Usually <strong>2 days:</strong><ul className="list-disc ml-6 mt-2 space-y-1"><li>Day 1: Theory</li><li>Day 2: Practice &amp; Exam</li></ul></>) },
            { id: 'b2c-3', question: 'How much does training cost?', answer: (<><strong>€279.99 net</strong> (+ 19% VAT), incl. theory, practice, exam and official forklift license.</>) },
            { id: 'b2c-4', question: 'Are there additional costs?', answer: (<>Only if needed: additional qualifications (reach truck, powered pallet truck).</>) },
            { id: 'b2c-5', question: 'In what language is the course?', answer: (<>Depends on location and registration. Example: Berlin (German), recommended level B1.</>) },
            { id: 'b2c-6', question: 'Can I do the course in English?', answer: (<>Yes. Select Berlin (English) when registering.</>) },
            { id: 'b2c-7', question: 'Is German A2 or B1 sufficient?', answer: (<>Yes, if you can understand simple instructions and follow the lessons.</>) },
            { id: 'b2c-8', question: 'What are the requirements?', answer: (<><ul className="list-disc ml-6 mt-2 space-y-1"><li>Minimum age: 18</li><li>Physically and mentally fit</li><li>Language: DE, EN, PL, UK or RU</li></ul></>) },
            { id: 'b2c-9', question: 'How does registration work?', answer: (<><ol className="list-decimal ml-6 mt-2 space-y-1"><li>Choose date and language</li><li>Register online</li><li>Pay the training fee</li><li>Your place is reserved</li></ol></>) },
            { id: 'b2c-10', question: 'Can I pay cash on the training day?', answer: (<>No. Payment is online only. Cash by prior arrangement only.</>) },
            { id: 'b2c-11', question: 'Can I cancel for free?', answer: (<>Yes, up to 7 days before the course.</>) },
            { id: 'b2c-12', question: 'Is the forklift license valid throughout Germany?', answer: (<>Yes. Valid nationwide per DGUV regulations.</>) },
            { id: 'b2c-13', question: 'Do you work with Jobcenter?', answer: (<>No. We do not accept education vouchers.</>) },
            { id: 'b2c-14', question: 'Can I get the exam questions in advance?', answer: (<>No. They are official. We recommend our online theory course for preparation.</>) },
            { id: 'b2c-15', question: 'Do you offer the forklift license in Berlin and Görlitz too?', answer: (<>Yes. Practical dates take place regularly in Berlin and in Görlitz / Zgorzelec, ideal for the German-Polish border region. More locations, e.g. Munich, can be found on our <a href="/kursy" className="text-primary underline">course overview</a>.</>) },
        ],
        pl: [
            { id: 'b2c-1', question: 'Kiedy odbywa się szkolenie?', answer: (<>Wszystkie terminy są publikowane na naszej stronie. Wybierz „Teoria i Praktyka (stacjonarnie)", następnie termin i lokalizację.</>) },
            { id: 'b2c-2', question: 'Jak długo trwa szkolenie?', answer: (<>Zazwyczaj <strong>2 dni:</strong><ul className="list-disc ml-6 mt-2 space-y-1"><li>Dzień 1: Teoria</li><li>Dzień 2: Praktyka i egzamin</li></ul></>) },
            { id: 'b2c-3', question: 'Ile kosztuje szkolenie?', answer: (<><strong>279,99 € netto</strong> (+ 19% VAT), cena obejmuje teorię, praktykę, egzamin i oficjalne uprawnienia.</>) },
            { id: 'b2c-4', question: 'Czy są dodatkowe koszty?', answer: (<>Tylko w razie potrzeby: dodatkowe kwalifikacje (wózek wysokiego składowania, wózek z platformą).</>) },
            { id: 'b2c-5', question: 'W jakim języku odbywa się kurs?', answer: (<>Zależy od lokalizacji i wyboru przy rejestracji. Przykład: Berlin (po niemiecku), zalecany poziom B1.</>) },
            { id: 'b2c-6', question: 'Czy mogę odbyć kurs po polsku?', answer: (<>Tak. Wybierz odpowiednią lokalizację z językiem polskim przy rejestracji.</>) },
            { id: 'b2c-7', question: 'Czy poziom B1 z języka niemieckiego wystarczy?', answer: (<>Tak, jeśli rozumiesz proste polecenia i możesz podążać za lekcjami.</>) },
            { id: 'b2c-8', question: 'Jakie są wymagania do uczestnictwa?', answer: (<><ul className="list-disc ml-6 mt-2 space-y-1"><li>Minimalny wiek: 18 lat</li><li>Sprawność fizyczna i psychiczna</li><li>Język: DE, EN, PL, UK lub RU</li></ul></>) },
            { id: 'b2c-9', question: 'Jak przebiega rejestracja?', answer: (<><ol className="list-decimal ml-6 mt-2 space-y-1"><li>Wybierz termin i język</li><li>Zarejestruj się online</li><li>Opłać kurs</li><li>Twoje miejsce jest zarezerwowane</li></ol></>) },
            { id: 'b2c-10', question: 'Czy mogę zapłacić gotówką w dniu kursu?', answer: (<>Nie. Płatność odbywa się online. Gotówka tylko po wcześniejszym uzgodnieniu.</>) },
            { id: 'b2c-11', question: 'Czy mogę anulować bezpłatnie?', answer: (<>Tak, do 7 dni przed rozpoczęciem kursu.</>) },
            { id: 'b2c-12', question: 'Czy uprawnienia są ważne w całych Niemczech?', answer: (<>Tak. Ważne w całych Niemczech zgodnie z przepisami DGUV.</>) },
            { id: 'b2c-13', question: 'Czy współpracujecie z Urzędem Pracy?', answer: (<>Nie. Nie przyjmujemy bonów edukacyjnych.</>) },
            { id: 'b2c-14', question: 'Czy mogę wcześniej dostać pytania egzaminacyjne?', answer: (<>Nie. Są oficjalne. Do przygotowania polecamy nasz kurs teorii online.</>) },
            { id: 'b2c-15', question: 'Czy oferujecie uprawnienia na wózek widłowy również w Berlinie i Görlitz?', answer: (<>Tak. Terminy praktyczne odbywają się regularnie w Berlinie oraz w Görlitz / Zgorzelcu, idealnie dla pogranicza polsko-niemieckiego. Więcej lokalizacji, np. Monachium, znajdziesz w naszej <a href="/kursy" className="text-primary underline">ofercie kursów</a>.</>) },
        ],
        uk: [
            { id: 'b2c-1', question: 'Коли проводиться навчання?', answer: (<>Усі терміни публікуються на нашому сайті. Виберіть «Теорія та Практика (офлайн)», потім дату та локацію.</>) },
            { id: 'b2c-2', question: 'Як довго триває навчання?', answer: (<>Зазвичай <strong>2 дні:</strong><ul className="list-disc ml-6 mt-2 space-y-1"><li>День 1: Теорія</li><li>День 2: Практика та іспит</li></ul></>) },
            { id: 'b2c-3', question: 'Скільки коштує навчання?', answer: (<><strong>279,99 € нетто</strong> (+ 19% ПДВ), включає теорію, практику, іспит та офіційні права.</>) },
            { id: 'b2c-4', question: 'Чи є додаткові витрати?', answer: (<>Лише за потреби: додаткові кваліфікації (штабелеукладач, електровізок).</>) },
            { id: 'b2c-5', question: 'Якою мовою проводиться курс?', answer: (<>Залежить від локації та вибору при реєстрації. Приклад: Берлін (німецькою), рекомендований рівень B1.</>) },
            { id: 'b2c-6', question: 'Чи можу я пройти курс українською?', answer: (<>Так. Оберіть відповідну локацію з українською мовою при реєстрації.</>) },
            { id: 'b2c-7', question: 'Чи достатньо рівня B1 з німецької?', answer: (<>Так, якщо ви розумієте прості інструкції та можете стежити за заняттями.</>) },
            { id: 'b2c-8', question: 'Які вимоги до участі?', answer: (<><ul className="list-disc ml-6 mt-2 space-y-1"><li>Мінімальний вік: 18 років</li><li>Фізична та розумова придатність</li><li>Мова: DE, EN, PL, UK або RU</li></ul></>) },
            { id: 'b2c-9', question: 'Як відбувається реєстрація?', answer: (<><ol className="list-decimal ml-6 mt-2 space-y-1"><li>Оберіть дату та мову</li><li>Зареєструйтесь онлайн</li><li>Оплатіть навчання</li><li>Ваше місце зарезервовано</li></ol></>) },
            { id: 'b2c-10', question: 'Чи можу я заплатити готівкою в день курсу?', answer: (<>Ні. Оплата онлайн. Готівка лише за попередньою домовленістю.</>) },
            { id: 'b2c-11', question: 'Чи можу я скасувати безкоштовно?', answer: (<>Так, до 7 днів до початку курсу.</>) },
            { id: 'b2c-12', question: 'Чи дійсні права на навантажувач по всій Німеччині?', answer: (<>Так. Дійсні по всій Німеччині відповідно до DGUV.</>) },
            { id: 'b2c-13', question: 'Чи ви співпрацюєте з Jobcenter?', answer: (<>Ні. Ми не приймаємо освітні ваучери.</>) },
            { id: 'b2c-14', question: 'Чи можу я отримати питання іспиту заздалегідь?', answer: (<>Ні. Вони офіційні. Для підготовки рекомендуємо наш онлайн-курс теорії.</>) },
            { id: 'b2c-15', question: 'Чи проводите ви навчання також у Берліні та Гьорліц?', answer: (<>Так. Практичні заняття регулярно проходять у Берліні та у Гьорліц / Згожелець, ідеально для німецько-польського прикордоння. Інші локації, напр. Мюнхен, дивіться на нашій <a href="/kursy" className="text-primary underline">сторінці курсів</a>.</>) },
        ],
    };
    return data[lang] ?? data['de'];
};

// Języki szkolenia — nazwy własne (endonimy), więc nie zależą od wybranego języka strony
const HERO_LANGUAGES: { code: FlagCode; name: string }[] = [
    { code: 'DE', name: 'Deutsch' },
    { code: 'EN', name: 'English' },
    { code: 'PL', name: 'Polski' },
    { code: 'UK', name: 'Українська' },
    { code: 'RU', name: 'Русский' },
    { code: 'RO', name: 'Română' },
];

// Profile społecznościowe (sekcja "Folgen Sie uns")
const SOCIAL_LINKS = [
    { label: 'Facebook', href: 'https://www.facebook.com/Staplero', Icon: Facebook },
    { label: 'Instagram', href: 'https://www.instagram.com/staplero.ig/', Icon: Instagram },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/company/staplero/', Icon: Linkedin },
];

// Program kursu — kolejność = curriculum.item1..7
const CURRICULUM_KEYS = ['item1', 'item2', 'item3', 'item4', 'item5', 'item6', 'item7'];

// ─── Component ────────────────────────────────────────────────────────────────
const Index = () => {
    const { toast } = useToast();
    const { t, language } = useLanguage();
    const [contactForm, setContactForm] = useState({ name: "", email: "", phone: "", company: "", message: "", website: "" });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [faqCustomerType, setFaqCustomerType] = useState('b2b');
    const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
    const formLoadedAtRef = useRef(Date.now());

    useEffect(() => {
        getProducts({ featured: true })
            .then((data) => setFeaturedProducts(data.products))
            .catch((err) => console.error("Fehler beim Laden der Kurse:", err));
    }, []);

    useEffect(() => {
        if (!document.querySelector('script[src*="elfsight"]')) {
            const script = document.createElement('script');
            script.src = 'https://static.elfsight.com/platform/platform.js';
            script.defer = true;
            document.body.appendChild(script);
        }
    }, []);

    const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY as string | undefined;

    useEffect(() => {
        if (!RECAPTCHA_SITE_KEY) return; // klucz nieskonfigurowany - pomijamy ładowanie skryptu
        if (document.querySelector('script[src*="recaptcha/api.js"]')) return;
        const script = document.createElement('script');
        script.src = `https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`;
        script.async = true;
        document.body.appendChild(script);
    }, [RECAPTCHA_SITE_KEY]);

    // Pobiera token reCAPTCHA v3 (niewidoczny dla użytkownika) tuż przed wysłaniem formularza.
    const getRecaptchaToken = async (): Promise<string> => {
        if (!RECAPTCHA_SITE_KEY || !window.grecaptcha) return "";
        return new Promise((resolve) => {
            window.grecaptcha!.ready(async () => {
                try {
                    const token = await window.grecaptcha!.execute(RECAPTCHA_SITE_KEY, { action: 'contact' });
                    resolve(token);
                } catch {
                    resolve("");
                }
            });
        });
    };

    const handleContactSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const recaptchaToken = await getRecaptchaToken();
            const response = await fetch(`${API_URL}/contact`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...contactForm, formRenderedAt: formLoadedAtRef.current, recaptchaToken }),
            });
            const data = await response.json();
            if (response.ok) {
                toast({ title: t('contact.successTitle'), description: t('contact.successDesc') });
                setContactForm({ name: "", email: "", phone: "", company: "", message: "", website: "" });
            } else {
                throw new Error(data.error || 'Failed');
            }
        } catch {
            toast({ title: t('contact.errorTitle'), description: t('contact.errorDesc'), variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const currentFaqs = faqCustomerType === 'b2b' ? getB2bFaqs(language) : getB2cFaqs(language);

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            {/* ── Hero ─────────────────────────────────────────────────────── */}
            <section className="relative overflow-hidden bg-industrial lg:min-h-[680px] flex flex-col lg:justify-center">
                {/* Pasek na mobile — zdjęcie jako baner na górze */}
                <div className="lg:hidden relative h-60 sm:h-72">
                    <img src={heroImage} alt="Staplerschein Ausbildung: Fahrer im Gabelstapler" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-industrial via-industrial/20 to-industrial/40" />
                </div>

                {/* Desktop — pełne, kinowe zdjęcie z prawej, przenikające w ciemne tło (jak na mobile) */}
                <div className="hidden lg:block absolute inset-y-0 right-0 w-[60%]">
                    <img src={heroImage} alt="Staplerschein Ausbildung: Fahrer im Gabelstapler" className="w-full h-full object-cover" />
                    <div
                        className="absolute inset-0"
                        style={{
                            background: "linear-gradient(to right, hsl(var(--industrial)) 0%, hsl(var(--industrial)) 8%, hsl(var(--industrial) / 0.75) 24%, hsl(var(--industrial) / 0.25) 46%, transparent 64%)",
                        }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-industrial/60 via-transparent to-industrial/10" />
                    <div className="absolute inset-0 bg-primary/[0.08] mix-blend-multiply" />
                </div>

                <Blob tone="primary" className="w-[30rem] h-[30rem] -bottom-56 -left-40 hidden lg:block" />

                <div className="relative container mx-auto px-4 py-12 sm:py-16 lg:py-28">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">

                        {/* ── Treść ─────────────────────────────────────────── */}
                        <div className="relative z-10">
                            <div className="inline-flex items-center gap-2 text-primary mb-5 animate-fade-in">
                                <Shield className="w-4 h-4" />
                                <span className="text-xs font-semibold tracking-widest uppercase">{t('hero.badge')}</span>
                            </div>

                            <h1 className="font-display text-5xl sm:text-6xl lg:text-8xl font-extrabold text-primary-foreground mb-6 leading-[0.92] animate-fade-in" style={{ animationDelay: "0.1s" }}>
                                {t('hero.headline')}
                                <span className="text-gradient block">{t('hero.subheadline')}</span>
                            </h1>

                            <p className="text-lg text-primary-foreground/75 mb-8 max-w-lg animate-fade-in" style={{ animationDelay: "0.15s" }}>
                                {t('hero.description')}
                            </p>

                            {/* ── Języki szkolenia — najważniejsza informacja: kod + nazwa w danym języku ── */}
                            <div className="mb-8 animate-fade-in" style={{ animationDelay: "0.2s" }}>
                                <p className="flex items-center gap-2 text-sm font-semibold text-primary-foreground mb-3">
                                    <Languages className="w-4 h-4 text-primary" aria-hidden />
                                    {t('hero.languageBadge')}
                                </p>
                                {/* Siatka 2 kolumny (mobile) / 3 kolumny (desktop) → zawsze równe rzędy, bez "sierot" */}
                                <ul className="grid max-w-lg grid-cols-2 gap-2 sm:grid-cols-3">
                                    {HERO_LANGUAGES.map((l) => (
                                        <li
                                            key={l.code}
                                            className="flex items-center gap-2.5 rounded-lg border border-primary-foreground/20 bg-primary-foreground/5 px-4 py-2.5"
                                        >
                                            <Flag code={l.code} />
                                            <span lang={l.code.toLowerCase()} className="truncate text-sm font-medium text-primary-foreground">{l.name}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Dwa przyciski tej samej wielkości: 1 kolumna na mobile, 2 równe kolumny od sm */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mb-10 animate-fade-in" style={{ animationDelay: "0.25s" }}>
                                <Link to="/kursy" className="block">
                                    <Button variant="hero" size="xl" className="w-full"><CalendarCheck className="w-5 h-5" />{t('hero.ctaCourses')}</Button>
                                </Link>
                                <Link to="/firmenschulung-berlin" className="block">
                                    <Button variant="outline" size="xl" className="w-full border-primary-foreground/30 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20">
                                        <Building2 className="w-5 h-5" />{t('hero.ctaB2B')}
                                    </Button>
                                </Link>
                            </div>

                            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-primary-foreground/70 animate-fade-in" style={{ animationDelay: "0.3s" }}>
                                <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-primary" />{t('hero.stat48h')}</span>
                                <span className="hidden sm:inline text-primary-foreground/20">•</span>
                                <span className="flex items-center gap-1.5"><Award className="w-4 h-4 text-primary" />{t('hero.statValid')}</span>
                                <span className="hidden sm:inline text-primary-foreground/20">•</span>
                                <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-primary" />{t('hero.statStudents')}</span>
                            </div>
                        </div>

                        {/* dystans w gridzie — zdjęcie widoczne jest jako tło pełnej sekcji powyżej */}
                        <div className="hidden lg:block" aria-hidden />
                    </div>
                </div>
            </section>

            {/* ── Services ─────────────────────────────────────────────────── */}
            <section className="relative py-24 bg-muted/50 overflow-hidden">
                <Blob tone="primary" className="w-[36rem] h-[36rem] -top-40 -left-40" />
                <Blob tone="accent" className="w-96 h-96 bottom-0 right-0" />
                <div className="container mx-auto px-4 relative">
                    <div className="text-center mb-16">
                        <h2 className="font-display text-4xl md:text-6xl font-extrabold text-foreground mb-4">
                            {t('services.title')} <span className="text-primary">{t('services.titleHighlight')}</span>
                        </h2>
                        <p className="text-muted-foreground max-w-2xl mx-auto">{t('services.subtitle')}</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
                        {[
                            { Icon: MonitorPlay, title: t('services.onlineTheory'), desc: t('services.onlineTheoryDesc'), span: "md:col-span-4" },
                            { Icon: Presentation, title: t('services.presenceTheory'), desc: t('services.presenceTheoryDesc'), span: "md:col-span-2" },
                            { Icon: IconForklift, title: t('services.practicalTraining'), desc: t('services.practicalTrainingDesc'), span: "md:col-span-2" },
                            { Icon: CalendarCheck, title: t('services.annualBriefing'), desc: t('services.annualBriefingDesc'), span: "md:col-span-4" },
                        ].map((s, i) => (
                            <Card
                                key={i}
                                className={cn(
                                    "card-hover border-border overflow-hidden",
                                    s.span,
                                    i % 2 === 0 ? "rounded-none" : "rounded-none"
                                )}
                            >
                                <CardContent className="pt-6 flex items-start gap-4">
                                    <SealBadge tone={i % 2 === 0 ? "primary" : "dark"} rotate={i % 2 === 0 ? -6 : 5}>
                                        <s.Icon className="w-6 h-6 text-primary-foreground" />
                                    </SealBadge>
                                    <div>
                                        <h3 className="font-semibold text-foreground mb-2">{s.title}</h3>
                                        <p className="text-sm text-muted-foreground">{s.desc}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Why Choose Us ────────────────────────────────────────────── */}
            <section id="features" className="relative py-24 bg-background overflow-hidden">
                <RackTexture className="text-foreground" />
                <div className="container mx-auto px-4 relative">
                    <div className="text-center mb-16">
                        <h2 className="font-display text-4xl md:text-6xl font-extrabold text-foreground mb-4">
                            {t('why.title')} <span className="text-primary">{t('why.titleHighlight')}</span>?
                        </h2>
                        <p className="text-muted-foreground max-w-2xl mx-auto">{t('why.subtitle')}</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            { Icon: BadgeCheck, title: t('why.recognized'), desc: t('why.recognizedDesc') },
                            { Icon: GraduationCap, title: t('why.professional'), desc: t('why.professionalDesc') },
                            { Icon: Zap, title: t('why.fast'), desc: t('why.fastDesc') },
                            { Icon: Receipt, title: t('why.transparent'), desc: t('why.transparentDesc') },
                        ].map((w, i) => (
                            <div key={i} className="text-center">
                                <SealBadge size="lg" tone={i % 2 === 0 ? "primary" : "dark"} rotate={i % 2 === 0 ? 4 : -4} className="mx-auto mb-4">
                                    <w.Icon className="w-9 h-9 text-primary-foreground" />
                                </SealBadge>
                                <h3 className="font-semibold text-foreground mb-2">{w.title}</h3>
                                <p className="text-sm text-muted-foreground">{w.desc}</p>
                            </div>
                        ))}
                    </div>
                    <div className="relative mt-16 bg-gradient-hero rounded-none p-8 md:p-12 text-center overflow-hidden">
                        <Blob tone="accent" className="w-72 h-72 -top-20 -right-20" />
                        <h3 className="relative font-display text-2xl md:text-3xl font-bold text-primary-foreground mb-4">{t('why.guaranteeTitle')}</h3>
                        <p className="relative text-primary-foreground/80 text-lg max-w-2xl mx-auto">{t('why.guaranteeText')}</p>
                    </div>
                </div>
            </section>

            {/* ── What We Offer ────────────────────────────────────────────── */}
            <section className="relative py-24 bg-muted/50 overflow-hidden">
                <Blob tone="dark" className="w-[30rem] h-[30rem] top-1/2 -translate-y-1/2 -right-32" />
                <div className="container mx-auto px-4 relative">
                    <div className="text-center mb-16">
                        <h2 className="font-display text-4xl md:text-6xl font-extrabold text-foreground mb-4">
                            {t('offer.title')} <span className="text-primary">{t('offer.titleHighlight')}</span>
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10">
                        {[
                            { title: t('offer.intensiveCourse'), desc: t('offer.intensiveCourseDesc'), Icon: Timer },
                            { title: t('offer.inhouse'), desc: t('offer.inhouseDesc'), Icon: Building2 },
                            { title: t('offer.annualBriefings'), desc: t('offer.annualBriefingsDesc'), Icon: CalendarCheck },
                            { title: t('offer.multilingual'), desc: t('offer.multilingualDesc'), Icon: Languages },
                            { title: t('offer.reachTruck'), desc: t('offer.reachTruckDesc'), Icon: IconForklift },
                            { title: t('offer.certified'), desc: t('offer.certifiedDesc'), Icon: Award },
                        ].map((item, i) => (
                            <div key={i} className="flex items-start gap-4">
                                <SealBadge size="sm" tone={i % 2 === 0 ? "primary" : "dark"} rotate={i % 2 === 0 ? -5 : 5}>
                                    <item.Icon className="w-5 h-5 text-primary-foreground" />
                                </SealBadge>
                                <div>
                                    <h4 className="font-semibold text-foreground mb-1">{item.title}</h4>
                                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Curriculum ───────────────────────────────────────────────── */}
            {/* Siatka kafli zamiast pionowej listy: 2 kolumny na mobile, 4 na desktopie.
                7 punktów programu + kafel ze zdjęciem = 8 komórek, więc siatka zawsze zamyka się równo. */}
            <section className="py-16 md:py-24 bg-background">
                <div className="container mx-auto px-4">
                    <div className="max-w-2xl mb-10 md:mb-14">
                        <span className="inline-block text-xs font-semibold tracking-widest uppercase text-primary mb-3">
                            {t('curriculum.eyebrow')}
                        </span>
                        <h2 className="font-display text-4xl md:text-6xl font-extrabold text-foreground mb-4">{t('curriculum.title')}</h2>
                        <p className="text-muted-foreground max-w-md">{t('curriculum.subtitle')}</p>
                    </div>

                    <ol className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-border border border-border">
                        {CURRICULUM_KEYS.map((key, i) => (
                            <li
                                key={key}
                                className="relative flex items-center justify-center overflow-hidden bg-background px-4 py-6 min-h-[168px] sm:min-h-[220px] text-center transition-colors hover:bg-secondary"
                            >
                                {/* Duża cyfra w tle — dekoracja, treść to tytuł */}
                                <span
                                    className="pointer-events-none absolute inset-0 flex select-none items-center justify-center font-display text-[9rem] sm:text-[12rem] font-extrabold leading-none text-foreground/[0.09]"
                                    aria-hidden
                                >
                                    {i + 1}
                                </span>
                                <h3 className="relative text-xl sm:text-2xl font-bold leading-tight text-foreground">
                                    {t(`curriculum.${key}`)}
                                </h3>
                            </li>
                        ))}
                        <li className="relative min-h-[168px] sm:min-h-[220px] overflow-hidden bg-industrial" aria-hidden>
                            <img src={trainingImage} alt="" className="absolute inset-0 h-full w-full object-cover" />
                        </li>
                    </ol>
                </div>
            </section>

            {/* ── Galerie / Social ─────────────────────────────────────────── */}
            <section className="relative py-24 bg-muted/50 overflow-hidden">
                <RackTexture className="text-foreground" />
                <div className="container mx-auto px-4 relative">
                    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
                        <div>
                            <span className="inline-block text-xs font-semibold tracking-widest uppercase text-primary mb-3">
                                {t('gallery.eyebrow')}
                            </span>
                            <h2 className="font-display text-4xl md:text-6xl font-extrabold text-foreground">
                                {t('gallery.title')}
                            </h2>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-muted-foreground">{t('gallery.followUs')}</span>
                            {SOCIAL_LINKS.map(({ label, href, Icon }) => (
                                <a
                                    key={label}
                                    href={href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={label}
                                    title={label}
                                    className="w-10 h-10 rounded-lg border border-border bg-card flex items-center justify-center text-foreground transition-colors hover:bg-primary hover:border-primary hover:text-[hsl(var(--on-primary))]"
                                >
                                    <Icon className="w-4 h-4" />
                                </a>
                            ))}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="col-span-1 row-span-2 aspect-[3/4] rounded-none overflow-hidden shadow-lg">
                            <img src={heroImage} alt="Staplerfahrer bei der praktischen Ausbildung" className="w-full h-full object-cover" />
                        </div>
                        <div className="aspect-square rounded-none overflow-hidden shadow-lg">
                            <img src={warehouseImage} alt="Lagerhalle Staplerschein Görlitz" className="w-full h-full object-cover" />
                        </div>
                        <div className="aspect-square overflow-hidden">
                            <img src={controlsImage} alt="Bedienelemente Gabelstapler Detailansicht" className="w-full h-full object-cover" />
                        </div>
                        <div className="col-span-2 md:col-span-1 md:row-span-2 aspect-video md:aspect-auto rounded-none overflow-hidden shadow-lg">
                            <img src={trainingImage} alt="Theorieunterricht Staplerschein Berlin" className="w-full h-full object-cover" />
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Reviews ──────────────────────────────────────────────────── */}
            <section className="py-24 bg-background">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <div className="flex items-center justify-center gap-2 mb-4">
                            <div className="flex">{[1,2,3,4,5].map(s => <Star key={s} className="w-6 h-6 fill-yellow-400 text-yellow-400" />)}</div>
                            <span className="text-2xl font-bold text-foreground">5.0</span>
                        </div>
                        <h2 className="font-display text-4xl md:text-6xl font-extrabold text-foreground mb-4">
                            {t('reviews.title')} <span className="text-primary">{t('reviews.titleHighlight')}</span>
                        </h2>
                        <p className="text-muted-foreground">{t('reviews.subtitle')}</p>
                    </div>
                    <div className="max-w-6xl mx-auto">
                        <div className="elfsight-app-b30716be-90bb-4210-9725-e9d6afd1e735" data-elfsight-app-lazy></div>
                        <div className="text-center py-12 text-muted-foreground">
                            <p className="text-sm">
                                <a href="https://share.google/jEXeXAffDcGwnq8Qj" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                    {t('reviews.viewAll')}
                                </a>
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── B2B ──────────────────────────────────────────────────────── */}
            <section id="b2b" className="py-24 bg-gradient-hero">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <div className="inline-flex items-center gap-2 bg-primary-foreground/10 px-4 py-2 rounded-lg mb-6">
                                <Building2 className="w-4 h-4 text-primary-foreground" />
                                <span className="text-sm font-medium text-primary-foreground">{t('b2b.badge')}</span>
                            </div>
                            <h2 className="font-display text-4xl md:text-6xl font-extrabold text-primary-foreground mb-6">{t('b2b.title')}</h2>
                            <p className="text-primary-foreground/80 mb-8">{t('b2b.subtitle')}</p>
                            <div className="space-y-4">
                                {['benefit1','benefit2','benefit3','benefit4','benefit5','benefit6'].map((k, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <div className="w-5 h-5 rounded-full bg-primary-foreground flex items-center justify-center shrink-0">
                                            <Check className="w-3 h-3 text-primary" />
                                        </div>
                                        <span className="text-primary-foreground/90">{t(`b2b.${k}`)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="relative bg-primary-foreground/10 backdrop-blur-sm rounded-none p-8 border border-primary-foreground/20 overflow-hidden">
                            <Blob tone="primary" className="w-56 h-56 -bottom-16 -left-16 opacity-[0.12]" />
                            <h3 className="relative font-display text-xl font-semibold text-primary-foreground mb-6">{t('b2b.questionsTitle')}</h3>
                            <div className="relative space-y-4">
                                {[
                                    { Icon: UserCheck, key: 'q1' },
                                    { Icon: CalendarCheck, key: 'q2' },
                                    { Icon: IconForklift, key: 'q3' },
                                ].map((q, i) => (
                                    <div key={i} className="flex items-start gap-3">
                                        <SealBadge size="sm" tone="dark" rotate={i % 2 === 0 ? -6 : 6} className="bg-transparent">
                                            <q.Icon className="w-4 h-4 text-primary-foreground" />
                                        </SealBadge>
                                        <p className="text-primary-foreground/80 text-sm pt-2.5">{t(`b2b.${q.key}`)}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="mt-12 text-center">
                        <a href="#contact">
                            <Button size="xl" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 text-lg px-12 py-6 h-auto">
                                <Send className="w-6 h-6 mr-3" />{t('b2b.cta')}
                            </Button>
                        </a>
                        <p className="mt-5">
                            <Link to="/firmenschulung-berlin" className="text-primary-foreground/80 underline underline-offset-4 hover:text-primary">
                                Firmenschulung in Berlin: alle Details
                            </Link>
                        </p>
                    </div>
                </div>
            </section>

            {/* ── Pricing ──────────────────────────────────────────────────── */}
            <section id="pricing" className="py-24 bg-background">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="font-display text-4xl md:text-6xl font-extrabold text-foreground mb-4">{t('pricing.title')}</h2>
                        <p className="text-muted-foreground max-w-2xl mx-auto">{t('pricing.subtitle')}</p>
                    </div>
                    {featuredProducts.length > 0 ? (
                        <Carousel opts={{ align: "start", loop: false }} className="w-full max-w-5xl mx-auto">
                            <CarouselContent className="-ml-2 md:-ml-4">
                                {featuredProducts.map((product) => (
                                    <CarouselItem key={product._id} className="pl-2 md:pl-4 basis-[85%] md:basis-1/2 lg:basis-1/3">
                                        <ProductCard product={product} />
                                    </CarouselItem>
                                ))}
                            </CarouselContent>
                            <CarouselPrevious className="hidden md:flex -left-12" />
                            <CarouselNext className="hidden md:flex -right-12" />
                        </Carousel>
                    ) : (
                        <p className="text-center text-muted-foreground">{t('pricing.comingSoon')}</p>
                    )}
                    <div className="text-center mt-8">
                        <Link to="/kursy">
                            <Button variant="outline" size="lg">
                                {t('products.viewAll') || 'Alle Kurse ansehen'}
                            </Button>
                        </Link>
                    </div>
                    <div className="flex justify-center gap-2 mt-6 md:hidden">
                        <div className="w-2.5 h-2.5 rounded-full bg-primary"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/30"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/30"></div>
                    </div>
                    <p className="text-center text-muted-foreground text-xs mt-3 md:hidden">{t('pricing.swipeHint')}</p>
                </div>
            </section>

            {/* ── Contact ──────────────────────────────────────────────────── */}
            <section id="contact" className="py-24 bg-muted/50">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        <div>
                            <h2 className="font-display text-4xl md:text-6xl font-extrabold text-foreground mb-6">{t('contact.title')}</h2>
                            <p className="text-muted-foreground mb-8">{t('contact.subtitle')}</p>
                            <div className="space-y-6">
                                {[
                                    { icon: <Phone className="w-5 h-5 text-primary-foreground" />, label: t('contact.phone'), value: '+49 176 22067783' },
                                    { icon: <Mail className="w-5 h-5 text-primary-foreground" />, label: t('contact.email'), value: 'info@staplero.com' },
                                    { icon: <IconPin className="w-5 h-5 text-primary-foreground" />, label: t('contact.locations'), value: 'Berlin, Görlitz/Zgorzelec, München' },
                                ].map((c, i) => (
                                    <div key={i} className="flex items-center gap-4">
                                        <SealBadge tone={i % 2 === 0 ? "primary" : "dark"} rotate={i % 2 === 0 ? -5 : 5}>{c.icon}</SealBadge>
                                        <div>
                                            <p className="text-sm text-muted-foreground">{c.label}</p>
                                            <p className="font-medium text-foreground">{c.value}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('contact.formTitle')}</CardTitle>
                                <CardDescription>{t('contact.formSubtitle')}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleContactSubmit} className="space-y-4">
                                    {/* Honeypot — niewidoczne dla ludzi pole, boty często je wypełniają */}
                                    <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }} aria-hidden="true">
                                        <label htmlFor="contact-website">Website</label>
                                        <input
                                            id="contact-website"
                                            name="website"
                                            type="text"
                                            tabIndex={-1}
                                            autoComplete="off"
                                            value={contactForm.website}
                                            onChange={e => setContactForm(p => ({ ...p, website: e.target.value }))}
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="contact-name">{t('contact.name')}</Label>
                                            <Input id="contact-name" value={contactForm.name} onChange={e => setContactForm(p => ({ ...p, name: e.target.value }))} placeholder={t('contact.namePlaceholder')} required />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="contact-email">{t('contact.emailLabel')}</Label>
                                            <Input id="contact-email" type="email" value={contactForm.email} onChange={e => setContactForm(p => ({ ...p, email: e.target.value }))} placeholder={t('contact.emailPlaceholder')} required />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="contact-phone">{t('contact.phone')}</Label>
                                            <Input id="contact-phone" value={contactForm.phone} onChange={e => setContactForm(p => ({ ...p, phone: e.target.value }))} placeholder={t('contact.phonePlaceholder')} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="contact-company">{t('contact.company')}</Label>
                                            <Input id="contact-company" value={contactForm.company} onChange={e => setContactForm(p => ({ ...p, company: e.target.value }))} placeholder={t('contact.companyPlaceholder')} />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="contact-message">{t('contact.message')}</Label>
                                        <Textarea id="contact-message" value={contactForm.message} onChange={e => setContactForm(p => ({ ...p, message: e.target.value }))} placeholder={t('contact.messagePlaceholder')} rows={4} required />
                                    </div>
                                    <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                                        {isSubmitting ? t('contact.sending') : (<><Send className="w-4 h-4 mr-2" />{t('contact.send')}</>)}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>

            {/* ── FAQ ──────────────────────────────────────────────────────── */}
            <section className="py-24 bg-background">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="font-display text-4xl md:text-6xl font-extrabold text-foreground mb-4">
                            {t('faq.title')} <span className="text-primary">{t('faq.titleHighlight')}</span>
                        </h2>
                        <p className="text-muted-foreground max-w-2xl mx-auto mb-8">{t('faq.subtitle')}</p>
                        <div className="inline-flex items-center gap-2 p-1 bg-muted rounded-lg">
                            <button onClick={() => setFaqCustomerType('b2b')} className={`px-6 py-2.5 rounded-lg font-medium transition-all duration-300 ${faqCustomerType === 'b2b' ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:text-foreground'}`}>
                                {t('faq.forCompanies')}
                            </button>
                            <button onClick={() => setFaqCustomerType('b2c')} className={`px-6 py-2.5 rounded-lg font-medium transition-all duration-300 ${faqCustomerType === 'b2c' ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:text-foreground'}`}>
                                {t('faq.forPrivate')}
                            </button>
                        </div>
                    </div>
                    <div className="max-w-4xl mx-auto">
                        <Accordion type="single" collapsible className="w-full space-y-4">
                            {currentFaqs.map(faq => (
                                <AccordionItem key={faq.id} value={faq.id} className="border rounded-lg px-6">
                                    <AccordionTrigger className="text-left hover:no-underline">
                                        <span className="font-semibold">{faq.question}</span>
                                    </AccordionTrigger>
                                    <AccordionContent className="text-muted-foreground">{faq.answer}</AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </div>
                </div>
            </section>

            {/* ── CTA ──────────────────────────────────────────────────────── */}
            <section className="py-24 bg-gradient-hero">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="font-display text-4xl md:text-6xl font-extrabold text-primary-foreground mb-6">{t('cta.title')}</h2>
                    <p className="text-primary-foreground/80 max-w-2xl mx-auto mb-8">{t('cta.subtitle')}</p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link to="/kursy">
                            <Button variant="hero" size="xl">{t('nav.courses')}<ChevronRight className="w-5 h-5" /></Button>
                        </Link>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default Index;
