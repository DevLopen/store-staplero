import { useState, useEffect, useCallback } from "react";
import { Search, Users, ChevronLeft, ChevronRight, RefreshCw, Filter, Mail, Phone, ShieldCheck, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const fmtDate = (s: string) => new Date(s).toLocaleDateString("de-DE");

const AdminUsers = () => {
    const [users,      setUsers]      = useState<any[]>([]);
    const [loading,    setLoading]    = useState(true);
    const [search,     setSearch]     = useState("");
    const [roleFilter, setRoleFilter] = useState("");
    const [page,       setPage]       = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total,      setTotal]      = useState(0);

    const authH = () => ({
        Authorization: `Bearer ${localStorage.getItem("token")}`,
    });

    const fetch_ = useCallback(async () => {
        setLoading(true);
        try {
            const p = new URLSearchParams({
                page: String(page), limit: "20",
                ...(search && { search }),
                ...(roleFilter && { role: roleFilter }),
            });
            const res = await fetch(`${API}/auth/users?${p}`, { headers: authH() });
            if (res.ok) {
                const d = await res.json();
                setUsers(d.users || []);
                setTotal(d.total || d.users?.length || 0);
                setTotalPages(d.totalPages || 1);
            }
        } catch {} finally { setLoading(false); }
    }, [page, search, roleFilter]);

    useEffect(() => { fetch_(); }, [fetch_]);
    useEffect(() => { setPage(1); }, [search, roleFilter]);

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h2 className="text-xl font-bold">Benutzer</h2>
                    <p className="text-sm text-muted-foreground">{total} registrierte Benutzer</p>
                </div>
                <Button variant="outline" size="sm" onClick={fetch_}>
                    <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Aktualisieren
                </Button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text" placeholder="Name oder E-Mail suchen…"
                        value={search} onChange={e => setSearch(e.target.value)}
                        className="w-full bg-background border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                </div>
                <Select value={roleFilter || "all"} onValueChange={v => setRoleFilter(v === "all" ? "" : v)}>
                    <SelectTrigger className="w-40">
                        <Filter className="w-3.5 h-3.5 mr-2" />
                        <SelectValue placeholder="Alle Rollen" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Alle Rollen</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="user">Benutzer</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Table */}
            <Card>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="w-7 h-7 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : users.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                            <p className="text-sm">Keine Benutzer gefunden</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                <tr className="border-b border-border bg-muted/30">
                                    {["Name", "E-Mail", "Telefon", "Kurse", "Registriert", "Rolle"].map(h => (
                                        <th key={h} className="text-left text-xs font-bold text-muted-foreground uppercase tracking-wide px-4 py-3">{h}</th>
                                    ))}
                                </tr>
                                </thead>
                                <tbody>
                                {users.map(u => (
                                    <tr key={u._id || u.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                                        <td className="px-4 py-3">
                                            <p className="font-semibold text-sm">{u.name || u.firstName + " " + u.lastName}</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                                                <Mail className="w-3 h-3 flex-shrink-0" />
                                                {u.email}
                                            </p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="text-sm text-muted-foreground">
                                                {u.phone ? (
                                                    <span className="flex items-center gap-1">
                                                            <Phone className="w-3 h-3" />{u.phone}
                                                        </span>
                                                ) : "–"}
                                            </p>
                                        </td>
                                        <td className="px-4 py-3">
                                                <span className="text-sm">
                                                    {u.activeCourses ?? 0} aktiv / {u.purchasedCoursesCount ?? u.totalCourses ?? 0} gesamt
                                                </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-sm text-muted-foreground">{fmtDate(u.createdAt)}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            {u.isAdmin ? (
                                                <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">
                                                        <ShieldCheck className="w-3 h-3" /> Admin
                                                    </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground font-medium">
                                                        <User className="w-3 h-3" /> Benutzer
                                                    </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">Seite {page} von {totalPages} · {total} Benutzer</p>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setPage(p => p-1)} disabled={page <= 1}>
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setPage(p => p+1)} disabled={page >= totalPages}>
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminUsers;