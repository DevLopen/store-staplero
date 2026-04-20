import { useLanguage } from "@/contexts/LanguageContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const content = {
  de: {
    title: "Allgemeine Geschäftsbedingungen (AGB)",
    lastUpdated: "Stand: Januar 2025",
    sections: [
      {
        heading: "§ 1 Geltungsbereich",
        text: `Diese Allgemeinen Geschäftsbedingungen gelten für alle Verträge, die zwischen STAPLERO (nachfolgend „Anbieter") und dem Kunden (nachfolgend „Teilnehmer") über die Nutzung der Online-Lernplattform sowie die Buchung von Präsenz- und Praxiskursen geschlossen werden.\n\nMaßgeblich ist die zum Zeitpunkt der Bestellung gültige Fassung der AGB. Entgegenstehende oder abweichende Geschäftsbedingungen des Teilnehmers werden nicht anerkannt.`,
      },
      {
        heading: "§ 2 Leistungsbeschreibung",
        text: `Der Anbieter stellt folgende Leistungen bereit:\n\n• Online-Theoriekurs: Zugang zur digitalen Lernplattform für eine Dauer von 30 Tagen ab Kaufdatum. Der Kurs umfasst alle Kapitel, Lernmaterialien, interaktive Übungen und einen Abschlusstest gemäß DGUV Vorschrift 68.\n\n• Präsenz-Theoriekurs: Theoretische Ausbildung vor Ort mit erfahrenem Ausbilder an einem der angebotenen Standorte.\n\n• Praxiskurs (Praktische Ausbildung): 16-stündige Ausbildung an zwei Tagen, inklusive Theorieblock, Fahrpraxis auf dem Trainingsgelände sowie theoretischer und praktischer Abschlussprüfung. Bei Bestehen der Prüfung erhält der Teilnehmer einen allgemein gültigen Staplerschein (Fahrausweis) gemäß DGUV Vorschrift 68 und Grundsatz 308-001.`,
      },
      {
        heading: "§ 3 Vertragsschluss",
        text: `Die Darstellung der Kurse auf der Website stellt kein rechtlich bindendes Angebot dar, sondern eine Aufforderung zur Abgabe eines Angebots (invitatio ad offerendum).\n\nDurch Abschluss des Bestellvorgangs und Klick auf die Schaltfläche „Jetzt bezahlen" gibt der Teilnehmer ein verbindliches Angebot zum Abschluss eines Vertrages ab. Die Annahme erfolgt durch eine Bestätigungs-E-Mail oder durch Bereitstellung des Kurszugangs bzw. Bestätigung des gebuchten Termins.`,
      },
      {
        heading: "§ 4 Preise und Zahlung",
        text: `Alle angegebenen Preise sind Nettopreise zuzüglich der gesetzlichen Umsatzsteuer von derzeit 19 %.\n\nDie Zahlung erfolgt ausschließlich über die angebotenen Zahlungsmittel (Kreditkarte, SEPA-Lastschrift, weitere Methoden gemäß Checkout). Die Zahlung ist sofort mit Abschluss der Bestellung fällig. Der Zugang zum Online-Kurs bzw. die Terminbestätigung für den Präsenz-/Praxiskurs wird erst nach vollständigem Zahlungseingang freigeschaltet.`,
      },
      {
        heading: "§ 5 Widerrufsrecht",
        text: `Verbrauchern steht grundsätzlich ein 14-tägiges Widerrufsrecht zu.\n\nAusnahme: Das Widerrufsrecht erlischt bei digitalen Inhalten (Online-Theoriekurs), wenn der Teilnehmer ausdrücklich zugestimmt hat, dass mit der Ausführung des Vertrages vor Ablauf der Widerrufsfrist begonnen wird, und er zur Kenntnis genommen hat, dass er dadurch sein Widerrufsrecht verliert (§ 356 Abs. 5 BGB).\n\nFür Präsenz- und Praxiskurse, bei denen ein konkreter Termin gebucht wird, erlischt das Widerrufsrecht, wenn der Termin innerhalb der 14-tägigen Widerrufsfrist liegt oder wenn der Teilnehmer ausdrücklich auf das Widerrufsrecht verzichtet hat. Eine kostenfreie Stornierung des Termins ist bis 7 Tage vor Kursbeginn möglich. Bei späteren Stornierungen ist der volle Kurspreis zu entrichten. Eine Umbuchung auf einen anderen Termin ist einmalig bis 5 Tage vor Kursbeginn kostenfrei möglich.`,
      },
      {
        heading: "§ 6 Pflichten des Teilnehmers",
        text: `Der Teilnehmer verpflichtet sich:\n\n• Korrekte Angaben bei der Registrierung zu machen;\n• Zugangsdaten zur Lernplattform nicht an Dritte weiterzugeben;\n• Am Kurs persönlich und nüchtern teilzunehmen;\n• Die Anweisungen der Ausbilder während der Praxis zu befolgen;\n• Schutzausrüstung gemäß Vorgabe des Ausbilders zu tragen;\n• Schäden am Schulungsfahrzeug oder am Gelände, die auf grobe Fahrlässigkeit oder Vorsatz zurückzuführen sind, zu ersetzen.`,
      },
      {
        heading: "§ 7 Prüfung und Zertifikat",
        text: `Am Ende des Praxiskurses findet eine theoretische und praktische Prüfung statt. Bei Bestehen erhält der Teilnehmer:\n\n• Einen Fahrausweis (Staplerschein) im Scheckkartenformat (optional, gegen Aufpreis) oder als Ausdruck;\n• Ein Zertifikat gemäß DGUV Grundsatz 308-001.\n\nBei Nichtbestehen der Prüfung kann eine Nachprüfung gegen ein gesondertes Entgelt vereinbart werden. Ein Anspruch auf Bestehen der Prüfung besteht nicht.`,
      },
      {
        heading: "§ 8 Haftung",
        text: `Der Anbieter haftet unbeschränkt für Schäden aus der Verletzung des Lebens, des Körpers oder der Gesundheit sowie für vorsätzlich oder grob fahrlässig verursachte Schäden.\n\nFür leicht fahrlässig verursachte Schäden haftet der Anbieter nur bei Verletzung einer wesentlichen Vertragspflicht (Kardinalpflicht), und zwar begrenzt auf den vorhersehbaren, vertragstypischen Schaden.\n\nIm Übrigen ist die Haftung des Anbieters ausgeschlossen. Die Haftung nach dem Produkthaftungsgesetz bleibt unberührt.`,
      },
      {
        heading: "§ 9 Datenschutz",
        text: `Die Erhebung und Verarbeitung personenbezogener Daten erfolgt gemäß unserer Datenschutzerklärung, die unter „Datenschutz" auf unserer Website abrufbar ist.`,
      },
      {
        heading: "§ 10 Schlussbestimmungen",
        text: `Es gilt das Recht der Bundesrepublik Deutschland. Für Verbraucher mit Wohnsitz in einem anderen EU-Mitgliedstaat gelten zusätzlich die zwingenden Verbraucherschutzvorschriften dieses Staates.\n\nGerichtsstand für Kaufleute und juristische Personen des öffentlichen Rechts ist der Sitz des Anbieters.\n\nSollten einzelne Bestimmungen dieser AGB unwirksam sein oder werden, bleibt die Wirksamkeit der übrigen Bestimmungen unberührt.`,
      },
    ],
  },
  en: {
    title: "General Terms and Conditions (GTC)",
    lastUpdated: "As of: January 2025",
    sections: [
      {
        heading: "§ 1 Scope",
        text: `These General Terms and Conditions apply to all contracts concluded between STAPLERO (hereinafter "Provider") and the customer (hereinafter "Participant") regarding the use of the online learning platform and the booking of classroom and practical courses.\n\nThe version of the GTC valid at the time of the order shall apply. Conflicting or deviating terms and conditions of the Participant shall not be recognized.`,
      },
      {
        heading: "§ 2 Service Description",
        text: `The Provider offers the following services:\n\n• Online Theory Course: Access to the digital learning platform for 30 days from the date of purchase. The course includes all chapters, learning materials, interactive exercises and a final test in accordance with DGUV Regulation 68.\n\n• Classroom Theory Course: Theoretical training on-site with an experienced instructor at one of the offered locations.\n\n• Practical Course: 16-hour training over two days, including a theory block, driving practice on the training ground, and a theoretical and practical final examination. Upon passing the exam, the Participant receives a universally valid forklift license in accordance with DGUV Regulation 68 and Principle 308-001.`,
      },
      {
        heading: "§ 3 Conclusion of Contract",
        text: `The presentation of courses on the website does not constitute a legally binding offer but an invitation to submit an offer (invitatio ad offerendum).\n\nBy completing the ordering process and clicking the "Pay Now" button, the Participant submits a binding offer to conclude a contract. Acceptance occurs via a confirmation email or by providing access to the course or confirming the booked appointment.`,
      },
      {
        heading: "§ 4 Prices and Payment",
        text: `All stated prices are net prices plus the statutory VAT of currently 19%.\n\nPayment is made exclusively via the offered payment methods (credit card, SEPA direct debit, further methods as indicated in the checkout). Payment is due immediately upon completion of the order. Access to the online course or confirmation of the classroom/practical course appointment will only be activated after full receipt of payment.`,
      },
      {
        heading: "§ 5 Right of Withdrawal",
        text: `Consumers generally have a 14-day right of withdrawal.\n\nException: The right of withdrawal for digital content (online theory course) expires if the Participant has expressly agreed that performance of the contract begins before the expiry of the withdrawal period, and has acknowledged that they thereby lose their right of withdrawal.\n\nFor classroom and practical courses with a specific booked appointment, the right of withdrawal expires if the appointment falls within the 14-day withdrawal period or if the Participant has expressly waived the right of withdrawal. Free cancellation of the appointment is possible up to 7 days before the start of the course. For later cancellations, the full course price is payable. A free rebooking to another date is possible once up to 5 days before the course begins.`,
      },
      {
        heading: "§ 6 Participant Obligations",
        text: `The Participant undertakes:\n\n• To provide correct information during registration;\n• Not to share login credentials with third parties;\n• To attend the course in person and sober;\n• To follow the instructors' instructions during the practical sessions;\n• To wear protective equipment as required by the instructor;\n• To compensate for damage to the training vehicle or premises caused by gross negligence or intent.`,
      },
      {
        heading: "§ 7 Examination and Certificate",
        text: `At the end of the practical course, a theoretical and practical examination takes place. Upon passing, the Participant receives:\n\n• A forklift license in credit card format (optional, at additional cost) or as a printout;\n• A certificate in accordance with DGUV Principle 308-001.\n\nIf the exam is not passed, a resit can be arranged for an additional fee. There is no entitlement to pass the exam.`,
      },
      {
        heading: "§ 8 Liability",
        text: `The Provider is liable without limitation for damages resulting from injury to life, body, or health, as well as for intentionally or grossly negligently caused damages.\n\nFor slightly negligently caused damages, the Provider is only liable in the event of a breach of a material contractual obligation (cardinal obligation), limited to the foreseeable, contract-typical damage.\n\nOtherwise, the Provider's liability is excluded. Liability under the Product Liability Act remains unaffected.`,
      },
      {
        heading: "§ 9 Data Protection",
        text: `The collection and processing of personal data is carried out in accordance with our Privacy Policy, which can be accessed under "Privacy Policy" on our website.`,
      },
      {
        heading: "§ 10 Final Provisions",
        text: `The law of the Federal Republic of Germany applies. For consumers residing in another EU member state, the mandatory consumer protection provisions of that state also apply.\n\nThe place of jurisdiction for merchants and legal entities under public law is the Provider's registered office.\n\nShould individual provisions of these GTC be or become invalid, the validity of the remaining provisions shall remain unaffected.`,
      },
    ],
  },
  uk: {
    title: "Загальні умови та положення (ЗУП)",
    lastUpdated: "Станом на: січень 2025",
    sections: [
      {
        heading: "§ 1 Сфера застосування",
        text: `Ці загальні умови та положення застосовуються до всіх договорів, укладених між STAPLERO (далі «Постачальник») та клієнтом (далі «Учасник») щодо використання онлайн-навчальної платформи та бронювання очних і практичних курсів.\n\nДійсна на момент замовлення версія ЗУП є обов'язковою. Суперечливі або відмінні умови Учасника не визнаються.`,
      },
      {
        heading: "§ 2 Опис послуг",
        text: `Постачальник надає такі послуги:\n\n• Онлайн-курс теорії: доступ до цифрової навчальної платформи на 30 днів з дати покупки. Курс включає всі розділи, навчальні матеріали, інтерактивні вправи та підсумковий тест відповідно до DGUV Приписи 68.\n\n• Очний теоретичний курс: теоретичне навчання на місці з досвідченим інструктором в одному з пропонованих місць.\n\n• Практичний курс: 16-годинне навчання протягом двох днів, включаючи теоретичний блок, практику їзди на навчальному майданчику та теоретичний і практичний підсумковий іспит. При складанні іспиту Учасник отримує загальновизнані права на навантажувач відповідно до DGUV Приписи 68 та Принципу 308-001.`,
      },
      {
        heading: "§ 3 Укладення договору",
        text: `Представлення курсів на веб-сайті не є юридично зобов'язуючою пропозицією, а лише запрошенням до подання пропозиції.\n\nЗавершивши процес замовлення та натиснувши кнопку «Оплатити зараз», Учасник подає обов'язкову пропозицію щодо укладення договору. Прийняття відбувається через підтверджувальний лист електронної пошти або шляхом надання доступу до курсу чи підтвердження забронованого терміну.`,
      },
      {
        heading: "§ 4 Ціни та оплата",
        text: `Усі зазначені ціни є цінами без ПДВ плюс законний ПДВ у розмірі 19%.\n\nОплата здійснюється виключно через запропоновані способи оплати (кредитна картка, SEPA-пряме дебетування, інші методи згідно з оформленням замовлення). Оплата належить негайно після завершення замовлення. Доступ до онлайн-курсу або підтвердження терміну очного/практичного курсу надається лише після повного отримання оплати.`,
      },
      {
        heading: "§ 5 Право на відмову",
        text: `Споживачі, як правило, мають 14-денне право на відмову від договору.\n\nВиняток: право на відмову від цифрового контенту (онлайн-курс теорії) спливає, якщо Учасник явно погодився, що виконання договору починається до закінчення терміну відмови, і визнав, що тим самим втрачає своє право на відмову.\n\nДля очних і практичних курсів із конкретним забронованим терміном право на відмову спливає, якщо термін припадає на 14-денний період відмови або якщо Учасник явно відмовився від права на відмову. Безкоштовне скасування терміну можливе до 7 днів до початку курсу. При пізніших скасуваннях сплачується повна вартість курсу. Безкоштовне перенесення на інший термін можливе одноразово до 5 днів до початку курсу.`,
      },
      {
        heading: "§ 6 Обов'язки Учасника",
        text: `Учасник зобов'язується:\n\n• Надавати правильні дані під час реєстрації;\n• Не передавати дані для входу третім особам;\n• Відвідувати курс особисто і тверезим;\n• Дотримуватися вказівок інструкторів під час практичних занять;\n• Носити захисне спорядження відповідно до вимог інструктора;\n• Відшкодовувати збитки, завдані навчальному транспортному засобу або майданчику внаслідок грубої недбалості або умислу.`,
      },
      {
        heading: "§ 7 Іспит і сертифікат",
        text: `Після закінчення практичного курсу проводиться теоретичний і практичний іспит. При складанні Учасник отримує:\n\n• Посвідчення водія навантажувача у форматі кредитної картки (опціонально, за додаткову плату) або у роздрукованому вигляді;\n• Сертифікат відповідно до DGUV Принципу 308-001.\n\nУ разі невдачі на іспиті можна домовитися про повторний іспит за додаткову плату. Права на складання іспиту не існує.`,
      },
      {
        heading: "§ 8 Відповідальність",
        text: `Постачальник несе необмежену відповідальність за шкоду, заподіяну життю, тілу або здоров'ю, а також за умисно або грубо необережно заподіяну шкоду.\n\nЗа шкоду, заподіяну з легкою необережністю, Постачальник несе відповідальність лише у разі порушення суттєвого договірного зобов'язання (кардинального зобов'язання), обмежену передбачуваною, типовою для договору шкодою.\n\nВ іншому випадку відповідальність Постачальника виключається. Відповідальність за законом про відповідальність за продукцію залишається незачепленою.`,
      },
      {
        heading: "§ 9 Захист даних",
        text: `Збір і обробка персональних даних здійснюється відповідно до нашої Політики конфіденційності, яка доступна в розділі «Конфіденційність» на нашому веб-сайті.`,
      },
      {
        heading: "§ 10 Прикінцеві положення",
        text: `Застосовується право Федеративної Республіки Німеччина. Для споживачів, які проживають в іншій державі-члені ЄС, також застосовуються обов'язкові норми захисту прав споживачів цієї держави.\n\nМісцем юрисдикції для підприємців та юридичних осіб публічного права є місцезнаходження Постачальника.\n\nЯкщо окремі положення цих ЗУП є або стануть недійсними, дійсність інших положень залишається незачепленою.`,
      },
    ],
  },
  pl: {
    title: "Ogólne Warunki Handlowe (OWH)",
    lastUpdated: "Stan na: styczeń 2025",
    sections: [
      {
        heading: "§ 1 Zakres stosowania",
        text: `Niniejsze Ogólne Warunki Handlowe mają zastosowanie do wszystkich umów zawieranych pomiędzy STAPLERO (dalej „Usługodawca") a klientem (dalej „Uczestnik") dotyczących korzystania z platformy e-learningowej oraz rezerwacji kursów stacjonarnych i praktycznych.\n\nObowiązuje wersja OWH aktualna w chwili złożenia zamówienia. Sprzeczne lub odmienne warunki Uczestnika nie są uznawane.`,
      },
      {
        heading: "§ 2 Opis usług",
        text: `Usługodawca oferuje następujące usługi:\n\n• Kurs teorii online: dostęp do cyfrowej platformy edukacyjnej na 30 dni od daty zakupu. Kurs obejmuje wszystkie rozdziały, materiały edukacyjne, ćwiczenia interaktywne i test końcowy zgodnie z DGUV Przepis 68.\n\n• Kurs teorii stacjonarnej: szkolenie teoretyczne na miejscu z doświadczonym instruktorem w jednej z oferowanych lokalizacji.\n\n• Kurs praktyczny: 16-godzinne szkolenie przez dwa dni, obejmujące blok teoretyczny, jazdę praktyczną na placu szkoleniowym oraz teoretyczny i praktyczny egzamin końcowy. Po zdaniu egzaminu Uczestnik otrzymuje powszechnie uznawane uprawnienia na wózek widłowy zgodnie z DGUV Przepis 68 i Zasada 308-001.`,
      },
      {
        heading: "§ 3 Zawarcie umowy",
        text: `Prezentacja kursów na stronie internetowej nie stanowi prawnie wiążącej oferty, lecz zaproszenie do składania ofert (invitatio ad offerendum).\n\nPrzez ukończenie procesu zamówienia i kliknięcie przycisku „Zapłać teraz" Uczestnik składa wiążącą ofertę zawarcia umowy. Przyjęcie następuje poprzez e-mail potwierdzający lub poprzez udostępnienie dostępu do kursu lub potwierdzenie zarezerwowanego terminu.`,
      },
      {
        heading: "§ 4 Ceny i płatność",
        text: `Wszystkie podane ceny są cenami netto powiększonymi o ustawowy podatek VAT w wysokości 19%.\n\nPłatność odbywa się wyłącznie za pomocą oferowanych metod płatności (karta kredytowa, polecenie zapłaty SEPA, inne metody wskazane w kasie). Płatność jest wymagalna natychmiast po zakończeniu zamówienia. Dostęp do kursu online lub potwierdzenie terminu kursu stacjonarnego/praktycznego zostanie aktywowane dopiero po pełnym zaksięgowaniu płatności.`,
      },
      {
        heading: "§ 5 Prawo odstąpienia od umowy",
        text: `Konsumentom przysługuje co do zasady 14-dniowe prawo odstąpienia od umowy.\n\nWyjątek: prawo odstąpienia od umowy dotyczącej treści cyfrowych (kurs teorii online) wygasa, jeśli Uczestnik wyraźnie wyraził zgodę na rozpoczęcie wykonania umowy przed upływem terminu odstąpienia i przyjął do wiadomości, że tym samym traci prawo odstąpienia.\n\nW przypadku kursów stacjonarnych i praktycznych z konkretnie zarezerwowanym terminem prawo odstąpienia wygasa, jeśli termin przypada w 14-dniowym terminie odstąpienia lub jeśli Uczestnik wyraźnie zrzekł się prawa odstąpienia. Bezpłatna anulacja terminu jest możliwa do 7 dni przed rozpoczęciem kursu. W przypadku późniejszych anulacji należna jest pełna cena kursu. Jednorazowe bezpłatne przepisanie na inny termin jest możliwe do 5 dni przed rozpoczęciem kursu.`,
      },
      {
        heading: "§ 6 Obowiązki Uczestnika",
        text: `Uczestnik zobowiązuje się:\n\n• Podawać prawidłowe dane podczas rejestracji;\n• Nie udostępniać danych dostępowych osobom trzecim;\n• Uczestniczyć w kursie osobiście i na trzeźwo;\n• Stosować się do poleceń instruktorów podczas zajęć praktycznych;\n• Nosić wyposażenie ochronne zgodnie z wymaganiami instruktora;\n• Naprawić szkody wyrządzone pojazdowi szkoleniowemu lub placu szkoleniowemu w wyniku rażącego niedbalstwa lub umyślnego działania.`,
      },
      {
        heading: "§ 7 Egzamin i certyfikat",
        text: `Na zakończenie kursu praktycznego odbywa się egzamin teoretyczny i praktyczny. Po zdaniu Uczestnik otrzymuje:\n\n• Uprawnienia na wózek widłowy w formacie karty kredytowej (opcjonalnie, za dodatkową opłatą) lub w formie wydruku;\n• Certyfikat zgodnie z DGUV Zasada 308-001.\n\nW przypadku niezaliczenia egzaminu można umówić egzamin poprawkowy za dodatkową opłatą. Nie ma prawa do zdania egzaminu.`,
      },
      {
        heading: "§ 8 Odpowiedzialność",
        text: `Usługodawca ponosi nieograniczoną odpowiedzialność za szkody wynikające z naruszenia życia, ciała lub zdrowia, a także za szkody wyrządzone umyślnie lub w wyniku rażącego niedbalstwa.\n\nZa szkody wyrządzone z lekkiego niedbalstwa Usługodawca odpowiada jedynie w przypadku naruszenia istotnego zobowiązania umownego (zobowiązania kardynalnego), ograniczoną do przewidywalnej, typowej dla umowy szkody.\n\nPoza tym odpowiedzialność Usługodawcy jest wyłączona. Odpowiedzialność wynikająca z ustawy o odpowiedzialności za produkt pozostaje nienaruszona.`,
      },
      {
        heading: "§ 9 Ochrona danych",
        text: `Gromadzenie i przetwarzanie danych osobowych odbywa się zgodnie z naszą Polityką prywatności, dostępną w zakładce „Polityka prywatności" na naszej stronie internetowej.`,
      },
      {
        heading: "§ 10 Postanowienia końcowe",
        text: `Obowiązuje prawo Republiki Federalnej Niemiec. Dla konsumentów zamieszkałych w innym państwie członkowskim UE obowiązują dodatkowo bezwzględnie obowiązujące przepisy o ochronie konsumentów tego państwa.\n\nMiejscem właściwości sądu dla kupców i osób prawnych prawa publicznego jest siedziba Usługodawcy.\n\nJeśli poszczególne postanowienia niniejszych OWH są lub staną się nieważne, ważność pozostałych postanowień pozostaje nienaruszona.`,
      },
    ],
  },
};

const AGB = () => {
  const { language } = useLanguage();
  const lang = (language as keyof typeof content) in content ? (language as keyof typeof content) : "de";
  const c = content[lang];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-16 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">{c.title}</h1>
          <p className="text-muted-foreground text-sm">{c.lastUpdated}</p>
        </div>

        <div className="space-y-8">
          {c.sections.map((section, idx) => (
            <section key={idx}>
              <h2 className="text-xl font-semibold text-foreground mb-3">{section.heading}</h2>
              <div className="text-muted-foreground leading-relaxed whitespace-pre-line">
                {section.text}
              </div>
            </section>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AGB;
