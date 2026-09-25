import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Booking, calendarUrl, fill, fmtShortDay, routeUrl } from "./panelUtils";

/** Termin kursu praktycznego jako ciemny „bilet” — ten sam układ co w mailu z potwierdzeniem */

const btn = "inline-flex min-h-[44px] items-center justify-center gap-2 whitespace-nowrap rounded px-[18px] text-sm font-bold transition-colors";

const ARRIVAL_STEPS = ["arr1", "arr2", "arr3", "arr4"];

interface Props {
    booking: Booking;
    variant?: "bring" | "participants";
}

const BookingTicket = ({ booking, variant = "bring" }: Props) => {
    const { t, language } = useLanguage();
    const [showArrival, setShowArrival] = useState(false);
    const isBerlin = /berlin/i.test(booking.city);
    const done = booking.finished;

    // „noch {n} Tage” z liczbą wyróżnioną na pomarańczowo
    const [daysPre, daysPost = ""] = t("panel.daysLeft").split("{n}");

    return (
        <div className={done ? "rounded-md border border-border bg-white p-[22px] text-foreground" : "rounded-md bg-[#212121] p-[22px] text-white"}>
            <div className={`grid gap-[22px] ${done ? "" : "lg:grid-cols-[1.35fr_1fr]"}`}>
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-2.5">
                        {done ? (
                            <span className="rounded-full bg-[#e3f3e8] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[#166534]">✓ {t("panel.courseFinished")}</span>
                        ) : (
                            <span className="rounded-full bg-[#15803d] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white">✓ {t("panel.bookingConfirmed")}</span>
                        )}
                        {!done && booking.daysLeft > 0 && (
                            <span className="text-[13px] text-[#d4d4d4]">
                                {daysPre}<b className="font-display text-[22px] font-extrabold text-primary">{booking.daysLeft}</b>{daysPost}
                            </span>
                        )}
                    </div>

                    <h3 className="mb-4 mt-3.5 font-display text-[30px] font-extrabold uppercase leading-none">{t("panel.practicalTitle")}</h3>

                    <div className={`grid grid-cols-1 rounded-md border sm:grid-cols-2 ${done ? "border-border bg-secondary" : "border-[#474747] bg-[#363636]"}`}>
                        {[
                            [t("panel.day1"), booking.start],
                            [t("panel.day2"), booking.end],
                        ].map(([label, date], i) => (
                            <div key={i} className={`px-4 py-3.5 ${i > 0 ? (done ? "border-t border-dashed border-[#d6d6d6] sm:border-l sm:border-t-0" : "border-t border-dashed border-[#5a5a5a] sm:border-l sm:border-t-0") : ""}`}>
                                <small className="block text-[11px] font-bold uppercase tracking-[0.14em] text-primary">{label as string}</small>
                                <b className="mt-1 block font-display text-2xl font-extrabold uppercase leading-tight">{fmtShortDay(date as Date, language)}</b>
                                <span className={`text-[13px] ${done ? "text-muted-foreground" : "text-[#b5b5b5]"}`}>{t("panel.hours")}</span>
                            </div>
                        ))}
                    </div>

                    <p className={`mt-3 text-sm ${done ? "text-muted-foreground" : "text-[#d4d4d4]"}`}>
                        <b className={done ? "text-foreground" : "text-white"}>{booking.city}</b> · {booking.address} · {fill(t("panel.participants"), { n: booking.participants.length })}
                    </p>

                    {!done && (
                        <div className="mt-4 flex flex-wrap gap-2.5">
                            <a className={`${btn} bg-primary text-[#111] hover:brightness-95`} href={calendarUrl(booking.start, booking.address, booking.orderNumber)} target="_blank" rel="noopener noreferrer">{t("panel.addCalendar")}</a>
                            <a className={`${btn} border-2 border-white text-white hover:bg-white/10`} href={routeUrl(booking.address)} target="_blank" rel="noopener noreferrer">{t("panel.route")}</a>
                            {isBerlin && (
                                <button type="button" className={`${btn} border-2 border-white text-white hover:bg-white/10`} aria-expanded={showArrival} onClick={() => setShowArrival((v) => !v)}>
                                    {showArrival ? t("panel.arrivalHide") : t("panel.arrival")}
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {!done && (
                    <div className="self-start rounded-md bg-white px-[18px] py-4 text-foreground">
                        {variant === "bring" ? (
                            <>
                                <h4 className="mb-2.5 font-display text-[19px] font-extrabold uppercase">{t("panel.bring")}</h4>
                                <ul>
                                    {[
                                        ["bringId", "bringIdNote", true],
                                        ["bringShoes", "bringShoesNote", true],
                                        ["bringClothes", "bringClothesNote", false],
                                    ].map(([title, note, req], i) => (
                                        <li key={i} className="grid grid-cols-[26px_1fr_auto] items-start gap-1.5 border-t border-border py-2.5 text-sm first:border-t-0 first:pt-0.5">
                                            <span className={`mt-px grid h-5 w-5 place-items-center rounded text-xs font-bold ${req ? "bg-[#212121] text-white" : "border-2 border-[#212121] text-[#212121]"}`}>✓</span>
                                            <span>{t(`panel.${title}`)}<small className="block text-xs text-muted-foreground">{t(`panel.${note}`)}</small></span>
                                            {req ? <span className="whitespace-nowrap rounded-full bg-[#fde7cf] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[#9a4a00]">{t("panel.required")}</span> : <span />}
                                        </li>
                                    ))}
                                </ul>
                            </>
                        ) : (
                            <>
                                <h4 className="mb-2.5 font-display text-[19px] font-extrabold uppercase">{t("panel.registered")}</h4>
                                <ul>
                                    {booking.participants.map((p, i) => (
                                        <li key={i} className="grid grid-cols-[26px_1fr] items-start gap-1.5 border-t border-border py-2.5 text-sm first:border-t-0 first:pt-0.5">
                                            <span className="font-bold text-primary">{i + 1}.</span>
                                            <span>{p}{i === 0 && <small className="block text-xs text-muted-foreground">{t("panel.orderer")}</small>}</span>
                                        </li>
                                    ))}
                                </ul>
                            </>
                        )}
                    </div>
                )}
            </div>

            {showArrival && isBerlin && !done && (
                <div className="mt-5 rounded-md bg-white p-4 text-foreground">
                    <p className="mb-3 text-sm text-muted-foreground">{t("panel.arrivalIntro")}</p>
                    <ol className="grid gap-3 sm:grid-cols-2">
                        {ARRIVAL_STEPS.map((key, i) => (
                            <li key={key} className="grid grid-cols-[96px_1fr] items-start gap-3">
                                <img src={`/anfahrt-berlin-${i + 1}.jpg`} alt="" className="h-24 w-24 rounded-md object-cover" loading="lazy" />
                                <span>
                                    <small className="block font-display text-sm font-extrabold uppercase tracking-wider text-primary">{fill(t("panel.step"), { n: i + 1 })}</small>
                                    <span className="text-sm">{t(`panel.${key}`)}</span>
                                </span>
                            </li>
                        ))}
                    </ol>
                </div>
            )}
        </div>
    );
};

export default BookingTicket;
