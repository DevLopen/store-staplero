// Tłumaczenia Stapler-Quiz (strona /staplerschein-test i teaser na stronie głównej).
// Oryginał pytań (niemiecki, od klienta) jest w src/seo/staplerQuiz.seo.ts — tu tylko EN/PL/UK.
// Kolejność odpowiedzi jak w oryginale; poprawność i ilustracje pochodzą z oryginału.

import type { Language } from "@/i18n/translations";
import type { QuizLabels } from "@/components/quiz/QuizQuestionView";
import { QUESTIONS, type QuizQuestion } from "@/seo/staplerQuiz.seo";

type Translated = [q: string, answers: [text: string, why: string][]];

const QUESTION_TRANSLATIONS: Record<Exclude<Language, "de">, Record<string, Translated>> = {
    en: {
        L01: ["What applies to the driver of a forklift with a driver's seat or driver's platform?", [
            ["He needs a class B car driving licence.", "Not necessary on company premises. Driving licence law only applies on public roads."],
            ["He must be authorised in writing by the employer.", "Nobody may drive without written authorisation, not even with a forklift licence. Training and a certificate of competence are also required."],
            ["He must have worked at the company for at least two years.", "There is no minimum length of service."],
            ["He must be at least 18 years old.", "DGUV Regulation 68 § 7: minimum age 18. Exception: trainees under supervision."],
        ]],
        L02: ["When does the driver check the forklift for visible defects and proper function?", [
            ["Once a week.", "Too rarely. A defect can occur at any time."],
            ["Not at all, the competent person does that during the annual UVV inspection.", "The annual inspection does not replace the check before each shift."],
            ["Before the start of every shift.", "Brakes, steering, mast, horn, tyres: the driver checks before every shift (operating manual, DGUV G 308-001)."],
            ["Only after a repair.", "The pre-use check is a daily routine."],
        ]],
        L03: ["This inspection sticker is on an electric forklift. By when must it be inspected again at the latest?", [
            ["By October 2027.", "The year is in the middle, the centre line points to the month: 10 = October. The next regular inspection by a competent person must take place by then (DGUV V 68 § 37, inspection according to FEM 4.004)."],
            ["By October 2026, that is the date of the last inspection.", "The sticker shows the next inspection date. If it has passed: do not use the forklift and report it."],
            ["The sticker shows when the forklift was built.", "The year of manufacture is on the type plate. The sticker documents the inspection."],
            ["By July 2027.", "The 07 is printed large on the sticker, but what counts is the number the centre line points to."],
        ]],
        L04: ["How often must a forklift be inspected by a competent person?", [
            ["Only when a defect is noticed.", "The inspection is mandatory, even without a defect."],
            ["At least once within 12 months.", "DGUV V 68 § 37. For heavy use, the company can set shorter intervals."],
            ["Every 24 months.", "Too long."],
            ["Once per calendar year.", "Sounds similar, but it isn't: January this year and December next year would be almost 23 months apart."],
        ]],
        L05: ["You drive up this ramp with a pallet and later back down. How do you drive correctly?", [
            ["Uphill forwards.", "With a load, the load always points uphill. That way it does not slide off the forks and the forklift stays stable."],
            ["Downhill forwards, with the load raised a little.", "The load points downhill. It can slide off and the forklift can tip forwards."],
            ["Turn around on the ramp if it gets tight.", "Turning and driving across slopes is forbidden: risk of tipping sideways."],
            ["Downhill in reverse.", "Same rule: load on the uphill side, so reverse downhill."],
        ]],
        L06: ["And without a load? How do you drive over the ramp?", [
            ["Across the slope, that saves time.", "Driving across slopes is forbidden."],
            ["Uphill in reverse.", "Without a load, the counterweight is the heaviest part. It points uphill, the forks downhill."],
            ["Uphill forwards.", "The counterweight then points downhill. The empty forklift can tip backwards."],
            ["Downhill forwards.", "Forks downhill, counterweight uphill: correct."],
        ]],
        L07: ["In which position do you transport a load?", [
            ["Mast tilted backwards.", "The load rests against the fork back and does not slide off when braking."],
            ["As low as possible, with only the necessary ground clearance.", "A low centre of gravity means high stability."],
            ["Raised high so you can see underneath.", "High centre of gravity: risk of tipping. If visibility is poor, drive in reverse."],
            ["Mast tilted forwards.", "The load can slide off."],
        ]],
        L08: ["A colleague wants to stand on the forks to quickly get something from the rack. What do you do?", [
            ["That's fine if it's quick.", "A fall from 3 m takes less than a second."],
            ["Refuse. People must not be lifted on the forks or on the load.", "People may only be lifted with approved equipment, e.g. an inspected work platform."],
            ["That's fine if he holds on to the mast.", "Holding the mast risks severe crushing injuries."],
            ["That's fine if he stands on a pallet.", "A pallet is not a work platform."],
        ]],
        L09: ["What is part of parking the forklift safely?", [
            ["Park it in front of the emergency exit, there is space there.", "Emergency exits, escape routes and fire extinguishers must always remain clear."],
            ["Leave the engine running during a short break.", "Anyone who gets off switches off the engine, even for a short time."],
            ["Lower the forks completely, tilt the tips to the floor.", "That way nobody trips over the forks."],
            ["Apply the parking brake and remove the key.", "The forklift does not roll away and unauthorised persons cannot drive off."],
        ]],
        L10: ["A tall load blocks your view to the front. What do you do?", [
            ["Raise the load higher and look underneath.", "Higher centre of gravity, higher risk of tipping."],
            ["Keep driving slowly and use the horn.", "The horn is no substitute for visibility."],
            ["Drive in reverse or use a banksman.", "You must be able to see the route. If reversing is not possible, a banksman helps."],
            ["Lean your upper body out to the side.", "Outside the overhead guard you risk being crushed."],
        ]],
        L11: ["What is the seat belt on the forklift for?", [
            ["It is optional.", "Wearing it is mandatory."],
            ["It is only mandatory on public roads.", "If a restraint system is fitted, it is always used."],
            ["It prevents the forklift from tipping over.", "The belt protects the driver, not the vehicle."],
            ["It prevents the driver from falling out and being trapped if the forklift tips over.", "Many fatal tip-over accidents happen because the driver falls out or jumps off."],
        ]],
        L12: ["The forklift starts to tip over sideways. What is correct?", [
            ["Jump off.", "Danger to life: anyone who jumps off often ends up under the overhead guard."],
            ["Hold the steering wheel tight and brace your feet firmly.", "This keeps you under the overhead guard."],
            ["Accelerate and steer against it.", "This usually makes the tipping worse."],
            ["Lean your upper body away from the direction of tipping.", "That is exactly what the pictogram on the forklift shows."],
        ]],
        L13: ["During the pre-shift check, the brake works poorly. What do you do?", [
            ["Leave the forklift parked and report the defect immediately.", "Never drive with a safety-relevant defect (ArbSchG § 16: report defects)."],
            ["Adjust the brake yourself.", "Repairs only by qualified personnel."],
            ["Hand the forklift over to a colleague.", "That only passes the danger on."],
            ["Keep driving carefully until the end of the shift.", "With bad brakes there is no such thing as careful driving."],
        ]],
        L14: ["There are pedestrians in your driving area. What is correct?", [
            ["Slow down, make eye contact, keep your distance and stop if necessary.", "Pedestrians often cannot hear an electric forklift. The driver is responsible."],
            ["Simply lift the load over the people.", "Never move loads over people."],
            ["Sound the horn, then everyone has to get out of the way.", "The horn is no substitute for consideration."],
            ["Pedestrians have no right of way in the warehouse.", "Nobody may be endangered, no matter who has right of way."],
        ]],
        L15: ["What is important when charging the battery of an electric forklift?", [
            ["Ideally charge it in a small closed room.", "Gas collects there. Charge only in well-ventilated areas."],
            ["Charging is harmless, the plug just has to fit.", "Risk of explosion and corrosive acid: wear safety goggles and gloves."],
            ["Keep the battery cover closed while charging.", "The cover stays open so the gases can escape."],
            ["Ventilate well and no ignition sources: no smoking, no fire, no sparks.", "Charging produces hydrogen. Mixed with air it forms explosive oxyhydrogen gas."],
        ]],
        S01: ["A crate weighs 1,500 kg and is 1,200 mm long, the weight is evenly distributed. What is correct according to the diagram?", [
            ["With slight overload it is enough to drive slowly.", "Overloading is forbidden. Driving slowly does not prevent tipping."],
            ["If the crate is 200 mm in front of the fork back (centre of gravity at 800 mm), the forklift is overloaded.", "At 800 mm only 1,250 kg are permitted. That is why loads are always picked up right up to the fork back."],
            ["If the crate rests against the fork back (centre of gravity at 600 mm), you may transport it.", "At 600 mm the diagram allows 1,700 kg. 1,500 kg is below that."],
            ["2,000 kg always applies, no matter where the load is.", "2,000 kg only applies at the rated load centre of 500 mm."],
        ]],
        S02: ["An attachment, e.g. a clamp, is fitted to the forklift. Which load capacity applies?", [
            ["The value on the additional capacity plate for the forklift with this attachment.", "The attachment has its own weight and moves the load centre forwards. The residual capacity decreases."],
            ["The driver decides by feel.", "Feel is no substitute for a capacity plate."],
            ["Still the value on the forklift's type plate.", "With an attachment, the values of the basic truck no longer apply."],
            ["A higher capacity, because the attachment adds extra weight.", "The weight sits at the front, on the load side. It reduces the capacity."],
        ]],
        S03: ["Why can a forklift tip over sideways in a bend?", [
            ["Centrifugal force shifts the centre of gravity. If it leaves the stability triangle, the forklift tips over.", "Because of the pendulum steering axle, the forklift effectively stands on only three points."],
            ["The counterweight prevents tipping sideways.", "The counterweight works against tipping forwards, not sideways."],
            ["Even without a load it tips over if it takes a bend too fast.", "Unloaded, the centre of gravity is close to the narrow tip of the triangle, at the rear axle."],
            ["With the seat belt fastened it cannot tip over.", "The belt protects the driver, not the stability."],
        ]],
        S04: ["You are to drive into a truck. What must be ensured beforehand?", [
            ["The truck is secured against rolling away and driving off prematurely.", "Parking brake, wheel chocks and clear agreement with the truck driver. If the truck drives off, the forklift falls."],
            ["It is enough to compare the weight of the load with the dock leveller.", "The weight of the forklift must be included."],
            ["The dock leveller and loading area can carry the forklift, driver and load together, and the leveller rests firmly.", "The forklift itself often weighs several tonnes. A displaced leveller becomes a drop edge."],
            ["The truck may drive off as soon as the forklift is on the loading area.", "Departure only once the forklift has left the truck."],
        ]],
        S05: ["You are changing the gas cylinder on an LPG forklift. What is correct?", [
            ["Ideally change it next to a basement stairway or a drain.", "LPG is heavier than air and collects in low points. Risk of explosion."],
            ["Wear protective gloves.", "Escaping LPG evaporates ice-cold. There is a risk of cold burns."],
            ["Change it outdoors away from ignition sources, close the cylinder valve first and let the engine run until the line is empty.", "LPG is highly flammable (DGUV Regulation 79). Once the line is empty, hardly any gas escapes when unscrewing."],
            ["Check for leaks with a lighter.", "Danger to life. Check for leaks only with leak detection spray."],
        ]],
    },
    pl: {
        L01: ["Co dotyczy kierowcy wózka widłowego z siedziskiem lub stanowiskiem dla kierowcy?", [
            ["Musi mieć prawo jazdy kat. B.", "Na terenie zakładu nie jest potrzebne. Przepisy o prawie jazdy obowiązują dopiero w ruchu publicznym."],
            ["Musi mieć pisemne upoważnienie od pracodawcy.", "Bez pisemnego upoważnienia nikt nie może jeździć, nawet z uprawnieniami. Do tego dochodzi szkolenie i zaświadczenie o kwalifikacjach."],
            ["Musi pracować w firmie co najmniej dwa lata.", "Nie ma minimalnego stażu w firmie."],
            ["Musi mieć co najmniej 18 lat.", "DGUV Vorschrift 68 § 7: minimalny wiek 18 lat. Wyjątek: osoby w trakcie nauki zawodu pod nadzorem."],
        ]],
        L02: ["Kiedy kierowca sprawdza wózek pod kątem widocznych usterek i działania?", [
            ["Raz w tygodniu.", "Za rzadko. Usterka może pojawić się w każdej chwili."],
            ["Wcale, robi to osoba uprawniona podczas przeglądu UVV.", "Coroczny przegląd nie zastępuje kontroli przed rozpoczęciem zmiany."],
            ["Przed rozpoczęciem każdej zmiany.", "Hamulce, układ kierowniczy, maszt, klakson, opony: kierowca sprawdza je przed każdą zmianą (instrukcja obsługi, DGUV G 308-001)."],
            ["Tylko po naprawie.", "Kontrola przed użyciem to codzienna rutyna."],
        ]],
        L03: ["Ta plakietka kontrolna jest naklejona na wózku elektrycznym. Do kiedy najpóźniej trzeba go ponownie sprawdzić?", [
            ["Do października 2027.", "Pośrodku jest rok, a kreska środkowa wskazuje miesiąc: 10 = październik. Do tego czasu musi się odbyć kolejny przegląd okresowy przez osobę uprawnioną (DGUV V 68 § 37, przegląd wg FEM 4.004)."],
            ["Do października 2026, to data ostatniego przeglądu.", "Plakietka pokazuje termin następnego przeglądu. Jeśli minął: nie używaj wózka i zgłoś to."],
            ["Plakietka pokazuje, kiedy wózek został wyprodukowany.", "Rok produkcji jest na tabliczce znamionowej. Plakietka dokumentuje przegląd."],
            ["Do lipca 2027.", "Liczba 07 jest na plakietce duża, ale liczy się liczba, na którą wskazuje kreska środkowa."],
        ]],
        L04: ["Jak często wózek widłowy musi sprawdzić osoba uprawniona?", [
            ["Tylko wtedy, gdy zauważy się usterkę.", "Przegląd jest obowiązkowy, także bez usterki."],
            ["Co najmniej raz na 12 miesięcy.", "DGUV V 68 § 37. Przy intensywnej eksploatacji firma może ustalić krótsze terminy."],
            ["Co 24 miesiące.", "Za rzadko."],
            ["Raz w roku kalendarzowym.", "Brzmi podobnie, ale to nie to samo: styczeń tego roku i grudzień następnego to prawie 23 miesiące odstępu."],
        ]],
        L05: ["Wjeżdżasz z paletą na tę rampę, a później z niej zjeżdżasz. Jak jedziesz prawidłowo?", [
            ["Pod górę przodem.", "Z ładunkiem ładunek jest zawsze skierowany pod górę. Dzięki temu nie zsuwa się z wideł, a wózek pozostaje stabilny."],
            ["W dół przodem, ładunek lekko uniesiony.", "Ładunek jest skierowany w dół. Może się zsunąć, a wózek może przewrócić się do przodu."],
            ["Zawrócić na rampie, jeśli robi się ciasno.", "Zawracanie i jazda w poprzek pochyłości są zabronione: ryzyko przewrócenia na bok."],
            ["W dół tyłem.", "Ta sama zasada: ładunek od strony wzniesienia, czyli w dół tyłem."],
        ]],
        L06: ["A bez ładunku? Jak przejeżdżasz przez rampę?", [
            ["W poprzek pochyłości, to oszczędza czas.", "Jazda w poprzek pochyłości jest zabroniona."],
            ["Pod górę tyłem.", "Bez ładunku najcięższą częścią jest przeciwwaga. Jest skierowana pod górę, widły w dół."],
            ["Pod górę przodem.", "Przeciwwaga jest wtedy skierowana w dół. Pusty wózek może przewrócić się do tyłu."],
            ["W dół przodem.", "Widły w dół, przeciwwaga pod górę: prawidłowo."],
        ]],
        L07: ["W jakim położeniu transportujesz ładunek?", [
            ["Maszt odchylony do tyłu.", "Ładunek przylega do grzbietu wideł i nie zsuwa się przy hamowaniu."],
            ["Jak najniżej, tylko z niezbędnym prześwitem.", "Nisko położony środek ciężkości oznacza dużą stateczność."],
            ["Wysoko uniesiony, żeby widzieć pod nim.", "Wysoki środek ciężkości: ryzyko przewrócenia. Przy słabej widoczności jedź tyłem."],
            ["Maszt pochylony do przodu.", "Ładunek może się zsunąć."],
        ]],
        L08: ["Kolega chce stanąć na widłach, żeby szybko coś zdjąć z regału. Co robisz?", [
            ["W porządku, jeśli to potrwa chwilę.", "Upadek z 3 m trwa krócej niż sekundę."],
            ["Odmawiasz. Nie wolno podnosić ludzi na widłach ani na ładunku.", "Ludzi podnosi się tylko na dopuszczonych do tego urządzeniach, np. na sprawdzonym podeście roboczym."],
            ["W porządku, jeśli trzyma się masztu.", "Przy maszcie grożą ciężkie zmiażdżenia."],
            ["W porządku, jeśli stoi na palecie.", "Paleta nie jest podestem roboczym."],
        ]],
        L09: ["Co należy do bezpiecznego odstawienia wózka?", [
            ["Odstawić go przed wyjściem ewakuacyjnym, tam jest miejsce.", "Wyjścia i drogi ewakuacyjne oraz gaśnice muszą być zawsze wolne."],
            ["Przy krótkiej przerwie zostawić włączony silnik.", "Kto schodzi z wózka, wyłącza silnik, nawet na krótko."],
            ["Opuścić widły całkowicie, końcówki pochylić do podłoża.", "Dzięki temu nikt nie potknie się o widły."],
            ["Zaciągnąć hamulec postojowy i wyjąć kluczyk.", "Wózek nie odjedzie, a osoby nieupoważnione nie mogą nim ruszyć."],
        ]],
        L10: ["Wysoki ładunek zasłania ci widok do przodu. Co robisz?", [
            ["Podnoszę ładunek wyżej i patrzę pod nim.", "Wyższy środek ciężkości, większe ryzyko przewrócenia."],
            ["Jadę dalej powoli i trąbię.", "Klakson nie zastąpi widoczności."],
            ["Jadę tyłem albo korzystam z pomocy osoby kierującej ruchem.", "Musisz widzieć drogę. Jeśli jazda tyłem nie jest możliwa, pomaga osoba kierująca ruchem."],
            ["Wychylam tułów w bok.", "Poza daszkiem ochronnym grozi zmiażdżenie."],
        ]],
        L11: ["Do czego służy pas bezpieczeństwa na wózku?", [
            ["Jest dobrowolny.", "Zapinanie go jest obowiązkowe."],
            ["Jest obowiązkowy tylko w ruchu drogowym.", "Jeśli wózek ma system przytrzymujący, zawsze się go używa."],
            ["Zapobiega przewróceniu się wózka.", "Pas chroni kierowcę, nie pojazd."],
            ["Zapobiega wypadnięciu i przygnieceniu kierowcy, gdy wózek się przewraca.", "Wiele śmiertelnych wypadków przy przewróceniu zdarza się, bo kierowca wypada lub wyskakuje."],
        ]],
        L12: ["Wózek zaczyna przewracać się na bok. Co jest prawidłowe?", [
            ["Wyskoczyć.", "Zagrożenie życia: kto wyskakuje, często ląduje pod daszkiem ochronnym."],
            ["Mocno trzymać kierownicę i mocno zaprzeć się nogami.", "Dzięki temu zostajesz pod daszkiem ochronnym kierowcy."],
            ["Dodać gazu i skręcić w przeciwną stronę.", "Zwykle tylko wzmacnia to przewracanie."],
            ["Odchylić tułów w stronę przeciwną do kierunku przewracania.", "Dokładnie to pokazuje piktogram na wózku."],
        ]],
        L13: ["Podczas kontroli przed zmianą hamulec działa słabo. Co robisz?", [
            ["Zostawiam wózek i natychmiast zgłaszam usterkę.", "Z usterką istotną dla bezpieczeństwa się nie jeździ (ArbSchG § 16: zgłaszanie usterek)."],
            ["Sam reguluję hamulec.", "Naprawy tylko przez wykwalifikowany personel."],
            ["Oddaję wózek koledze.", "W ten sposób tylko przekazujesz zagrożenie dalej."],
            ["Jeżdżę ostrożnie do końca zmiany.", "Ze słabym hamulcem nie ma ostrożnej jazdy."],
        ]],
        L14: ["W twoim obszarze jazdy poruszają się piesi. Co jest prawidłowe?", [
            ["Zwolnić, nawiązać kontakt wzrokowy, zachować odstęp i w razie potrzeby się zatrzymać.", "Piesi często nie słyszą wózka elektrycznego. Odpowiedzialność ponosi kierowca."],
            ["Po prostu przenieść ładunek nad ludźmi.", "Nigdy nie przenoś ładunków nad ludźmi."],
            ["Zatrąbić, wtedy wszyscy muszą zejść z drogi.", "Klakson nie zastąpi ostrożności."],
            ["Piesi nie mają w magazynie pierwszeństwa.", "Nikogo nie wolno narażać, niezależnie od tego, kto ma pierwszeństwo."],
        ]],
        L15: ["Co jest ważne przy ładowaniu akumulatora wózka elektrycznego?", [
            ["Najlepiej ładować w małym, zamkniętym pomieszczeniu.", "Tam gromadzi się gaz. Ładuj tylko w dobrze wentylowanych miejscach."],
            ["Ładowanie jest bezpieczne, wystarczy, że wtyczka pasuje.", "Ryzyko wybuchu i żrący kwas: noś okulary ochronne i rękawice."],
            ["Podczas ładowania pokrywa akumulatora ma być zamknięta.", "Pokrywa pozostaje otwarta, żeby gazy mogły uchodzić."],
            ["Dobrze wietrzyć i żadnych źródeł zapłonu: nie palić, bez ognia, bez iskier.", "Podczas ładowania powstaje wodór. Z powietrzem tworzy wybuchowy gaz piorunujący."],
        ]],
        S01: ["Skrzynia waży 1500 kg i ma 1200 mm długości, ciężar jest rozłożony równomiernie. Co jest prawdą według diagramu?", [
            ["Przy lekkim przeciążeniu wystarczy jechać powoli.", "Przeciążenie jest zabronione. Powolna jazda nie zapobiega przewróceniu."],
            ["Jeśli skrzynia leży 200 mm przed grzbietem wideł (środek ciężkości na 800 mm), wózek jest przeciążony.", "Przy 800 mm dozwolone jest tylko 1250 kg. Dlatego ładunki zawsze podejmuje się aż do grzbietu wideł."],
            ["Jeśli skrzynia przylega do grzbietu wideł (środek ciężkości na 600 mm), możesz ją przewieźć.", "Przy 600 mm diagram dopuszcza 1700 kg. 1500 kg to mniej."],
            ["Zawsze obowiązuje 2000 kg, niezależnie od położenia ładunku.", "2000 kg obowiązuje tylko przy nominalnym środku ciężkości 500 mm."],
        ]],
        S02: ["Na wózek zakłada się osprzęt, np. chwytak. Jaki udźwig obowiązuje?", [
            ["Wartość z dodatkowej tabliczki udźwigu dla wózka z tym osprzętem.", "Osprzęt sam waży i przesuwa środek ciężkości ładunku do przodu. Udźwig resztkowy maleje."],
            ["Decyduje kierowca na wyczucie.", "Wyczucie nie zastąpi tabliczki udźwigu."],
            ["Nadal wartość z tabliczki znamionowej wózka.", "Z osprzętem wartości wózka podstawowego już nie obowiązują."],
            ["Wyższy udźwig, bo osprzęt dodaje ciężaru.", "Ciężar jest z przodu, po stronie ładunku. Zmniejsza udźwig."],
        ]],
        S03: ["Dlaczego wózek może przewrócić się na bok na zakręcie?", [
            ["Siła odśrodkowa przesuwa środek ciężkości. Gdy wyjdzie poza trójkąt stateczności, wózek się przewraca.", "Przez wahliwą oś kierowaną wózek w praktyce stoi tylko na trzech punktach."],
            ["Przeciwwaga zapobiega przewróceniu na bok.", "Przeciwwaga działa przeciw przewróceniu do przodu, nie na bok."],
            ["Także bez ładunku przewróci się przy zbyt szybkiej jeździe w zakręcie.", "Bez ładunku środek ciężkości leży blisko wąskiego wierzchołka trójkąta, przy tylnej osi."],
            ["Z zapiętym pasem nie może się przewrócić.", "Pas chroni kierowcę, a nie stateczność."],
        ]],
        S04: ["Masz wjechać do ciężarówki. Co musi być wcześniej zapewnione?", [
            ["Ciężarówka jest zabezpieczona przed stoczeniem się i przedwczesnym odjazdem.", "Hamulec postojowy, kliny pod koła i jasne ustalenia z kierowcą ciężarówki. Jeśli ciężarówka odjedzie, wózek spadnie."],
            ["Wystarczy porównać ciężar ładunku z nośnością pomostu.", "Trzeba doliczyć ciężar wózka."],
            ["Pomost i skrzynia ładunkowa utrzymają razem wózek, kierowcę i ładunek, a pomost leży stabilnie.", "Sam wózek waży często kilka ton. Przesunięty pomost staje się krawędzią upadku."],
            ["Ciężarówka może odjechać, gdy tylko wózek stoi na skrzyni ładunkowej.", "Odjazd dopiero wtedy, gdy wózek opuści ciężarówkę."],
        ]],
        S05: ["Wymieniasz butlę gazową w wózku zasilanym LPG. Co jest prawidłowe?", [
            ["Najlepiej wymieniać obok zejścia do piwnicy albo studzienki.", "LPG jest cięższy od powietrza i gromadzi się w zagłębieniach. Ryzyko wybuchu."],
            ["Nosić rękawice ochronne.", "Ulatniający się LPG odparowuje lodowato zimny. Grożą odmrożenia."],
            ["Wymieniać na zewnątrz, z dala od źródeł zapłonu, najpierw zamknąć zawór butli i pozwolić silnikowi wypracować gaz z przewodu.", "LPG jest skrajnie łatwopalny (DGUV Vorschrift 79). Gdy przewód jest pusty, przy odkręcaniu prawie nie ulatnia się gaz."],
            ["Sprawdzić szczelność zapalniczką.", "Zagrożenie życia. Szczelność sprawdza się tylko sprayem do wykrywania nieszczelności."],
        ]],
    },
    uk: {
        L01: ["Що стосується водія навантажувача із сидінням або платформою для водія?", [
            ["Йому потрібне посвідчення водія категорії B.", "На території підприємства воно не потрібне. Законодавство про водійські права діє лише на дорогах загального користування."],
            ["Його має письмово уповноважити роботодавець.", "Без письмового доручення ніхто не має права керувати, навіть із посвідченням водія навантажувача. Також потрібні навчання і підтвердження кваліфікації."],
            ["Він має працювати на підприємстві щонайменше два роки.", "Мінімального стажу на підприємстві немає."],
            ["Йому має бути щонайменше 18 років.", "DGUV Vorschrift 68 § 7: мінімальний вік 18 років. Виняток: учні під наглядом."],
        ]],
        L02: ["Коли водій перевіряє навантажувач на видимі дефекти та справність?", [
            ["Раз на тиждень.", "Занадто рідко. Несправність може виникнути будь-коли."],
            ["Ніколи, це робить компетентна особа під час перевірки UVV.", "Щорічна перевірка не замінює перевірку перед початком зміни."],
            ["Перед початком кожної робочої зміни.", "Гальма, кермо, щогла, сигнал, шини: водій перевіряє їх перед кожною зміною (інструкція з експлуатації, DGUV G 308-001)."],
            ["Лише після ремонту.", "Перевірка перед використанням — щоденна рутина."],
        ]],
        L03: ["Ця наклейка про перевірку є на електронавантажувачі. До якого часу найпізніше його потрібно перевірити знову?", [
            ["До жовтня 2027 року.", "Посередині вказано рік, середня риска вказує на місяць: 10 = жовтень. До цього часу має відбутися наступна регулярна перевірка компетентною особою (DGUV V 68 § 37, перевірка за FEM 4.004)."],
            ["До жовтня 2026 року, це дата останньої перевірки.", "Наклейка показує дату наступної перевірки. Якщо її прострочено: не користуйтеся навантажувачем і повідомте про це."],
            ["Наклейка показує, коли навантажувач було виготовлено.", "Рік виготовлення вказано на заводській табличці. Наклейка підтверджує перевірку."],
            ["До липня 2027 року.", "Число 07 на наклейці велике, але важливе те число, на яке вказує середня риска."],
        ]],
        L04: ["Як часто навантажувач має перевіряти компетентна особа?", [
            ["Лише тоді, коли помітили несправність.", "Перевірка обовʼязкова, навіть без несправності."],
            ["Щонайменше раз на 12 місяців.", "DGUV V 68 § 37. За інтенсивної експлуатації підприємство може встановити коротші строки."],
            ["Кожні 24 місяці.", "Занадто рідко."],
            ["Раз на календарний рік.", "Звучить схоже, але це не те саме: між січнем цього року і груднем наступного майже 23 місяці."],
        ]],
        L05: ["Ви заїжджаєте з піддоном на цей пандус, а згодом зʼїжджаєте вниз. Як правильно?", [
            ["Вгору передом.", "З вантажем вантаж завжди спрямований угору. Так він не зісковзне з вил, а навантажувач залишиться стійким."],
            ["Вниз передом, трохи піднявши вантаж.", "Вантаж спрямований униз. Він може зісковзнути, а навантажувач може перекинутися вперед."],
            ["Розвернутися на пандусі, якщо стає тісно.", "Розвороти та рух поперек схилу заборонені: небезпека бокового перекидання."],
            ["Вниз задом.", "Те саме правило: вантаж з боку підйому, тобто вниз задом."],
        ]],
        L06: ["А без вантажу? Як ви проїжджаєте пандус?", [
            ["Поперек схилу, так швидше.", "Рух поперек схилу заборонений."],
            ["Вгору задом.", "Без вантажу найважча частина — противага. Вона спрямована вгору, вила вниз."],
            ["Вгору передом.", "Тоді противага спрямована вниз. Порожній навантажувач може перекинутися назад."],
            ["Вниз передом.", "Вила вниз, противага вгору: правильно."],
        ]],
        L07: ["У якому положенні ви транспортуєте вантаж?", [
            ["Щогла нахилена назад.", "Вантаж прилягає до спинки вил і не зісковзує під час гальмування."],
            ["Якомога нижче, лише з необхідним кліренсом.", "Низький центр ваги означає високу стійкість."],
            ["Високо піднятий, щоб бачити під ним.", "Високий центр ваги: небезпека перекидання. За поганої видимості їдьте задом."],
            ["Щогла нахилена вперед.", "Вантаж може зісковзнути."],
        ]],
        L08: ["Колега хоче стати на вила, щоб швидко щось дістати з полиці. Що ви робите?", [
            ["Гаразд, якщо це швидко.", "Падіння з висоти 3 м триває менше секунди."],
            ["Відмовляєте. Людей не можна піднімати на вилах або на вантажі.", "Людей піднімають лише на допущених для цього пристроях, напр. на перевіреній робочій платформі."],
            ["Гаразд, якщо він триматиметься за щоглу.", "Біля щогли загрожують важкі травми від защемлення."],
            ["Гаразд, якщо він стоїть на піддоні.", "Піддон не є робочою платформою."],
        ]],
        L09: ["Що належить до безпечного паркування навантажувача?", [
            ["Поставити перед аварійним виходом, там є місце.", "Аварійні виходи, евакуаційні шляхи та вогнегасники завжди мають бути вільними."],
            ["Під час короткої перерви залишити двигун увімкненим.", "Хто сходить із навантажувача, вимикає двигун, навіть ненадовго."],
            ["Повністю опустити вила, нахилити кінці до підлоги.", "Так ніхто не спіткнеться об вила."],
            ["Затягнути стоянкове гальмо і вийняти ключ.", "Навантажувач не покотиться, а сторонні не зможуть поїхати."],
        ]],
        L10: ["Високий вантаж закриває вам огляд уперед. Що ви робите?", [
            ["Піднімаю вантаж вище і дивлюся під ним.", "Вищий центр ваги, вища небезпека перекидання."],
            ["Їду далі повільно і сигналю.", "Сигнал не замінює огляд."],
            ["Їду задом або залучаю регулювальника.", "Ви маєте бачити шлях. Якщо їхати задом неможливо, допоможе регулювальник."],
            ["Висуваю корпус убік.", "За межами захисного даху загрожує защемлення."],
        ]],
        L11: ["Для чого потрібен ремінь безпеки на навантажувачі?", [
            ["Він необовʼязковий.", "Користуватися ним обовʼязково."],
            ["Він обовʼязковий лише на дорогах загального користування.", "Якщо система утримання є, нею користуються завжди."],
            ["Він запобігає перекиданню навантажувача.", "Ремінь захищає водія, а не машину."],
            ["Він не дає водієві випасти і бути затиснутим, якщо навантажувач перекидається.", "Багато смертельних аварій із перекиданням стаються тому, що водій випадає або вистрибує."],
        ]],
        L12: ["Навантажувач починає перекидатися набік. Що правильно?", [
            ["Вистрибнути.", "Небезпека для життя: хто вистрибує, часто потрапляє під захисний дах."],
            ["Міцно тримати кермо і сильно впертися ногами.", "Так ви залишаєтеся під захисним дахом водія."],
            ["Додати газу і повернути кермо в протилежний бік.", "Зазвичай це лише посилює перекидання."],
            ["Нахилити корпус у бік, протилежний перекиданню.", "Саме це показує піктограма на навантажувачі."],
        ]],
        L13: ["Під час перевірки перед зміною гальмо працює погано. Що ви робите?", [
            ["Залишаю навантажувач і негайно повідомляю про несправність.", "З несправністю, важливою для безпеки, не їздять (ArbSchG § 16: повідомлення про несправності)."],
            ["Сам регулюю гальмо.", "Ремонт лише кваліфікованим персоналом."],
            ["Передаю навантажувач колезі.", "Так небезпека лише передається далі."],
            ["Обережно їжджу до кінця зміни.", "З поганими гальмами обережної їзди не буває."],
        ]],
        L14: ["У вашій зоні руху ходять пішоходи. Що правильно?", [
            ["Знизити швидкість, встановити зоровий контакт, тримати дистанцію і за потреби зупинитися.", "Пішоходи часто не чують електронавантажувач. Відповідальність несе водій."],
            ["Просто пронести вантаж над людьми.", "Ніколи не переміщуйте вантажі над людьми."],
            ["Посигналити, тоді всі мають відійти.", "Сигнал не замінює уважності."],
            ["Пішоходи на складі не мають переваги.", "Нікого не можна наражати на небезпеку, незалежно від того, хто має перевагу."],
        ]],
        L15: ["Що важливо під час заряджання акумулятора електронавантажувача?", [
            ["Найкраще заряджати в маленькому закритому приміщенні.", "Там накопичується газ. Заряджайте лише в добре провітрюваних місцях."],
            ["Заряджання безпечне, головне, щоб підійшла вилка.", "Небезпека вибуху та їдка кислота: носіть захисні окуляри та рукавиці."],
            ["Під час заряджання тримати кришку акумулятора закритою.", "Кришка залишається відкритою, щоб гази виходили."],
            ["Добре провітрювати і жодних джерел запалювання: не курити, без вогню, без іскор.", "Під час заряджання утворюється водень. З повітрям він утворює вибухонебезпечний гримучий газ."],
        ]],
        S01: ["Ящик важить 1500 кг і має довжину 1200 мм, вага розподілена рівномірно. Що правильно згідно з діаграмою?", [
            ["За невеликого перевантаження достатньо їхати повільно.", "Перевантаження заборонене. Повільна їзда не запобігає перекиданню."],
            ["Якщо ящик лежить за 200 мм від спинки вил (центр ваги на 800 мм), навантажувач перевантажений.", "На 800 мм дозволено лише 1250 кг. Тому вантажі завжди беруть до самої спинки вил."],
            ["Якщо ящик прилягає до спинки вил (центр ваги на 600 мм), його можна перевозити.", "На 600 мм діаграма дозволяє 1700 кг. 1500 кг менше."],
            ["Завжди діють 2000 кг, незалежно від положення вантажу.", "2000 кг діють лише за номінального центру ваги 500 мм."],
        ]],
        S02: ["На навантажувач встановлюють навісне обладнання, напр. захват. Яка вантажопідйомність діє?", [
            ["Значення на додатковій табличці вантажопідйомності для навантажувача з цим обладнанням.", "Обладнання має власну вагу і зміщує центр ваги вантажу вперед. Залишкова вантажопідйомність зменшується."],
            ["Вирішує водій на власне відчуття.", "Відчуття не замінює табличку вантажопідйомності."],
            ["Як і раніше, значення на заводській табличці навантажувача.", "З навісним обладнанням значення базової машини вже не діють."],
            ["Вища вантажопідйомність, бо обладнання додає вагу.", "Вага розташована спереду, з боку вантажу. Вона зменшує вантажопідйомність."],
        ]],
        S03: ["Чому навантажувач може перекинутися набік на повороті?", [
            ["Відцентрова сила зміщує центр ваги. Якщо він виходить за межі трикутника стійкості, навантажувач перекидається.", "Через хитну керовану вісь навантажувач фактично стоїть лише на трьох точках."],
            ["Противага запобігає боковому перекиданню.", "Противага протидіє перекиданню вперед, а не набік."],
            ["Навіть без вантажу він перекинеться, якщо надто швидко пройде поворот.", "Без вантажу центр ваги лежить близько до вузької вершини трикутника, біля задньої осі."],
            ["З пристебнутим ременем він не може перекинутися.", "Ремінь захищає водія, а не стійкість."],
        ]],
        S04: ["Вам потрібно заїхати у вантажівку. Що має бути забезпечено заздалегідь?", [
            ["Вантажівка захищена від скочування та передчасного відʼїзду.", "Стоянкове гальмо, противідкотні упори та чітка домовленість із водієм вантажівки. Якщо вантажівка відʼїде, навантажувач впаде."],
            ["Достатньо порівняти вагу вантажу з вантажопідйомністю перехідного містка.", "Потрібно врахувати і вагу навантажувача."],
            ["Перехідний місток і вантажна платформа витримують навантажувач, водія і вантаж разом, а місток лежить надійно.", "Сам навантажувач часто важить кілька тонн. Зміщений місток стає краєм, з якого можна впасти."],
            ["Вантажівка може відʼїхати, щойно навантажувач стоїть на платформі.", "Відʼїзд лише тоді, коли навантажувач покинув вантажівку."],
        ]],
        S05: ["Ви замінюєте газовий балон на навантажувачі із зрідженим газом. Що правильно?", [
            ["Найкраще міняти біля спуску в підвал або каналізаційного стоку.", "Зріджений газ важчий за повітря і накопичується в заглибленнях. Небезпека вибуху."],
            ["Надягти захисні рукавиці.", "Зріджений газ, що виходить, випаровується крижаним. Загрожують холодові опіки."],
            ["Міняти на відкритому повітрі без джерел запалювання, спочатку закрити вентиль балона і дати двигуну випрацювати газ із магістралі.", "Зріджений газ надзвичайно легкозаймистий (DGUV Vorschrift 79). Коли магістраль порожня, під час відкручування газ майже не виходить."],
            ["Перевірити герметичність запальничкою.", "Небезпека для життя. Герметичність перевіряють лише спреєм для пошуку витоків."],
        ]],
    },
};

/** Pytania w danym języku; brakujące tłumaczenie → niemiecki oryginał. */
export const localizeQuestion = (q: QuizQuestion, lang: Language): QuizQuestion => {
    const tr = lang === "de" ? undefined : QUESTION_TRANSLATIONS[lang]?.[q.id];
    if (!tr) return q;
    const [text, answers] = tr;
    return { ...q, q: text, answers: q.answers.map((a, k) => ({ ...a, text: answers[k][0], why: answers[k][1] })) };
};

export const localizeQuestions = (lang: Language, ids?: string[]): QuizQuestion[] =>
    (ids ? ids.map((id) => QUESTIONS.find((q) => q.id === id)!) : QUESTIONS).map((q) => localizeQuestion(q, lang));

// ─── Etykiety pytania ─────────────────────────────────────────────────────────

export const QUIZ_LABELS: Record<Language, QuizLabels> = {
    de: {
        needCount: (n) => `${n} richtige Antwort${n > 1 ? "en" : ""}`,
        chooseHint: (n) => (n > 1 ? "Wählen Sie zwei Antworten." : "Wählen Sie eine Antwort."),
        check: "Antwort prüfen",
        right: "Richtig",
        wrong: "Falsch",
        verdictRight: "Richtig.",
        verdictWrong: "Nicht ganz. Das wussten Sie noch nicht:",
    },
    en: {
        needCount: (n) => `${n} correct answer${n > 1 ? "s" : ""}`,
        chooseHint: (n) => (n > 1 ? "Choose two answers." : "Choose one answer."),
        check: "Check answer",
        right: "Correct",
        wrong: "Wrong",
        verdictRight: "Correct.",
        verdictWrong: "Not quite. Now you know:",
    },
    pl: {
        needCount: (n) => (n > 1 ? `${n} poprawne odpowiedzi` : "1 poprawna odpowiedź"),
        chooseHint: (n) => (n > 1 ? "Wybierz dwie odpowiedzi." : "Wybierz jedną odpowiedź."),
        check: "Sprawdź odpowiedź",
        right: "Dobrze",
        wrong: "Źle",
        verdictRight: "Dobrze.",
        verdictWrong: "Nie do końca. Teraz już wiesz:",
    },
    uk: {
        needCount: (n) => (n > 1 ? `${n} правильні відповіді` : "1 правильна відповідь"),
        chooseHint: (n) => (n > 1 ? "Виберіть дві відповіді." : "Виберіть одну відповідь."),
        check: "Перевірити відповідь",
        right: "Правильно",
        wrong: "Неправильно",
        verdictRight: "Правильно.",
        verdictWrong: "Не зовсім. Тепер ви знаєте:",
    },
};

// ─── Napisy na ilustracjach ───────────────────────────────────────────────────

export const FIGURE_TEXT: Record<Language, {
    uphill: string; slope: string; loaded: string; empty: string;
    rampAlt: (loaded: boolean) => string; chartTitle: string; chartAxis: string; chartAlt: string;
    plaketteAlt: string; rampePhotoAlt: string;
}> = {
    de: {
        uphill: "bergauf ?", slope: "Steigung", loaded: "MIT LAST", empty: "OHNE LAST",
        rampAlt: (l) => `Gabelstapler ${l ? "mit Last" : "ohne Last"} vor einer Rampe`,
        chartTitle: "TRAGFÄHIGKEIT Q [kg] · Hubhöhe bis 3.300 mm", chartAxis: "LASTSCHWERPUNKTABSTAND c [mm]",
        chartAlt: "Tragfähigkeitsdiagramm: 500 mm 2000 kg, 600 mm 1700 kg, 700 mm 1450 kg, 800 mm 1250 kg, 900 mm 1100 kg",
        plaketteAlt: "UVV-Prüfplakette am Gabelstapler, nächste Prüfung 10/2027",
        rampePhotoAlt: "Rampe mit Steigung auf dem Betriebsgelände",
    },
    en: {
        uphill: "uphill ?", slope: "Slope", loaded: "WITH LOAD", empty: "WITHOUT LOAD",
        rampAlt: (l) => `Forklift ${l ? "with load" : "without load"} in front of a ramp`,
        chartTitle: "LOAD CAPACITY Q [kg] · lift height up to 3,300 mm", chartAxis: "LOAD CENTRE DISTANCE c [mm]",
        chartAlt: "Load capacity chart: 500 mm 2000 kg, 600 mm 1700 kg, 700 mm 1450 kg, 800 mm 1250 kg, 900 mm 1100 kg",
        plaketteAlt: "Inspection sticker on a forklift, next inspection 10/2027",
        rampePhotoAlt: "Sloped ramp on company premises",
    },
    pl: {
        uphill: "pod górę ?", slope: "Wzniesienie", loaded: "Z ŁADUNKIEM", empty: "BEZ ŁADUNKU",
        rampAlt: (l) => `Wózek widłowy ${l ? "z ładunkiem" : "bez ładunku"} przed rampą`,
        chartTitle: "UDŹWIG Q [kg] · wysokość podnoszenia do 3300 mm", chartAxis: "ODLEGŁOŚĆ ŚRODKA CIĘŻKOŚCI c [mm]",
        chartAlt: "Diagram udźwigu: 500 mm 2000 kg, 600 mm 1700 kg, 700 mm 1450 kg, 800 mm 1250 kg, 900 mm 1100 kg",
        plaketteAlt: "Plakietka przeglądu UVV na wózku, następny przegląd 10/2027",
        rampePhotoAlt: "Rampa ze wzniesieniem na terenie zakładu",
    },
    uk: {
        uphill: "вгору ?", slope: "Підйом", loaded: "З ВАНТАЖЕМ", empty: "БЕЗ ВАНТАЖУ",
        rampAlt: (l) => `Навантажувач ${l ? "з вантажем" : "без вантажу"} перед пандусом`,
        chartTitle: "ВАНТАЖОПІДЙОМНІСТЬ Q [кг] · висота підйому до 3300 мм", chartAxis: "ВІДСТАНЬ ДО ЦЕНТРУ ВАГИ c [мм]",
        chartAlt: "Діаграма вантажопідйомності: 500 мм 2000 кг, 600 мм 1700 кг, 700 мм 1450 кг, 800 мм 1250 кг, 900 мм 1100 кг",
        plaketteAlt: "Наклейка перевірки UVV на навантажувачі, наступна перевірка 10/2027",
        rampePhotoAlt: "Пандус із підйомом на території підприємства",
    },
};

// ─── Teksty strony /staplerschein-test ────────────────────────────────────────

export interface QuizPageText {
    eyebrow: string; h1: string; h1Highlight: string;
    lead: (n: number) => string;
    facts: (grund: number, profi: number) => string[];
    roundBasic: string; roundPro: string; roundDone: string;
    counter: (i: number, n: number) => string; pause: string; resultLabel: string;
    next: string; showResult: string;
    interludeTitle: (score: number, n: number) => string; interludeText: (n: number) => string; startPro: string;
    correctWord: string;
    results: { strong: [string, string]; solid: [string, string]; weak: [string, string] };
    rememberTitle: string;
    ctaTitle: string; ctaText: string; ctaCourses: string; ctaCompany: string;
    restart: string;
    about: { title: string; text: string }[];
    disclaimer: string;
}

export const PAGE_TEXT: Record<Language, QuizPageText> = {
    de: {
        eyebrow: "Gabelstapler-Quiz · Staplerschein Test",
        h1: "Staplerfahren ist nicht schwer.",
        h1Highlight: "Aber es gibt Dinge, die Sie noch nicht wissen.",
        lead: (n) => `${n} Fragen aus der Praxis, nach DGUV Vorschrift 68 und DGUV Grundsatz 308-001. Nach jeder Antwort sehen Sie sofort, warum sie richtig oder falsch ist.`,
        facts: (g, p) => [`${g} Grundfragen`, `${p} Profi-Fragen`, "ca. 5 Minuten", "kostenlos, ohne Anmeldung"],
        roundBasic: "Grundwissen", roundPro: "Profi-Runde", roundDone: "Fertig",
        counter: (i, n) => `Frage ${i} von ${n}`, pause: "Pause", resultLabel: "Ergebnis",
        next: "Nächste Frage", showResult: "Ergebnis anzeigen",
        interludeTitle: (s, n) => `Grundwissen: ${s} von ${n} richtig.`,
        interludeText: (n) => `Jetzt wird es technisch: Tragfähigkeit, Anbaugeräte, Lkw-Verladung, Treibgas. ${n} Fragen, bei denen auch erfahrene Fahrer ins Grübeln kommen.`,
        startPro: "Profi-Runde starten",
        correctWord: "richtig",
        results: {
            strong: ["Stark. Sie wissen mehr als die meisten Fahrer.", "Für die Praxis gilt trotzdem: Ohne Ausbildung nach DGUV G 308-001 und schriftliche Beauftragung darf niemand fahren."],
            solid: ["Solide Basis. Aber ein paar Lücken.", "Genau diese Lücken führen in der Praxis zu Unfällen. In der Schulung schließen wir sie mit Theorie und Praxis am Stapler."],
            weak: ["Gut, dass Sie es jetzt wissen.", "Staplerfahren lernt man in wenigen Tagen. Sicher fahren heißt: die Regeln kennen, bevor etwas passiert."],
        },
        rememberTitle: "Das sollten Sie sich merken",
        ctaTitle: "Staplerschein bei Staplero",
        ctaText: "Ausbildung nach DGUV Grundsatz 308-001 in Berlin und Görlitz/Zgorzelec. Auf Deutsch, Polnisch, Ukrainisch, Russisch oder Englisch.",
        ctaCourses: "Kurstermine ansehen", ctaCompany: "Firmenschulung anfragen",
        restart: "Quiz neu starten",
        about: [
            { title: "Staplerschein bei Staplero", text: "Ausbildung zum Gabelstaplerfahrer nach DGUV Grundsatz 308-001, mit Theorie, Praxis und Prüfung. Auch für Arbeitsbühnen und Krane." },
            { title: "In 5 Sprachen", text: "Deutsch, Polnisch, Ukrainisch, Russisch und Englisch. Ihr Team versteht die Sicherheitsregeln in der eigenen Sprache." },
            { title: "Berlin und Görlitz/Zgorzelec", text: "Schulungen an beiden Standorten oder direkt bei Ihnen im Betrieb." },
        ],
        disclaimer: "Dieses Quiz dient der Orientierung und ersetzt keine Ausbildung nach DGUV Grundsatz 308-001. Das Tragfähigkeitsdiagramm zeigt Beispielwerte.",
    },
    en: {
        eyebrow: "Forklift quiz · Forklift licence test",
        h1: "Driving a forklift isn't hard.",
        h1Highlight: "But there are things you don't know yet.",
        lead: (n) => `${n} practical questions based on DGUV Regulation 68 and DGUV Principle 308-001. After every answer you immediately see why it is right or wrong.`,
        facts: (g, p) => [`${g} basic questions`, `${p} expert questions`, "approx. 5 minutes", "free, no sign-up"],
        roundBasic: "Basics", roundPro: "Expert round", roundDone: "Done",
        counter: (i, n) => `Question ${i} of ${n}`, pause: "Break", resultLabel: "Result",
        next: "Next question", showResult: "Show result",
        interludeTitle: (s, n) => `Basics: ${s} of ${n} correct.`,
        interludeText: (n) => `Now it gets technical: load capacity, attachments, truck loading, LPG. ${n} questions that make even experienced drivers think twice.`,
        startPro: "Start the expert round",
        correctWord: "correct",
        results: {
            strong: ["Strong. You know more than most drivers.", "In practice, however: nobody may drive without training according to DGUV G 308-001 and written authorisation."],
            solid: ["A solid basis. But a few gaps.", "Exactly these gaps lead to accidents in practice. In our training we close them with theory and practice on the forklift."],
            weak: ["Good that you know it now.", "You can learn to drive a forklift in a few days. Driving safely means knowing the rules before something happens."],
        },
        rememberTitle: "Worth remembering",
        ctaTitle: "Forklift licence at Staplero",
        ctaText: "Training according to DGUV Principle 308-001 in Berlin and Görlitz/Zgorzelec. In German, Polish, Ukrainian, Russian or English.",
        ctaCourses: "View course dates", ctaCompany: "Request company training",
        restart: "Restart quiz",
        about: [
            { title: "Forklift licence at Staplero", text: "Forklift driver training according to DGUV Principle 308-001, with theory, practice and exam. Also for aerial work platforms and cranes." },
            { title: "In 5 languages", text: "German, Polish, Ukrainian, Russian and English. Your team understands the safety rules in their own language." },
            { title: "Berlin and Görlitz/Zgorzelec", text: "Training at both locations or directly at your company." },
        ],
        disclaimer: "This quiz is for orientation only and does not replace training according to DGUV Principle 308-001. The load capacity chart shows example values.",
    },
    pl: {
        eyebrow: "Quiz na wózki widłowe · Test na uprawnienia",
        h1: "Jazda wózkiem widłowym nie jest trudna.",
        h1Highlight: "Ale są rzeczy, których jeszcze nie wiesz.",
        lead: (n) => `${n} pytań z praktyki, zgodnie z DGUV Vorschrift 68 i DGUV Grundsatz 308-001. Po każdej odpowiedzi od razu widzisz, dlaczego jest dobra lub zła.`,
        facts: (g, p) => [`${g} pytań podstawowych`, `${p} pytań dla profesjonalistów`, "ok. 5 minut", "za darmo, bez rejestracji"],
        roundBasic: "Podstawy", roundPro: "Runda pro", roundDone: "Koniec",
        counter: (i, n) => `Pytanie ${i} z ${n}`, pause: "Przerwa", resultLabel: "Wynik",
        next: "Następne pytanie", showResult: "Pokaż wynik",
        interludeTitle: (s, n) => `Podstawy: ${s} z ${n} poprawnie.`,
        interludeText: (n) => `Teraz robi się technicznie: udźwig, osprzęt, załadunek ciężarówki, gaz LPG. ${n} pytań, nad którymi zastanawiają się nawet doświadczeni kierowcy.`,
        startPro: "Rozpocznij rundę pro",
        correctWord: "poprawnie",
        results: {
            strong: ["Świetnie. Wiesz więcej niż większość kierowców.", "W praktyce i tak obowiązuje zasada: bez szkolenia wg DGUV G 308-001 i pisemnego upoważnienia nikt nie może jeździć."],
            solid: ["Solidne podstawy. Ale jest kilka luk.", "Właśnie takie luki prowadzą w praktyce do wypadków. Na szkoleniu zamykamy je teorią i praktyką na wózku."],
            weak: ["Dobrze, że już to wiesz.", "Jazdy wózkiem można się nauczyć w kilka dni. Bezpieczna jazda to znajomość zasad, zanim coś się stanie."],
        },
        rememberTitle: "Warto zapamiętać",
        ctaTitle: "Uprawnienia na wózki w Staplero",
        ctaText: "Szkolenie wg DGUV Grundsatz 308-001 w Berlinie i Görlitz/Zgorzelcu. Po niemiecku, polsku, ukraińsku, rosyjsku lub angielsku.",
        ctaCourses: "Zobacz terminy kursów", ctaCompany: "Zapytaj o szkolenie dla firmy",
        restart: "Rozwiąż quiz od nowa",
        about: [
            { title: "Uprawnienia w Staplero", text: "Szkolenie operatorów wózków widłowych wg DGUV Grundsatz 308-001: teoria, praktyka i egzamin. Także na podesty ruchome i suwnice." },
            { title: "W 5 językach", text: "Niemiecki, polski, ukraiński, rosyjski i angielski. Twój zespół zrozumie zasady bezpieczeństwa we własnym języku." },
            { title: "Berlin i Görlitz/Zgorzelec", text: "Szkolenia w obu lokalizacjach albo bezpośrednio w Twojej firmie." },
        ],
        disclaimer: "Ten quiz służy orientacji i nie zastępuje szkolenia wg DGUV Grundsatz 308-001. Diagram udźwigu pokazuje przykładowe wartości.",
    },
    uk: {
        eyebrow: "Тест для водіїв навантажувачів",
        h1: "Керувати навантажувачем не складно.",
        h1Highlight: "Але є речі, яких ви ще не знаєте.",
        lead: (n) => `${n} практичних питань відповідно до DGUV Vorschrift 68 і DGUV Grundsatz 308-001. Після кожної відповіді ви одразу бачите, чому вона правильна чи ні.`,
        facts: (g, p) => [`${g} базових питань`, `${p} професійних питань`, "бл. 5 хвилин", "безкоштовно, без реєстрації"],
        roundBasic: "Основи", roundPro: "Профі-раунд", roundDone: "Готово",
        counter: (i, n) => `Питання ${i} з ${n}`, pause: "Перерва", resultLabel: "Результат",
        next: "Наступне питання", showResult: "Показати результат",
        interludeTitle: (s, n) => `Основи: ${s} з ${n} правильно.`,
        interludeText: (n) => `Тепер технічніше: вантажопідйомність, навісне обладнання, завантаження вантажівки, зріджений газ. ${n} питань, над якими замислюються навіть досвідчені водії.`,
        startPro: "Почати профі-раунд",
        correctWord: "правильно",
        results: {
            strong: ["Чудово. Ви знаєте більше, ніж більшість водіїв.", "На практиці все одно діє правило: без навчання за DGUV G 308-001 і письмового доручення ніхто не має права керувати."],
            solid: ["Добра основа. Але є кілька прогалин.", "Саме такі прогалини на практиці призводять до аварій. На навчанні ми закриваємо їх теорією та практикою на навантажувачі."],
            weak: ["Добре, що тепер ви це знаєте.", "Керувати навантажувачем можна навчитися за кілька днів. Безпечно керувати означає знати правила, перш ніж щось станеться."],
        },
        rememberTitle: "Варто запамʼятати",
        ctaTitle: "Посвідчення водія навантажувача в Staplero",
        ctaText: "Навчання за DGUV Grundsatz 308-001 у Берліні та Ґерліці/Згожельці. Німецькою, польською, українською, російською або англійською.",
        ctaCourses: "Переглянути дати курсів", ctaCompany: "Запит на навчання для компанії",
        restart: "Пройти тест знову",
        about: [
            { title: "Посвідчення в Staplero", text: "Навчання водіїв навантажувачів за DGUV Grundsatz 308-001: теорія, практика та іспит. Також для підйомних платформ і кранів." },
            { title: "5 мов", text: "Німецька, польська, українська, російська та англійська. Ваша команда розуміє правила безпеки рідною мовою." },
            { title: "Берлін і Ґерліц/Згожелець", text: "Навчання в обох локаціях або безпосередньо на вашому підприємстві." },
        ],
        disclaimer: "Цей тест має орієнтовний характер і не замінює навчання за DGUV Grundsatz 308-001. Діаграма вантажопідйомності показує приклади значень.",
    },
};
