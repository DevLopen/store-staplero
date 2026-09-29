import { createContext, useCallback, useContext, useRef, useState, ReactNode } from "react";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export interface ConfirmOptions {
    title: string;
    description?: ReactNode;
    confirmLabel?: string;
    cancelLabel?: string;
    destructive?: boolean;
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

// Bez providera (np. w testach) spadamy na natywne okno przeglądarki
const ConfirmContext = createContext<ConfirmFn>(async (o) => window.confirm(o.title));

/**
 * Wspólny popup potwierdzenia, np. przed usunięciem:
 *   const confirm = useConfirm();
 *   if (!(await confirm({ title: "Kurs löschen?" }))) return;
 */
export const ConfirmProvider = ({ children }: { children: ReactNode }) => {
    const [options, setOptions] = useState<ConfirmOptions | null>(null);
    const resolver = useRef<((value: boolean) => void) | null>(null);

    const confirm = useCallback<ConfirmFn>((o) => {
        resolver.current?.(false);
        setOptions(o);
        return new Promise<boolean>((resolve) => { resolver.current = resolve; });
    }, []);

    const close = (value: boolean) => {
        resolver.current?.(value);
        resolver.current = null;
        setOptions(null);
    };

    const destructive = options?.destructive ?? true;

    return (
        <ConfirmContext.Provider value={confirm}>
            {children}
            <AlertDialog open={!!options} onOpenChange={(open) => { if (!open) close(false); }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{options?.title}</AlertDialogTitle>
                        {options?.description && (
                            <AlertDialogDescription>{options.description}</AlertDialogDescription>
                        )}
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => close(false)}>
                            {options?.cancelLabel || "Abbrechen"}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => close(true)}
                            className={destructive ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : undefined}
                        >
                            {options?.confirmLabel || (destructive ? "Löschen" : "Bestätigen")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </ConfirmContext.Provider>
    );
};

export const useConfirm = () => useContext(ConfirmContext);

/** Standardowe potwierdzenie usunięcia */
export const confirmDelete = (confirm: ConfirmFn, what: string, description?: ReactNode) =>
    confirm({
        title: `${what} löschen?`,
        description: description ?? "Diese Aktion kann nicht rückgängig gemacht werden.",
    });
