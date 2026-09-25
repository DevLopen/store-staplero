import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Home, CalendarDays, Award, Receipt, User, LogOut, Settings, Globe, ChevronDown } from "lucide-react";
import { getDashboard } from "@/api/dashboard.api";
import { DashboardCourse, DashboardData } from "@/types/dashboard";
import { useToast } from "@/hooks/use-toast";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLanguage } from "@/contexts/LanguageContext";
import { CertificateActions, CertificateCard, CertificatePending, SeedBanner } from "@/components/CertificateSection";
import WalletCard from "@/components/dashboard/WalletCard";
import BookingTicket from "@/components/dashboard/BookingTicket";
import { API, authHeaders, Booking, PanelCertificate, bookingsFromOrders, fill, fmtDate, fmtMoney } from "@/components/dashboard/panelUtils";
import logo from "@/assets/staplero-white-cropped.svg";
import { clearUserSession } from "@/utils/auth";

// ─── Zakładki z własnym adresem (#zertifikate itd.), żeby linki z maili otwierały właściwy widok ───

type Tab = "home" | "kurse" | "zert" | "best" | "profil";
const TAB_HASH: Record<Tab, string> = { home: "", kurse: "#kurse", zert: "#zertifikate", best: "#bestellungen", profil: "#profil" };
const tabFromHash = (hash: string): Tab =>
    (Object.entries(TAB_HASH).find(([, h]) => h && h === hash)?.[0] as Tab) || "home";

const initials = (name: string) => name.split(" ").filter(Boolean).map((n) => n[0]).join("").slice(0, 2).toUpperCase();

const pill = "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider";
const btn = "inline-flex min-h-[44px] items-center justify-center gap-2 whitespace-nowrap rounded px-[18px] text-sm font-bold transition-colors";

// ─── Bloki ────────────────────────────────────────────────────────────────────

const Block = ({ title, action, children }: { title?: string; action?: React.ReactNode; children: React.ReactNode }) => (
    <section className="rounded-md border border-border bg-white">
        {title && (
            <div className="flex items-baseline justify-between gap-2.5 px-5 pt-4">
                <h3 className="font-display text-[21px] font-extrabold uppercase">{title}</h3>
                {action}
            </div>
        )}
        <div className="px-5 pb-5 pt-3.5">{children}</div>
    </section>
);

const Empty = ({ icon: Icon, title, text, action }: { icon: any; title: string; text: string; action?: React.ReactNode }) => (
    <div className="grid grid-cols-[64px_1fr] items-start gap-4">
        <div className="grid h-16 w-16 place-items-center rounded-md bg-secondary"><Icon className="h-7 w-7 text-muted-foreground" /></div>
        <div>
            <h4 className="mb-1 font-sans text-base font-bold normal-case tracking-normal">{title}</h4>
            <p className="text-sm text-muted-foreground">{text}</p>
            {action && <div className="mt-3 flex flex-wrap gap-2">{action}</div>}
        </div>
    </div>
);

const CourseBlock = ({ course, isAdmin, detailed }: { course: DashboardCourse; isAdmin: boolean; detailed?: boolean }) => {
    const { t, language } = useLanguage();
    const [open, setOpen] = useState(!!detailed);
    const firstTopic = course.chapters[0]?.topics[0];
    const lastValid = course.lastPosition && course.chapters.some((ch) => ch.id === course.lastPosition!.chapterId && ch.topics.some((tp: any) => tp.id === course.lastPosition!.topicId));
    const resume = lastValid
        ? `/course/${course._id}/chapter/${course.lastPosition!.chapterId}/topic/${course.lastPosition!.topicId}`
        : firstTopic ? `/course/${course._id}/chapter/${course.chapters[0].id}/topic/${firstTopic.id}` : `/course/${course._id}`;
    const done = course.finalQuizResult?.passed === true;
    const canFinal = course.chapters.every((ch) => ch.status === "complete");
    const expired = !isAdmin && course.daysRemaining !== null && course.daysRemaining <= 0;

    return (
        <div className="grid grid-cols-[96px_1fr] items-start gap-4">
            {course.thumbnailUrl
                ? <img src={course.thumbnailUrl} alt="" className="h-24 w-24 rounded-md object-cover" />
                : <div className="grid h-24 w-24 place-items-center rounded-md bg-[#212121] font-display text-3xl font-extrabold text-primary">68</div>}
            <div className="min-w-0">
                <h4 className="font-sans text-base font-bold normal-case tracking-normal">{course.title}</h4>
                <p className="mt-0.5 text-[13px] text-muted-foreground">
                    {done
                        ? fill(t("panel.courseDone"), { s: course.finalQuizResult?.score ?? 0 })
                        : expired
                            ? t("panel.accessExpired")
                            : course.daysRemaining !== null
                                ? `${fill(t("panel.accessLeft"), { n: course.daysRemaining })}${course.expiresAt ? ` · ${fill(t("panel.accessUntil"), { date: fmtDate(course.expiresAt, language) })}` : ""}`
                                : ""}
                </p>
                <div className="mb-1.5 mt-3 h-2 overflow-hidden rounded bg-[#ececec]">
                    <i className="block h-full rounded bg-primary transition-[width] duration-700" style={{ width: `${course.progressPercent}%` }} />
                </div>
                <div className="flex justify-between text-xs tabular-nums text-muted-foreground">
                    <span>{fill(t("panel.topicsOf"), { a: course.completedTopics, b: course.totalTopics })}</span>
                    <span>{course.progressPercent} %</span>
                </div>
                <div className="mt-3.5 flex flex-wrap gap-2">
                    {!expired && !done && (
                        <Link to={resume} className={`${btn} bg-[#212121] text-white hover:bg-[#363636]`}>
                            {lastValid ? t("panel.continue") : t("panel.start")}
                        </Link>
                    )}
                    {canFinal && !done && !expired && (
                        <Link to={`/course/${course._id}/final-quiz`} className={`${btn} bg-primary text-[#111]`}>{t("panel.finalExam")}</Link>
                    )}
                    {done && !expired && <Link to={resume} className={`${btn} border-2 border-foreground`}>{t("panel.reopen")}</Link>}
                    {course.chapters.length > 0 && !detailed && (
                        <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="inline-flex items-center gap-1 px-2 text-[13px] font-semibold text-muted-foreground hover:text-foreground">
                            {fill(t("panel.chaptersN"), { n: course.chapters.length })} <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
                        </button>
                    )}
                </div>
                {open && (
                    <ul className="mt-3.5 border-t border-border">
                        {course.chapters.map((ch, i) => (
                            <li key={ch.id} className="grid grid-cols-[24px_1fr_auto] items-center gap-2 border-b border-[#f0f0f0] py-2 text-[13px]">
                                <span className={`grid h-5 w-5 place-items-center rounded-full text-[11px] font-bold ${ch.status === "complete" ? "bg-[#e3f3e8] text-[#166534]" : ch.status === "blocked" ? "bg-[#ececec] text-[#9a9a9a]" : "bg-primary text-[#111]"}`}>
                                    {ch.status === "complete" ? "✓" : i + 1}
                                </span>
                                <span className={ch.status === "blocked" ? "text-muted-foreground" : ""}>{i + 1}. {ch.title}</span>
                                <em className="text-xs not-italic text-muted-foreground">{ch.status === "blocked" ? t("panel.locked") : ""}</em>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

const OrdersTable = ({ orders, limit }: { orders: any[]; limit?: number }) => {
    const { t, language } = useLanguage();
    const rows = limit ? orders.slice(0, limit) : orders;
    const statusPill: Record<string, string> = {
        paid: "bg-[#e3f3e8] text-[#166534]", pending: "bg-[#fde7cf] text-[#9a4a00]",
        cancelled: "bg-[#ececec] text-[#39393b]", expired: "bg-[#ececec] text-[#39393b]",
    };
    return (
        <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-sm">
                <thead>
                    <tr className="border-b border-border text-left text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                        <th className="pb-2.5 pr-3 font-bold">{t("panel.colOrder")}</th>
                        <th className="pb-2.5 pr-3 font-bold">{t("panel.colProduct")}</th>
                        <th className="pb-2.5 pr-3 font-bold">{t("panel.colStatus")}</th>
                        <th className="pb-2.5 text-right font-bold">{t("panel.colAmount")}</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((o) => {
                        const d = o.practicalCourseDetails;
                        const persons = d ? 1 + (d.additionalParticipants?.length || 0) : null;
                        return (
                            <tr key={o._id} className="border-b border-[#f0f0f0] align-top">
                                <td className="py-3 pr-3"><span className="font-mono text-xs">{o.orderNumber}</span><small className="block text-xs text-muted-foreground">{fmtDate(o.createdAt, language)}</small></td>
                                <td className="py-3 pr-3">
                                    {(o.items || []).filter((it: any) => it.type !== "practical-addon").map((it: any) => it.courseName).join(", ") || "—"}
                                    {d && <small className="block text-xs text-muted-foreground">{fill(t("panel.participants"), { n: persons! })} · {d.locationName} · {fmtDate(d.startDate, language)}</small>}
                                </td>
                                <td className="py-3 pr-3"><span className={`${pill} ${statusPill[o.status] || statusPill.cancelled}`}>{t(`panel.status_${o.status}`)}</span></td>
                                <td className="py-3 text-right tabular-nums">{fmtMoney(o.totalAmount, language)}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

// ─── Strona ───────────────────────────────────────────────────────────────────

const Dashboard = () => {
    const { t, language } = useLanguage();
    const navigate = useNavigate();
    const { toast } = useToast();

    const [data, setData] = useState<DashboardData | null>(null);
    const [certs, setCerts] = useState<PanelCertificate[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTabState] = useState<Tab>(() => tabFromHash(window.location.hash));

    useEffect(() => {
        if (!localStorage.getItem("token")) { navigate("/login"); return; }
        Promise.all([
            getDashboard(),
            fetch(`${API}/certificates/my`, { headers: authHeaders() }).then((r) => (r.ok ? r.json() : [])).catch(() => []),
        ])
            .then(([dash, list]) => { setData(dash); setCerts(Array.isArray(list) ? list : []); })
            .catch((err) => {
                if (err?.status === 401) { localStorage.removeItem("token"); navigate("/login"); return; }
                toast({ title: t("panel.loadError"), variant: "destructive" });
            })
            .finally(() => setLoading(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const onHash = () => setTabState(tabFromHash(window.location.hash));
        window.addEventListener("hashchange", onHash);
        return () => window.removeEventListener("hashchange", onHash);
    }, []);

    const setTab = useCallback((next: Tab) => {
        setTabState(next);
        window.history.replaceState(null, "", `/dashboard${TAB_HASH[next]}`);
        window.scrollTo({ top: 0 });
    }, []);

    const handleLogout = () => {
        clearUserSession();
        navigate("/login");
    };

    const bookings: Booking[] = useMemo(() => (data ? bookingsFromOrders(data.orders, data.user.name) : []), [data]);

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-secondary">
                <div className="text-center">
                    <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    <p className="mt-4 text-sm text-muted-foreground">{t("panel.loading")}</p>
                </div>
            </div>
        );
    }
    if (!data) {
        return <div className="flex min-h-screen items-center justify-center bg-secondary p-6 text-center text-muted-foreground">{t("panel.loadError")}</div>;
    }

    const { user, courses, orders } = data;
    const isAdmin = user.isAdmin;
    const practicalCert = certs.find((c) => c.type === "practical");
    const mainCert = practicalCert || certs[0];
    const nextBooking = bookings.find((b) => !b.finished);
    const lastBooking = bookings[0];
    const onlineCourse = courses[0];
    const firstName = user.name.split(" ")[0];

    const nav: Array<{ id: Tab; label: string; icon: any; count?: number }> = [
        { id: "home", label: t("panel.navOverview"), icon: Home },
        { id: "kurse", label: t("panel.navCourses"), icon: CalendarDays },
        { id: "zert", label: t("panel.navCertificates"), icon: Award, count: certs.length || undefined },
        { id: "best", label: t("panel.navOrders"), icon: Receipt },
        { id: "profil", label: t("panel.navProfile"), icon: User },
    ];
    const current = nav.find((n) => n.id === tab)!;

    const subtitle = practicalCert
        ? t("panel.subCert")
        : nextBooking
            ? nextBooking.daysLeft > 1 ? fill(t("panel.subDays"), { n: nextBooking.daysLeft })
                : nextBooking.daysLeft === 1 ? t("panel.subTomorrow") : t("panel.subToday")
            : t("panel.subDefault");

    const theoryPercent = onlineCourse ? onlineCourse.progressPercent : undefined;

    const pageTitle = (title: string, sub?: string) => (
        <div>
            <h2 className="font-display text-[38px] font-extrabold uppercase leading-[0.95]">{title}</h2>
            {sub && <p className="mt-1.5 text-muted-foreground">{sub}</p>}
        </div>
    );

    const noCourses = !onlineCourse && bookings.length === 0;

    return (
        <div className="min-h-screen bg-secondary text-foreground lg:grid lg:grid-cols-[232px_minmax(0,1fr)]">
            {/* ── Menu boczne ── */}
            <aside className="hidden flex-col gap-[18px] border-r border-border bg-white px-3.5 py-[18px] lg:sticky lg:top-0 lg:flex lg:h-screen">
                <Link to="/" className="mx-1.5 mt-0.5"><img src={logo} alt="STAPLERO" className="h-[30px]" /></Link>
                <div className="flex items-center gap-2.5 rounded-md bg-secondary p-2.5">
                    <div className="grid h-[34px] w-[34px] flex-shrink-0 place-items-center rounded-full bg-[#212121] text-[13px] font-bold text-white">{initials(user.name)}</div>
                    <div className="min-w-0"><b className="block truncate text-[13px]">{user.name}</b><span className="block truncate text-xs text-muted-foreground">{user.email}</span></div>
                </div>
                {isAdmin && (
                    <Link to="/admin" className="flex items-center gap-2.5 rounded-[5px] bg-primary px-3 py-2.5 text-sm font-bold text-[#111] hover:brightness-95">
                        <Settings className="h-[17px] w-[17px]" />{t("panel.adminPanel")}
                    </Link>
                )}
                <nav aria-label={t("panel.area")} className="grid gap-[3px]">
                    {nav.map((n) => (
                        <button key={n.id} type="button" onClick={() => setTab(n.id)} aria-current={tab === n.id ? "page" : undefined}
                            className={`flex w-full items-center gap-2.5 rounded-[5px] px-3 py-2.5 text-left text-sm font-medium transition-colors ${tab === n.id ? "bg-[#212121] text-white" : "text-[#39393b] hover:bg-secondary"}`}>
                            <n.icon className="h-[17px] w-[17px] flex-shrink-0" />{n.label}
                            {n.count ? <span className="ml-auto rounded-full bg-primary px-[7px] py-px text-[11px] font-bold text-[#111]">{n.count}</span> : null}
                        </button>
                    ))}
                </nav>
                <div className="mt-auto grid gap-[3px] border-t border-border pt-3 text-sm">
                    <Link to="/" className="flex items-center gap-2.5 rounded-[5px] px-3 py-2.5 text-muted-foreground hover:bg-secondary"><Globe className="h-[17px] w-[17px]" />{t("panel.website")}</Link>
                    <button type="button" onClick={handleLogout} className="flex items-center gap-2.5 rounded-[5px] px-3 py-2.5 text-left text-muted-foreground hover:bg-secondary"><LogOut className="h-[17px] w-[17px]" />{t("panel.logout")}</button>
                </div>
            </aside>

            <div className="min-w-0">
                {/* ── Górny pasek ── */}
                <header className="sticky top-0 z-30 border-b border-border bg-white">
                    <div className="flex items-center justify-between gap-3 px-4 py-3.5 sm:px-[26px]">
                        <Link to="/" className="lg:hidden"><img src={logo} alt="STAPLERO" className="h-7" /></Link>
                        <span className="hidden text-[13px] text-muted-foreground lg:block">{t("panel.area")} · {current.label}</span>
                        <div className="flex items-center gap-2">
                            {isAdmin && (
                                <Link to="/admin" className="inline-flex min-h-[40px] items-center gap-2 rounded bg-primary px-3.5 text-sm font-bold text-[#111] hover:brightness-95">
                                    <Settings className="h-4 w-4" /><span className="hidden sm:inline">{t("panel.adminPanel")}</span>
                                </Link>
                            )}
                            <LanguageSwitcher />
                            <button type="button" onClick={handleLogout} className="grid h-9 w-9 place-items-center rounded-full bg-[#212121] text-xs font-bold text-white lg:hidden" aria-label={t("panel.logout")}>{initials(user.name)}</button>
                        </div>
                    </div>
                    <nav aria-label={t("panel.area")} className="flex gap-1 overflow-x-auto px-3 pb-2.5 lg:hidden">
                        {nav.map((n) => (
                            <button key={n.id} type="button" onClick={() => setTab(n.id)} aria-current={tab === n.id ? "page" : undefined}
                                className={`flex flex-shrink-0 items-center gap-1.5 rounded-[5px] px-3 py-2 text-[13px] font-medium ${tab === n.id ? "bg-[#212121] text-white" : "text-[#39393b]"}`}>
                                <n.icon className="h-4 w-4" />{n.label}
                            </button>
                        ))}
                    </nav>
                </header>

                <main className="grid grid-cols-[minmax(0,1fr)] gap-5 px-4 py-6 sm:px-[26px]">
                    {/* ── Übersicht ── */}
                    {tab === "home" && (
                        <>
                            {pageTitle(fill(t("panel.hello"), { name: firstName }), subtitle)}

                            {practicalCert && (
                                <section className="grid items-center gap-[22px] rounded-md border border-border bg-white p-5 md:grid-cols-[320px_1fr]">
                                    <WalletCard cert={practicalCert} holder={practicalCert.userName} />
                                    <div>
                                        <span className={`${pill} bg-[#15803d] text-white`}>✓ {fill(t("panel.issuedOn"), { date: fmtDate(practicalCert.issuedAt, language) })}</span>
                                        <h3 className="mb-1.5 mt-2.5 font-display text-[30px] font-extrabold uppercase leading-none">{t("panel.certReadyTitle")}</h3>
                                        <p className="mb-3.5 text-muted-foreground">{t("panel.certReadyText")}</p>
                                        <CertificateActions cert={practicalCert} />
                                    </div>
                                </section>
                            )}

                            {!practicalCert && nextBooking && <BookingTicket booking={nextBooking} />}

                            {noCourses && !mainCert ? (
                                <Block>
                                    <Empty icon={CalendarDays} title={t("panel.noCoursesTitle")} text={t("panel.noCoursesText")}
                                        action={<Link to="/kursy" className={`${btn} bg-primary text-[#111]`}>{t("panel.browse")}</Link>} />
                                </Block>
                            ) : (
                                <div className="grid grid-cols-[minmax(0,1fr)] gap-5 xl:grid-cols-2">
                                    {onlineCourse && (
                                        <Block title={t("panel.onlineTheory")} action={courses.length > 1 ? <button type="button" onClick={() => setTab("kurse")} className="text-[13px] font-semibold underline">{t("panel.allCourses")}</button> : undefined}>
                                            <CourseBlock course={onlineCourse} isAdmin={isAdmin} />
                                        </Block>
                                    )}
                                    {!practicalCert && nextBooking && (
                                        <Block title={t("panel.yourCert")}>
                                            <p className="mb-3.5 text-sm text-muted-foreground">{fill(t("panel.certPendingText"), { date: fmtDate(nextBooking.end, language, { day: "2-digit", month: "2-digit" }) })}</p>
                                            <WalletCard holder={user.name} pendingDate={nextBooking.end} pendingCity={nextBooking.city} />
                                        </Block>
                                    )}
                                    {practicalCert && lastBooking && (
                                        <Block title={t("panel.practicalTitle")}>
                                            <Empty icon={CalendarDays} title={`${t("panel.courseFinished")} · ${lastBooking.city}`}
                                                text={`${fmtDate(lastBooking.start, language, { day: "2-digit", month: "2-digit" })}–${fmtDate(lastBooking.end, language)}${practicalCert.instructorName ? ` · ${t("panel.instructor")} ${practicalCert.instructorName}` : ""}`} />
                                        </Block>
                                    )}
                                    {!practicalCert && !nextBooking && (
                                        <Block title={t("panel.yourCert")}>
                                            {mainCert
                                                ? <div className="grid gap-4"><WalletCard cert={mainCert} holder={mainCert.userName} /><CertificateActions cert={mainCert} /></div>
                                                : <Empty icon={Award} title={t("panel.noCertTitle")} text={t("panel.noCertText")} />}
                                        </Block>
                                    )}
                                </div>
                            )}

                            {orders.length > 0 && (
                                <Block title={t("panel.lastOrders")} action={orders.length > 3 ? <button type="button" onClick={() => setTab("best")} className="text-[13px] font-semibold underline">{t("panel.showAll")}</button> : undefined}>
                                    <OrdersTable orders={orders} limit={3} />
                                </Block>
                            )}
                        </>
                    )}

                    {/* ── Kurse & Termine ── */}
                    {tab === "kurse" && (
                        <>
                            {pageTitle(t("panel.coursesTitle"), t("panel.coursesSub"))}
                            {bookings.map((b) => <BookingTicket key={b.orderNumber} booking={b} variant="participants" />)}
                            {courses.map((c) => (
                                <Block key={c._id} title={c.title}>
                                    <CourseBlock course={c} isAdmin={isAdmin} detailed />
                                </Block>
                            ))}
                            {noCourses && (
                                <Block>
                                    <Empty icon={CalendarDays} title={t("panel.noCoursesTitle")} text={t("panel.noCoursesText")}
                                        action={<Link to="/kursy" className={`${btn} bg-primary text-[#111]`}>{t("panel.browse")}</Link>} />
                                </Block>
                            )}
                        </>
                    )}

                    {/* ── Zertifikate ── */}
                    {tab === "zert" && (
                        <>
                            {pageTitle(t("panel.certsTitle"), t("panel.certsSub"))}
                            {isAdmin && <SeedBanner />}
                            {certs.map((c) => <CertificateCard key={c._id} cert={c} />)}
                            {!practicalCert && nextBooking && (
                                <CertificatePending booking={nextBooking} holder={user.name} theoryPercent={theoryPercent} onGoToBooking={() => setTab("kurse")} />
                            )}
                            {certs.length === 0 && !nextBooking && (
                                <Block><Empty icon={Award} title={t("panel.noCertTitle")} text={t("panel.noCertText")} /></Block>
                            )}
                        </>
                    )}

                    {/* ── Bestellungen ── */}
                    {tab === "best" && (
                        <>
                            {pageTitle(t("panel.ordersTitle"), t("panel.ordersSub"))}
                            <Block>
                                {orders.length
                                    ? <OrdersTable orders={orders} />
                                    : <Empty icon={Receipt} title={t("panel.noOrdersTitle")} text={t("panel.noOrdersText")} />}
                            </Block>
                        </>
                    )}

                    {/* ── Profil ── */}
                    {tab === "profil" && (
                        <>
                            {pageTitle(t("panel.profileTitle"), t("panel.profileSub"))}
                            <Block>
                                <div className="mb-4 grid grid-cols-1 border-y border-border sm:grid-cols-2">
                                    <div className="py-2.5 pr-3"><small className="block text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">{t("panel.name")}</small><b className="break-words">{user.name}</b></div>
                                    <div className="border-t border-border py-2.5 sm:border-l sm:border-t-0 sm:pl-3"><small className="block text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">{t("panel.email")}</small><b className="break-all">{user.email}</b></div>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <Link to="/forgot-password" className={`${btn} border-2 border-foreground`}>{t("panel.changePassword")}</Link>
                                    <button type="button" onClick={handleLogout} className={`${btn} border-2 border-foreground`}>{t("panel.logout")}</button>
                                    {isAdmin && <Link to="/admin" className={`${btn} bg-primary text-[#111]`}>{t("panel.adminPanel")}</Link>}
                                </div>
                            </Block>
                        </>
                    )}
                </main>
            </div>
        </div>
    );
};

export default Dashboard;
