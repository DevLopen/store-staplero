import { useEffect, useState, useCallback } from "react";
import {
  DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors, DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy, useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Plus, Edit, Trash2, Save, Loader2, ImagePlus, X, Star, StarOff,
  BookOpen, Forklift, RefreshCw, BellRing, Check as CheckIcon, Mail, Send, GripVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiUpload } from "@/api/http";
import { adminGetCourses } from "@/api/course.api";
import {
  adminGetProducts, adminCreateProduct, adminUpdateProduct, adminDeleteProduct, adminReorderProducts,
  adminGetNotifyRequests, adminMarkNotifyRequestDone, adminDeleteNotifyRequest, adminSendNotifyRequest, NotifyRequestItem,
} from "@/api/product.api";
import {
  Product, ProductType, emptyLocalizedText, emptyLocalizedList, LocalizedText, LocalizedList,
} from "@/types/product.types";
import { useConfirm, confirmDelete } from "@/components/ConfirmDialog";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const LANGS: { code: keyof LocalizedText; label: string }[] = [
  { code: "de", label: "Deutsch" },
  { code: "en", label: "English" },
  { code: "pl", label: "Polski" },
  { code: "uk", label: "Українська" },
];

interface LocationOption {
  _id: string;
  city: string;
  address: string;
}

interface CourseOption {
  _id: string;
  title: string;
}

type ProductForm = {
  type: ProductType;
  slug: string;
  title: LocalizedText;
  shortDescription: LocalizedText;
  description: LocalizedText;
  benefits: LocalizedList;
  thumbnailUrl: string;
  price: string;
  promoPrice: string;
  isPromoActive: boolean;
  priceUnit: "person" | "monthly";
  status: "draft" | "active";
  featured: boolean;
  courseId: string;
  locationIds: string[];
  includesOnlineAccess: boolean;
  linkedCourseId: string;
};

const emptyForm = (): ProductForm => ({
  type: "normal",
  slug: "",
  title: emptyLocalizedText(),
  shortDescription: emptyLocalizedText(),
  description: emptyLocalizedText(),
  benefits: emptyLocalizedList(),
  thumbnailUrl: "",
  price: "",
  promoPrice: "",
  isPromoActive: false,
  priceUnit: "person",
  status: "draft",
  featured: false,
  courseId: "",
  locationIds: [],
  includesOnlineAccess: false,
  linkedCourseId: "",
});

const productToForm = (p: Product): ProductForm => ({
  type: p.type,
  slug: p.slug,
  title: { ...emptyLocalizedText(), ...p.title },
  shortDescription: { ...emptyLocalizedText(), ...p.shortDescription },
  description: { ...emptyLocalizedText(), ...p.description },
  benefits: { ...emptyLocalizedList(), ...p.benefits },
  thumbnailUrl: p.thumbnailUrl || "",
  price: String(p.price ?? ""),
  promoPrice: p.promoPrice != null ? String(p.promoPrice) : "",
  isPromoActive: p.isPromoActive,
  priceUnit: p.priceUnit,
  status: p.status,
  featured: p.featured,
  courseId: p.courseId || "",
  locationIds: p.locationIds || [],
  includesOnlineAccess: p.includesOnlineAccess,
  linkedCourseId: p.linkedCourseId || "",
});

/** Kafelek produktu, który można przeciągać za uchwyt, żeby zmienić kolejność w sklepie */
function SortableProduct({ id, children }: { id: string; children: (handle: React.ReactNode) => React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const handle = (
    <button
      {...attributes}
      {...listeners}
      className="touch-none cursor-grab active:cursor-grabbing p-1 -ml-1 text-muted-foreground hover:text-foreground"
      title="Ziehen, um die Reihenfolge zu ändern"
      aria-label="Reihenfolge ändern"
    >
      <GripVertical className="w-4 h-4" />
    </button>
  );
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={isDragging ? "relative z-10 opacity-70" : undefined}
    >
      {children(handle)}
    </div>
  );
}

const AdminProducts = () => {
  const { toast } = useToast();
  const confirm = useConfirm();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [notifyRequests, setNotifyRequests] = useState<NotifyRequestItem[]>([]);
  const [notifyLoading, setNotifyLoading] = useState(true);
  const [notifyTab, setNotifyTab] = useState<"waiting" | "notified">("waiting");
  const [sendingNotifyId, setSendingNotifyId] = useState<string | null>(null);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm());
  const [activeLang, setActiveLang] = useState<keyof LocalizedText>("de");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = async ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const previous = products;
    const reordered = arrayMove(
      products,
      products.findIndex((p) => p._id === active.id),
      products.findIndex((p) => p._id === over.id)
    );
    setProducts(reordered);
    try {
      await adminReorderProducts(reordered.map((p) => p._id));
      toast({ title: "Reihenfolge gespeichert", description: "So erscheinen die Kurse jetzt im Shop." });
    } catch (err: any) {
      setProducts(previous);
      toast({ title: "Fehler", description: err.message || "Reihenfolge konnte nicht gespeichert werden", variant: "destructive" });
    }
  };

  const authH = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminGetProducts();
      setProducts(data.products);
    } catch (err: any) {
      toast({ title: "Fehler", description: err.message || "Produkte konnten nicht geladen werden", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  useEffect(() => {
    fetch(`${API_URL}/locations`)
      .then((res) => res.json())
      .then((data) => setLocations(Array.isArray(data) ? data : []))
      .catch(() => setLocations([]));

    adminGetCourses()
      .then((data) => setCourses(data.courses.map((c: any) => ({ _id: c._id, title: c.title }))))
      .catch(() => setCourses([]));
  }, []);

  const loadNotifyRequests = useCallback(async () => {
    setNotifyLoading(true);
    try {
      const data = await adminGetNotifyRequests();
      setNotifyRequests(data.requests);
    } catch {
      // cichy fallback — sekcja nie jest krytyczna dla reszty panelu
    } finally {
      setNotifyLoading(false);
    }
  }, []);

  useEffect(() => { loadNotifyRequests(); }, [loadNotifyRequests]);

  const handleMarkNotified = async (id: string) => {
    try {
      await adminMarkNotifyRequestDone(id);
      loadNotifyRequests();
    } catch (err: any) {
      toast({ title: "Fehler", description: err.message, variant: "destructive" });
    }
  };

  const handleSendNotifyRequest = async (id: string) => {
    setSendingNotifyId(id);
    try {
      await adminSendNotifyRequest(id);
      toast({ title: "E-Mail gesendet", description: "Die Person wurde über die aktuellen Termine informiert." });
      loadNotifyRequests();
    } catch (err: any) {
      toast({ title: "Nicht gesendet", description: err.message, variant: "destructive" });
    } finally {
      setSendingNotifyId(null);
    }
  };

  const handleDeleteNotifyRequest = async (id: string) => {
    const request = notifyRequests.find((r) => r._id === id);
    if (!(await confirmDelete(confirm, "Anfrage", `Die Anfrage von ${request?.email || "dieser Person"} wird gelöscht. Sie bekommt dann keine Benachrichtigung über neue Termine.`))) return;
    try {
      await adminDeleteNotifyRequest(id);
      loadNotifyRequests();
    } catch (err: any) {
      toast({ title: "Fehler", description: err.message, variant: "destructive" });
    }
  };

  const openCreateDialog = () => {
    setEditingId(null);
    setForm(emptyForm());
    setActiveLang("de");
    setIsDialogOpen(true);
  };

  const openEditDialog = (product: Product) => {
    setEditingId(product._id);
    setForm(productToForm(product));
    setActiveLang("de");
    setIsDialogOpen(true);
  };

  const updateLocalized = (
    field: "title" | "shortDescription" | "description",
    lang: keyof LocalizedText,
    value: string
  ) => {
    setForm((prev) => ({ ...prev, [field]: { ...prev[field], [lang]: value } }));
  };

  const updateBenefits = (lang: keyof LocalizedText, value: string) => {
    const lines = value.split("\n");
    setForm((prev) => ({ ...prev, benefits: { ...prev.benefits, [lang]: lines } }));
  };

  const toggleLocation = (locationId: string) => {
    setForm((prev) => ({
      ...prev,
      locationIds: prev.locationIds.includes(locationId)
        ? prev.locationIds.filter((id) => id !== locationId)
        : [...prev.locationIds, locationId],
    }));
  };

  const handleImageUpload = async (file: File) => {
    setIsUploadingImage(true);
    try {
      const result = await apiUpload(file);
      setForm((prev) => ({ ...prev, thumbnailUrl: result.url }));
    } catch (err: any) {
      toast({ title: "Fehler", description: err.message || "Bild-Upload fehlgeschlagen", variant: "destructive" });
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSave = async () => {
    if (!form.title.de && !form.title.en && !form.title.pl && !form.title.uk) {
      toast({ title: "Fehler", description: "Bitte geben Sie mindestens einen Titel ein", variant: "destructive" });
      return;
    }
    if (!form.price) {
      toast({ title: "Fehler", description: "Bitte geben Sie einen Preis ein", variant: "destructive" });
      return;
    }
    if (form.type === "online" && !form.courseId) {
      toast({ title: "Fehler", description: "Bitte wählen Sie den verknüpften Online-Kurs", variant: "destructive" });
      return;
    }
    if (form.isPromoActive && (!form.promoPrice || Number(form.promoPrice) >= Number(form.price))) {
      toast({ title: "Fehler", description: "Der Aktionspreis muss niedriger sein als der reguläre Preis", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      const payload: Partial<Product> = {
        type: form.type,
        slug: form.slug || undefined,
        title: form.title,
        shortDescription: form.shortDescription,
        description: form.description,
        benefits: form.benefits,
        thumbnailUrl: form.thumbnailUrl || undefined,
        price: Number(form.price),
        promoPrice: form.promoPrice ? Number(form.promoPrice) : undefined,
        isPromoActive: form.isPromoActive,
        priceUnit: form.priceUnit,
        status: form.status,
        featured: form.featured,
        courseId: form.type === "online" ? form.courseId : undefined,
        locationIds: form.type === "normal" ? form.locationIds : [],
        includesOnlineAccess: form.type === "normal" ? form.includesOnlineAccess : false,
        linkedCourseId: form.type === "normal" && form.includesOnlineAccess ? form.linkedCourseId : undefined,
      } as any;

      if (editingId) {
        await adminUpdateProduct(editingId, payload);
        toast({ title: "Gespeichert", description: "Produkt wurde aktualisiert" });
      } else {
        await adminCreateProduct(payload);
        toast({ title: "Erstellt", description: "Produkt wurde erstellt" });
      }

      setIsDialogOpen(false);
      loadProducts();
    } catch (err: any) {
      toast({ title: "Fehler", description: err.message || "Speichern fehlgeschlagen", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (product: Product) => {
    if (!(await confirmDelete(confirm, "Produkt", `Das Produkt „${product.title.de || product.title.en}“ wird gelöscht. Diese Aktion kann nicht rückgängig gemacht werden.`))) return;
    try {
      await adminDeleteProduct(product._id);
      toast({ title: "Gelöscht", description: "Produkt wurde entfernt" });
      loadProducts();
    } catch (err: any) {
      toast({ title: "Fehler", description: err.message || "Löschen fehlgeschlagen", variant: "destructive" });
    }
  };

  const toggleFeatured = async (product: Product) => {
    try {
      await adminUpdateProduct(product._id, { featured: !product.featured });
      loadProducts();
    } catch (err: any) {
      toast({ title: "Fehler", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold">Produkte (Kurse & Schulungen)</h2>
          <p className="text-sm text-muted-foreground">
            {products.length} Produkte insgesamt · Reihenfolge im Shop per Ziehen am Griff ändern
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadProducts}>
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Aktualisieren
          </Button>
          <Button size="sm" onClick={openCreateDialog}>
            <Plus className="w-4 h-4 mr-1.5" /> Neues Produkt
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : products.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            Noch keine Produkte vorhanden.
            <div className="mt-4">
              <Button onClick={openCreateDialog}>
                <Plus className="w-4 h-4 mr-1.5" /> Erstes Produkt hinzufügen
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={products.map((p) => p._id)} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {products.map((product, index) => (
            <SortableProduct key={product._id} id={product._id}>
            {(handle) => (
            <Card className="h-full">
              <CardContent className="p-4 flex gap-4">
                <div className="flex flex-col items-center gap-1 shrink-0">
                  {handle}
                  <span className="text-xs font-semibold text-muted-foreground" title="Position im Shop">{index + 1}</span>
                </div>
                <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  {product.type === "online" ? (
                    <BookOpen className="w-7 h-7 text-primary" />
                  ) : (
                    <Forklift className="w-7 h-7 text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-foreground truncate">
                        {product.title.de || product.title.en || "(ohne Titel)"}
                      </h3>
                      <p className="text-xs text-muted-foreground">/kursy/{product.slug}</p>
                    </div>
                    <button onClick={() => toggleFeatured(product)} title="Auf Startseite anzeigen">
                      {product.featured ? (
                        <Star className="w-4 h-4 text-primary fill-primary shrink-0" />
                      ) : (
                        <StarOff className="w-4 h-4 text-muted-foreground shrink-0" />
                      )}
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge variant={product.status === "active" ? "default" : "secondary"}>
                      {product.status === "active" ? "Aktiv" : "Entwurf"}
                    </Badge>
                    <Badge variant="outline">{product.type === "online" ? "Online" : "Praxis / Standort"}</Badge>
                    {product.isPromoActive && <Badge className="bg-orange-500 hover:bg-orange-500">Aktion</Badge>}
                  </div>

                  <div className="flex items-baseline gap-2 mt-2">
                    {product.isPromoActive && product.promoPrice != null && (
                      <span className="text-sm text-muted-foreground line-through">€{product.price.toFixed(2)}</span>
                    )}
                    <span className="font-bold text-foreground">
                      €{(product.isPromoActive && product.promoPrice != null ? product.promoPrice : product.price).toFixed(2)}
                    </span>
                    <span className="text-xs text-muted-foreground">netto</span>
                  </div>

                  <div className="flex gap-2 mt-3">
                    <Button variant="outline" size="sm" onClick={() => openEditDialog(product)}>
                      <Edit className="w-3.5 h-3.5 mr-1.5" /> Bearbeiten
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(product)}>
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            )}
            </SortableProduct>
          ))}
        </div>
        </SortableContext>
        </DndContext>
      )}

      {/* ── Notify requests (powiadom mnie o nowych terminach) ─────────────────── */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BellRing className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground">Anfragen: Benachrichtigung bei neuen Terminen</h3>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            Sobald Sie beim Standort einen Termin mit freien Plätzen anlegen, bekommen alle Wartenden automatisch eine E-Mail.
          </p>

          {(() => {
            const waiting = notifyRequests.filter((r) => !r.notified);
            const notified = notifyRequests.filter((r) => r.notified);
            const list = notifyTab === "waiting" ? waiting : notified;
            const fmt = (d?: string) => (d ? new Date(d).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" }) : "");
            const fmtShort = (d: string) => new Date(d).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" });

            return (
              <>
                <Tabs value={notifyTab} onValueChange={(v) => setNotifyTab(v as "waiting" | "notified")} className="mb-3">
                  <TabsList>
                    <TabsTrigger value="waiting">Wartet ({waiting.length})</TabsTrigger>
                    <TabsTrigger value="notified">Benachrichtigt ({notified.length})</TabsTrigger>
                  </TabsList>
                </Tabs>

                {notifyLoading ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  </div>
                ) : list.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {notifyTab === "waiting" ? "Niemand wartet gerade auf einen Termin." : "Noch niemand benachrichtigt."}
                  </p>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {list.map((r) => (
                      <div key={r._id} className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border text-sm">
                        <div className="flex items-start gap-2 min-w-0">
                          <Mail className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-1" />
                          <div className="min-w-0">
                            <p className="font-medium text-foreground truncate">{r.email}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {r.productTitle} · {r.locationCity || "alle Standorte"}
                            </p>
                            {r.notified ? (
                              <p className="text-xs text-green-700 mt-0.5">
                                {r.notifiedManually
                                  ? `Manuell erledigt${r.notifiedAt ? ` am ${fmt(r.notifiedAt)}` : ""}`
                                  : `E-Mail gesendet${r.notifiedAt ? ` am ${fmt(r.notifiedAt)}` : ""}`}
                                {r.notifiedDates?.length
                                  ? ` · ${r.notifiedDates.map((d) => `${d.locationCity} ${fmtShort(d.startDate)}`).join(", ")}`
                                  : ""}
                              </p>
                            ) : (
                              <p className="text-xs text-muted-foreground mt-0.5">Wartet seit {fmt(r.createdAt)}</p>
                            )}
                            {!r.notified && r.lastError && (
                              <p className="text-xs text-destructive mt-0.5 truncate" title={r.lastError}>
                                Versand fehlgeschlagen: {r.lastError}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {!r.notified && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSendNotifyRequest(r._id)}
                                disabled={sendingNotifyId === r._id}
                                title="Jetzt mit aktuellen Terminen benachrichtigen"
                              >
                                {sendingNotifyId === r._id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => handleMarkNotified(r._id)} title="Ohne E-Mail als erledigt markieren">
                                <CheckIcon className="w-3.5 h-3.5" />
                              </Button>
                            </>
                          )}
                          <Button variant="outline" size="sm" onClick={() => handleDeleteNotifyRequest(r._id)} title="Löschen">
                            <Trash2 className="w-3.5 h-3.5 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            );
          })()}
        </CardContent>
      </Card>

      {/* ── Create / Edit Dialog ─────────────────────────────────────────────── */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Produkt bearbeiten" : "Neues Produkt"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Type & basic fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Produkttyp *</Label>
                <Select value={form.type} onValueChange={(v: string) => setForm((p) => ({ ...p, type: v as ProductType }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Praktisch / Standort (inkl. Pakete)</SelectItem>
                    <SelectItem value="online">Online-Zugang</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>URL-Slug (optional)</Label>
                <Input
                  value={form.slug}
                  onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
                  placeholder="wird automatisch generiert"
                />
              </div>
            </div>

            {/* Localized content */}
            <div className="space-y-3">
              <Label>Inhalte (mehrsprachig)</Label>
              <Tabs value={activeLang} onValueChange={(v) => setActiveLang(v as keyof LocalizedText)}>
                <TabsList className="grid grid-cols-4 w-full max-w-md">
                  {LANGS.map((l) => (
                    <TabsTrigger key={l.code} value={l.code}>{l.code.toUpperCase()}</TabsTrigger>
                  ))}
                </TabsList>
                {LANGS.map((l) => (
                  <TabsContent key={l.code} value={l.code} className="space-y-3 pt-3">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Titel ({l.label})</Label>
                      <Input
                        value={form.title[l.code]}
                        onChange={(e) => updateLocalized("title", l.code, e.target.value)}
                        placeholder="z.B. Basis-Ausbildung Frontstapler"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Kurzbeschreibung ({l.label})</Label>
                      <Input
                        value={form.shortDescription[l.code]}
                        onChange={(e) => updateLocalized("shortDescription", l.code, e.target.value)}
                        placeholder="Kurzer Teaser-Text für die Karte"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Ausführliche Beschreibung ({l.label})</Label>
                      <Textarea
                        rows={5}
                        value={form.description[l.code]}
                        onChange={(e) => updateLocalized("description", l.code, e.target.value)}
                        placeholder="Vollständige Beschreibung für die Detailseite"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">
                        Vorteile / Leistungen ({l.label}) — eine Zeile pro Punkt
                      </Label>
                      <Textarea
                        rows={4}
                        value={form.benefits[l.code].join("\n")}
                        onChange={(e) => updateBenefits(l.code, e.target.value)}
                        placeholder={"Theorie & Praxis inklusive\nStaplerschein nach DGUV\nZertifikat inklusive"}
                      />
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </div>

            {/* Image */}
            <div className="space-y-2">
              <Label>Titelbild</Label>
              <div className="flex items-center gap-3">
                {form.thumbnailUrl ? (
                  <div className="relative">
                    <img src={form.thumbnailUrl} alt="" className="w-24 h-24 object-cover rounded-xl border border-border" />
                    <button
                      onClick={() => setForm((p) => ({ ...p, thumbnailUrl: "" }))}
                      className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <label className="w-24 h-24 border-2 border-dashed border-border rounded-xl flex items-center justify-center cursor-pointer hover:bg-muted/50">
                    {isUploadingImage ? (
                      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                    ) : (
                      <ImagePlus className="w-5 h-5 text-muted-foreground" />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Pricing */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Regulärer Preis (netto, €) *</Label>
                <Input
                  type="number" step="0.01" min="0"
                  value={form.price}
                  onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Abrechnung</Label>
                <Select value={form.priceUnit} onValueChange={(v: string) => setForm((p) => ({ ...p, priceUnit: v as "person" | "monthly" }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="person">pro Person</SelectItem>
                    <SelectItem value="monthly">pro Monat</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v: string) => setForm((p) => ({ ...p, status: v as "draft" | "active" }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Entwurf (nicht sichtbar)</SelectItem>
                    <SelectItem value="active">Aktiv (öffentlich sichtbar)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border border-border rounded-xl">
              <div>
                <Label className="cursor-pointer">Aktionspreis aktiv</Label>
                <p className="text-xs text-muted-foreground">Zeigt durchgestrichenen Preis + reduzierten Preis (z.B. Pakete)</p>
              </div>
              <Switch
                checked={form.isPromoActive}
                onCheckedChange={(checked) => setForm((p) => ({ ...p, isPromoActive: checked }))}
              />
            </div>
            {form.isPromoActive && (
              <div className="space-y-2">
                <Label>Aktionspreis (netto, €) *</Label>
                <Input
                  type="number" step="0.01" min="0"
                  value={form.promoPrice}
                  onChange={(e) => setForm((p) => ({ ...p, promoPrice: e.target.value }))}
                />
              </div>
            )}

            <div className="flex items-center justify-between p-3 border border-border rounded-xl">
              <div>
                <Label className="cursor-pointer">Auf Startseite hervorheben</Label>
                <p className="text-xs text-muted-foreground">Erscheint im Karussell auf der Startseite</p>
              </div>
              <Switch
                checked={form.featured}
                onCheckedChange={(checked) => setForm((p) => ({ ...p, featured: checked }))}
              />
            </div>

            {/* Type-specific configuration */}
            {form.type === "online" ? (
              <div className="space-y-2">
                <Label>Verknüpfter Online-Kurs (Inhalt) *</Label>
                <Select value={form.courseId} onValueChange={(v) => setForm((p) => ({ ...p, courseId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Kurs wählen" /></SelectTrigger>
                  <SelectContent>
                    {courses.map((c) => (
                      <SelectItem key={c._id} value={c._id}>{c.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Der Käufer erhält nach Zahlung automatisch 30 Tage Zugang zu diesem Kurs.
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Verfügbare Standorte</Label>
                  {locations.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Keine Standorte vorhanden. Legen Sie zuerst Standorte im Tab „Standorte" an.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {locations.map((loc) => (
                        <label
                          key={loc._id}
                          className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer text-sm ${
                            form.locationIds.includes(loc._id) ? "border-primary bg-primary/5" : "border-border"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={form.locationIds.includes(loc._id)}
                            onChange={() => toggleLocation(loc._id)}
                          />
                          <span>{loc.city} — {loc.address}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between p-3 border border-border rounded-xl">
                  <div>
                    <Label className="cursor-pointer">Paket: inkl. Zugang zum Online-Kurs</Label>
                    <p className="text-xs text-muted-foreground">
                      Für Pakete (z.B. Theorie online + Praxis vor Ort) — der Käufer erhält zusätzlich Zugriff auf den gewählten Online-Kurs.
                    </p>
                  </div>
                  <Switch
                    checked={form.includesOnlineAccess}
                    onCheckedChange={(checked) => setForm((p) => ({ ...p, includesOnlineAccess: checked }))}
                  />
                </div>

                {form.includesOnlineAccess && (
                  <div className="space-y-2">
                    <Label>Online-Kurs, der mitgegeben wird *</Label>
                    <Select value={form.linkedCourseId} onValueChange={(v) => setForm((p) => ({ ...p, linkedCourseId: v }))}>
                      <SelectTrigger><SelectValue placeholder="Kurs wählen" /></SelectTrigger>
                      <SelectContent>
                        {courses.map((c) => (
                          <SelectItem key={c._id} value={c._id}>{c.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </>
            )}

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Abbrechen</Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Speichern
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminProducts;
