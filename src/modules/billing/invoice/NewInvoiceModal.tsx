import {useState} from "react";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {toast} from "react-toastify";
import {CenterModal} from "../../../components/shared/CenterModal.tsx";
import {queryKeys} from "../../../app/query/queryKeys.ts";
import {InvoiceService} from "../../../services/billing/BillingService.ts";
import {ProductService} from "../../../services/product/ProductService.ts";
import {Pagination} from "../../../domain/filters/Page.ts";
import {ProductStatus} from "../../../domain/model/product/Product.ts";
import {money, PersonRef} from "../../../domain/billing/Invoice.ts";
import {useBillingSettings} from "../useBillingSettings.ts";
import {StudentPicker} from "../components/StudentPicker.tsx";

const SYSTEM_ONLY = ["ENROLLMENT", "RE_ENROLLMENT"];
type Line = {key: number; productId?: number; quantity: string; unitPrice: string};

/** Factura conceptos sueltos a un estudiante: libros, uniformes, excursiones, etc. */
export const NewInvoiceModal = ({isOpen, onClose, onCreated, student: initialStudent}: {
    isOpen: boolean;
    onClose: () => void;
    onCreated: (invoiceId: number) => void;
    student?: PersonRef | null;
}) => {
    const queryClient = useQueryClient();
    const {taxesEnabled} = useBillingSettings();
    const [student, setStudent] = useState<PersonRef | null>(initialStudent ?? null);
    const [lines, setLines] = useState<Line[]>([{key: 1, quantity: "1", unitPrice: ""}]);
    const [dueDate, setDueDate] = useState(new Date().toISOString().slice(0, 10));
    const [notes, setNotes] = useState("");

    const productsQuery = useQuery({
        queryKey: [...queryKeys.products.all, "invoiceable"],
        queryFn: ({signal}) => ProductService.instance.withSignal(signal)
            .search({status: ProductStatus.ACTIVE}, {...Pagination.first, size: 100}),
        enabled: isOpen,
        meta: {errorMessage: "No se pudieron cargar los conceptos de pago."},
    });
    const products = (productsQuery.data?.content ?? []).filter((product) => !SYSTEM_ONLY.includes(product.systemKey ?? ""));
    const productOf = (id?: number) => products.find((product) => product.id === id);

    const total = lines.reduce((sum, line) => sum + Number(line.quantity || 0) * Number(line.unitPrice || 0), 0);
    const valid = Boolean(student) && lines.every((line) => line.productId && Number(line.quantity) >= 1 && Number(line.unitPrice) > 0);

    const create = useMutation({
        mutationFn: () => InvoiceService.instance.createInvoice({
            studentId: student!.id, dueDate, notes: notes.trim() || undefined,
            items: lines.map((line) => ({productId: line.productId!, quantity: Number(line.quantity), unitPrice: Number(line.unitPrice)})),
        }),
        onSuccess: (saved) => {
            toast.success(`Factura ${saved.invoice.number} creada.`);
            void queryClient.invalidateQueries({queryKey: queryKeys.invoices.all});
            void queryClient.invalidateQueries({queryKey: queryKeys.accounts.all});
            close();
            onCreated(saved.invoice.id);
        },
        onError: (error) => toast.error((error as {message?: string})?.message ?? "No se pudo crear la factura."),
    });

    const update = (key: number, patch: Partial<Line>) =>
        setLines((current) => current.map((line) => line.key === key ? {...line, ...patch} : line));

    const close = () => {
        setStudent(initialStudent ?? null);
        setLines([{key: 1, quantity: "1", unitPrice: ""}]);
        setNotes("");
        onClose();
    };

    return (
        <CenterModal title="Nueva factura" description="Cobra conceptos sueltos a un estudiante. La inscripción se factura al inscribir."
                     isOpen={isOpen} onClose={close} className="max-w-3xl">
            <div className="space-y-5">
                {initialStudent ? (
                    <p className="text-sm" style={{color: "var(--text-secondary)"}}>
                        Estudiante: <strong style={{color: "var(--text-primary)"}}>{initialStudent.name}</strong>
                    </p>
                ) : <StudentPicker value={student} onChange={setStudent}/>}

                <section className="space-y-2">
                    <span className="form-label block text-sm font-semibold">Conceptos</span>
                    {lines.map((line) => (
                        <div key={line.key} className="grid grid-cols-[1fr_80px_130px_32px] items-center gap-2">
                            <select className="select select-bordered select-sm w-full" value={line.productId ?? ""}
                                    aria-label="Concepto"
                                    onChange={(event) => {
                                        const product = productOf(Number(event.target.value));
                                        update(line.key, {productId: product?.id, unitPrice: product && Number(product.price) > 0 ? String(product.price) : ""});
                                    }}>
                                <option value="">Elige un concepto</option>
                                {products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
                            </select>
                            <input type="number" min={1} step={1} className="input input-bordered input-sm text-right" aria-label="Cantidad"
                                   value={line.quantity} onChange={(event) => update(line.key, {quantity: event.target.value})}/>
                            <input type="number" min={0} step="0.01" className="input input-bordered input-sm text-right" aria-label="Precio"
                                   placeholder="Precio" value={line.unitPrice} onChange={(event) => update(line.key, {unitPrice: event.target.value})}/>
                            <button type="button" className="row-action" aria-label="Quitar concepto" disabled={lines.length === 1}
                                    onClick={() => setLines((current) => current.filter((item) => item.key !== line.key))}>
                                <i className="fa fa-xmark"/>
                            </button>
                        </div>
                    ))}
                    <button type="button" className="btn btn-ghost btn-xs"
                            onClick={() => setLines((current) => [...current, {key: Date.now(), quantity: "1", unitPrice: ""}])}>
                        <i className="fa fa-plus"/>Agregar concepto
                    </button>
                </section>

                <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block">
                        <span className="form-label mb-1 block text-sm font-semibold">Vence</span>
                        <input type="date" className="input input-bordered input-sm w-full" value={dueDate}
                               onChange={(event) => setDueDate(event.target.value)}/>
                    </label>
                    <label className="block">
                        <span className="form-label mb-1 block text-sm font-semibold">Descripción</span>
                        <input className="input input-bordered input-sm w-full" maxLength={500} value={notes}
                               placeholder="Opcional: por defecto, los conceptos" onChange={(event) => setNotes(event.target.value)}/>
                    </label>
                </div>

                <div className="flex items-center justify-between gap-3 border-t pt-4" style={{borderColor: "var(--border-soft)"}}>
                    <div>
                        <span className="block text-xs uppercase tracking-[0.08em]" style={{color: "var(--text-tertiary)"}}>Subtotal</span>
                        <strong className="text-xl" style={{color: "var(--text-primary)"}}>{money.format(total)}</strong>
                        {taxesEnabled && <span className="ms-2 text-xs" style={{color: "var(--text-tertiary)"}}>+ impuestos de cada concepto</span>}
                    </div>
                    <div className="flex gap-2">
                        <button type="button" className="btn btn-sm" onClick={close}>Cancelar</button>
                        <button type="button" className="btn btn-sm btn-primary" disabled={!valid || create.isPending} onClick={() => create.mutate()}>
                            {create.isPending ? <i className="fa fa-spinner fa-spin"/> : <i className="fa fa-file-invoice-dollar"/>}
                            Crear factura
                        </button>
                    </div>
                </div>
            </div>
        </CenterModal>
    );
};
