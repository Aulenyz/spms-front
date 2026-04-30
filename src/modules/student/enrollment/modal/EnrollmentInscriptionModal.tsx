import ReactDOM from "react-dom";
import {useEffect, useMemo, useState} from "react";
import clsx from "clsx";
import {Input} from "../../../../components/io/Input.tsx";
import {TextareaInput} from "../../../../components/io/TextareaInput.tsx";
import {SelectInput} from "../../../../components/io/SelectInput.tsx";
import {toast} from "react-toastify";
import {Guardian} from "../../../../domain/student/Guardian.ts";
import {GuardianStep} from "../../../payment/components/GuardianStep.tsx";
import {Student} from "../../../../domain/student/Student.ts";
import {StudentStep} from "../../../payment/components/StudentStep.tsx";
import {GuardianService} from "../../../../services/student/guardian/GuardianService.ts";
import {Pagination} from "../../../../domain/filters/Page.ts";

type PaymentConcept = {
    id: string;
    label: string;
    amount: number;
    note?: string;
};

type PaymentMethod = "efectivo" | "tarjeta" | "transferencia" | "mixto";

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

const suggestedConcepts = [
    {label: "Mensualidad", amount: 1200},
    {label: "Mora administrativa", amount: 150},
    {label: "Servicio extra", amount: 300},
    {label: "Recargo por atraso", amount: 90},
];

const formatMoney = (value: number) => `$${value.toFixed(2)}`;

const createConceptId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

type WizardStep = "ESTUDIANTE" | "PADRES" | "APORTES" | "REVISION";

export const CommercialCollectionModal = ({isOpen, onClose}: Props) => {
    const [step, setStep] = useState<WizardStep>("ESTUDIANTE");
    const [student, setStudent] = useState<Student | null>(null);
    const [guardians, setGuardians] = useState<Guardian[]>([]);
    const [clientName, setClientName] = useState("Cliente general");
    const [documentNumber, setDocumentNumber] = useState("001-0000000-0");
    const [saleReference, setSaleReference] = useState("COB-2024-0018");
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("transferencia");
    const [notes, setNotes] = useState("Cobro manual sin dependencia de catalogo interno.");
    const [conceptLabel, setConceptLabel] = useState("");
    const [conceptAmount, setConceptAmount] = useState("");
    const [conceptNote, setConceptNote] = useState("");
    const [discount, setDiscount] = useState("0");
    const [receivedAmount, setReceivedAmount] = useState("0");
    const [concepts, setConcepts] = useState<PaymentConcept[]>([
        {id: createConceptId(), label: "Mensualidad", amount: 1200, note: "Ciclo actual"},
        {id: createConceptId(), label: "Mora administrativa", amount: 150},
    ]);

    useEffect(() => {
        if (!isOpen) {
            return;
        }
        if (!student?.id) {
            return;
        }

        GuardianService.instance
            .listByStudentId(student.id, {...Pagination.first, size: 50})
            .then((page) => {
                setGuardians(page.content ?? []);
                if ((page.content ?? []).length > 0) {
                    toast.info("Representantes cargados del estudiante.");
                }
            })
            .catch(() => {
                toast.error("No se pudieron cargar los representantes del estudiante.");
            });
    }, [isOpen, student?.id]);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        setStep("ESTUDIANTE");
        setStudent(null);
        setGuardians([]);
        setConceptLabel("");
        setConceptAmount("");
        setConceptNote("");
    }, [isOpen]);

    const subtotal = useMemo(
        () => concepts.reduce((accumulator, concept) => accumulator + concept.amount, 0),
        [concepts]
    );

    const discountAmount = Math.max(0, Number(discount) || 0);
    const total = Math.max(0, subtotal - discountAmount);
    const received = Math.max(0, Number(receivedAmount) || 0);
    const balance = total - received;

    const addConcept = (label: string, amount: number, note?: string) => {
        const normalizedLabel = label.trim();

        if (!normalizedLabel || !Number.isFinite(amount) || amount <= 0) {
            toast.error("Completa el concepto y un monto valido.");
            return;
        }

        setConcepts((current) => [
            ...current,
            {
                id: createConceptId(),
                label: normalizedLabel,
                amount,
                note: note?.trim() || undefined,
            },
        ]);
    };

    const handleAddConcept = () => {
        addConcept(conceptLabel, Number(conceptAmount), conceptNote);
        setConceptLabel("");
        setConceptAmount("");
        setConceptNote("");
    };

    const handleQuickConcept = (label: string, amount: number) => {
        addConcept(label, amount);
    };

    const handleRegister = () => {
        if (!student?.id) {
            toast.error("Selecciona el estudiante.");
            setStep("ESTUDIANTE");
            return;
        }
        if (guardians.length === 0) {
            toast.error("Agrega al menos un representante.");
            setStep("PADRES");
            return;
        }
        if (concepts.length === 0) {
            toast.error("Agrega al menos un aporte/concepto para registrar.");
            setStep("APORTES");
            return;
        }

        toast.success("Aporte preparado para registrar.");
        onClose();
    };

    const removeConcept = (id: string) => {
        setConcepts((current) => current.filter((concept) => concept.id !== id));
    };

    if (!isOpen) {
        return null;
    }

    const Stepper = () => {
        const steps: {id: WizardStep; label: string; icon: string}[] = [
            {id: "ESTUDIANTE", label: "Estudiante", icon: "fa-id-card"},
            {id: "PADRES", label: "Representantes", icon: "fa-user-group"},
            {id: "APORTES", label: "Aportes", icon: "fa-receipt"},
            {id: "REVISION", label: "Revision", icon: "fa-clipboard-check"},
        ];

        const currentIndex = steps.findIndex((item) => item.id === step);

        const canGoTo = (next: WizardStep) => {
            if (next === "ESTUDIANTE") return true;
            if (next === "PADRES") return Boolean(student?.id);
            if (next === "APORTES") return Boolean(student?.id) && guardians.length > 0;
            if (next === "REVISION") return Boolean(student?.id) && guardians.length > 0 && concepts.length > 0;
            return false;
        };

        const go = (next: WizardStep) => {
            if (!canGoTo(next)) {
                if (next === "PADRES") toast.error("Primero selecciona el estudiante.");
                if (next === "APORTES") toast.error("Completa estudiante y representantes.");
                if (next === "REVISION") toast.error("Completa estudiante, representantes y al menos un aporte/concepto.");
                return;
            }
            setStep(next);
        };

        return (
            <div className="grid gap-3">
                <ol className="relative flex items-center gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {steps.map((item, index) => {
                        const isActive = item.id === step;
                        const isDone = index < currentIndex;

                        return (
                            <li key={item.id} className="flex shrink-0 items-center">
                                <button
                                    type="button"
                                    onClick={() => go(item.id)}
                                    className={clsx(
                                        "inline-flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition",
                                        "min-w-[220px] sm:min-w-0",
                                        isActive
                                            ? "border-slate-900 bg-slate-900 text-white shadow-sm dark:border-white/10 dark:bg-white/10"
                                            : isDone
                                                ? "border-slate-200 bg-white text-slate-900 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                                                : "border-slate-200 bg-white/70 text-slate-700 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10"
                                    )}
                                >
                                    <span
                                        className={clsx(
                                            "flex h-9 w-9 items-center justify-center rounded-2xl text-xs font-black",
                                            isDone
                                                ? "bg-emerald-500 text-white"
                                                : isActive
                                                    ? "bg-white/10 text-white"
                                                    : "bg-slate-100 text-slate-700 dark:bg-white/5 dark:text-slate-100"
                                        )}
                                    >
                                        {isDone ? <i className="fa fa-check"/> : <i className={clsx("fa", item.icon)}/>}
                                    </span>

                                    <div className="min-w-0">
                                        <p className={clsx("truncate text-sm font-extrabold", isActive ? "text-white" : "text-slate-950 dark:text-white")}>
                                            {index + 1}. {item.label}
                                        </p>
                                        <p className={clsx("mt-1 text-xs font-semibold", isActive ? "text-white/70" : "text-slate-500 dark:text-slate-300")}>
                                            {isDone ? "Completado" : isActive ? "En curso" : "Pendiente"}
                                        </p>
                                    </div>
                                </button>

                                {index < steps.length - 1 && (
                                    <span className="mx-3 hidden h-px w-10 bg-slate-200 sm:block dark:bg-white/10"/>
                                )}
                            </li>
                        );
                    })}
                </ol>
            </div>
        );
    };

    const InvoicePreviewCard = () => (
        <aside className="rounded-[24px] border border-slate-200 bg-white/90 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/5">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-300">
                        Vista previa
                    </p>
                    <p className="text-base font-black text-slate-950 dark:text-white">Factura/Aporte</p>
                </div>
                <span className="rounded-2xl bg-slate-50 px-3 py-2 text-right text-xs font-semibold text-slate-700 dark:bg-white/5 dark:text-slate-100">
                    {saleReference}
                </span>
            </div>

            <div className="mt-4 space-y-3 text-sm">
                <div className="rounded-2xl bg-slate-50 px-3 py-3 dark:bg-white/5">
                    <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500 dark:text-slate-300">Estudiante</p>
                    {student ? (
                        <>
                            <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                                {String(student.firstname ?? "")} {String(student.lastname ?? "")}
                            </p>
                            <p className="mt-1 text-slate-600 dark:text-slate-300">ID: {student.id}</p>
                        </>
                    ) : (
                        <p className="mt-1 text-slate-500 dark:text-slate-300">Sin seleccionar</p>
                    )}
                </div>
                <div className="rounded-2xl bg-slate-50 px-3 py-3 dark:bg-white/5">
                    <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500 dark:text-slate-300">Cliente</p>
                    <p className="mt-1 font-semibold text-slate-900 dark:text-white">{clientName || "—"}</p>
                    <p className="mt-1 text-slate-600 dark:text-slate-300">{documentNumber || "—"}</p>
                </div>

                <div className="rounded-2xl bg-slate-50 px-3 py-3 dark:bg-white/5">
                    <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500 dark:text-slate-300">Representantes</p>
                    {guardians.length === 0 ? (
                        <p className="mt-1 text-slate-500 dark:text-slate-300">Sin seleccionar</p>
                    ) : (
                        <div className="mt-2 flex flex-wrap gap-2">
                            {guardians.slice(0, 4).map((guardian) => (
                                <span
                                    key={guardian.document}
                                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-100"
                                >
                                    <span className="h-2 w-2 rounded-full bg-cyan-400"/>
                                    {guardian.firstname} {guardian.lastname}
                                </span>
                            ))}
                            {guardians.length > 4 && (
                                <span className="text-xs font-semibold text-slate-500 dark:text-slate-300">
                                    +{guardians.length - 4}
                                </span>
                            )}
                        </div>
                    )}
                </div>

                <div className="rounded-2xl bg-slate-50 px-3 py-3 dark:bg-white/5">
                    <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500 dark:text-slate-300">Metodo</p>
                    <p className="mt-1 font-semibold text-slate-900 capitalize dark:text-white">{paymentMethod}</p>
                </div>

                <div className="rounded-2xl bg-slate-50 px-3 py-3 dark:bg-white/5">
                    <div className="flex items-center justify-between text-xs uppercase tracking-[0.22em] text-slate-500 dark:text-slate-300">
                        <span>Conceptos</span>
                        <span className="font-semibold">{concepts.length}</span>
                    </div>
                    {concepts.length === 0 ? (
                        <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">Sin conceptos</p>
                    ) : (
                        <div className="mt-3 space-y-2">
                            {concepts.slice(0, 5).map((concept) => (
                                <div key={concept.id} className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{concept.label}</p>
                                        {concept.note && <p className="truncate text-xs text-slate-500 dark:text-slate-300">{concept.note}</p>}
                                    </div>
                                    <p className="text-sm font-bold text-slate-900 dark:text-white">{formatMoney(concept.amount)}</p>
                                </div>
                            ))}
                            {concepts.length > 5 && (
                                <p className="text-xs font-semibold text-slate-500 dark:text-slate-300">
                                    +{concepts.length - 5} mas
                                </p>
                            )}
                        </div>
                    )}
                </div>

                <div className="rounded-2xl bg-slate-900 px-3 py-3 text-white shadow-sm dark:bg-white/10">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-white/70">Total</span>
                        <span className="text-lg font-black">{formatMoney(total)}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-white/70">
                        <span>Recibido</span>
                        <span className="font-semibold text-white">{formatMoney(received)}</span>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-xs text-white/70">
                        <span>{balance > 0 ? "Pendiente" : balance < 0 ? "Sobra" : "Balance"}</span>
                        <span className="font-semibold text-white">{formatMoney(Math.abs(balance))}</span>
                    </div>
                </div>
            </div>
        </aside>
    );

    const canContinue = () => {
        if (step === "ESTUDIANTE") return Boolean(student?.id);
        if (step === "PADRES") return Boolean(student?.id) && guardians.length > 0;
        if (step === "APORTES") return Boolean(student?.id) && guardians.length > 0 && concepts.length > 0;
        return true;
    };

    const handleNext = () => {
        if (step === "ESTUDIANTE") {
            if (!student?.id) {
                toast.error("Primero selecciona el estudiante.");
                return;
            }
            setStep("PADRES");
            return;
        }

        if (step === "PADRES") {
            if (!student?.id) {
                toast.error("Primero selecciona el estudiante.");
                setStep("ESTUDIANTE");
                return;
            }
            if (guardians.length === 0) {
                toast.error("Agrega al menos un representante para continuar.");
                return;
            }
            setStep("APORTES");
            return;
        }

        if (step === "APORTES") {
            if (!student?.id) {
                toast.error("Primero selecciona el estudiante.");
                setStep("ESTUDIANTE");
                return;
            }
            if (guardians.length === 0) {
                toast.error("Primero agrega al menos un representante.");
                setStep("PADRES");
                return;
            }
            if (concepts.length === 0) {
                toast.error("Agrega al menos un aporte/concepto para continuar.");
                return;
            }
            setStep("REVISION");
            return;
        }

        handleRegister();
    };

    const handleBack = () => {
        if (step === "PADRES") setStep("ESTUDIANTE");
        else if (step === "APORTES") setStep("PADRES");
        else if (step === "REVISION") setStep("APORTES");
    };

    return ReactDOM.createPortal(
        <div className="fixed inset-0 z-[9999] flex justify-end bg-slate-950/65 backdrop-blur-sm">
            <button
                type="button"
                aria-label="Cerrar modal"
                onClick={onClose}
                className="absolute inset-0 h-full w-full cursor-default"
            />

            <section
                role="dialog"
                aria-modal="true"
                aria-labelledby="commercial-collection-title"
                className="relative h-full w-[80vw] max-w-[1280px] overflow-hidden border-l border-slate-200/80 bg-[linear-gradient(180deg,#f8fafc_0%,#eef2ff_58%,#ffffff_100%)] text-slate-900 shadow-[0_30px_80px_rgba(15,23,42,0.32)] dark:border-white/10 dark:bg-[linear-gradient(180deg,#0b1220_0%,#0b1220_35%,#111827_100%)] dark:text-slate-100"
            >
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute -top-24 right-12 h-72 w-72 rounded-full bg-cyan-200/40 blur-3xl dark:bg-cyan-500/15"/>
                    <div className="absolute bottom-0 left-8 h-64 w-64 rounded-full bg-indigo-200/40 blur-3xl dark:bg-indigo-500/15"/>
                </div>

                <div className="relative flex h-full flex-col">
                    <header className="flex items-start justify-between gap-4 border-b border-slate-200/80 px-5 py-4 lg:px-6 dark:border-white/10">
                        <div className="space-y-3">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-full border border-slate-200 bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-700 dark:border-white/10 dark:bg-white/5 dark:text-cyan-200">
                                    Caja escolar
                                </span>
                                <span className="rounded-full bg-slate-900 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-white dark:bg-white/10 dark:text-slate-100">
                                    Aporte escolar
                                </span>
                            </div>
                            <div className="space-y-2">
                                <h2 id="commercial-collection-title" className="text-xl font-black tracking-tight text-slate-950 lg:text-2xl dark:text-white">
                                    Aporte escolar
                                </h2>
                                <p className="max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                                    Registra aportes/pagos escolares y conceptos libres rapidamente.
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-slate-300 hover:text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
                        >
                            <i className="fa fa-times"/>
                        </button>
                    </header>

                    <div className="flex-1 overflow-y-auto px-5 py-5 lg:px-6">
                        <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
                            <div className="space-y-4">
                                <section className="rounded-[24px] border border-slate-200 bg-white/90 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/5">
                                    <Stepper/>
                                </section>

                                {step === "PADRES" && (
                                    <GuardianStep selected={guardians} onChange={setGuardians}/>
                                )}

                                {step === "ESTUDIANTE" && (
                                    <StudentStep
                                        selected={student}
                                        onSelect={(value) => {
                                            setStudent(value);
                                            setClientName(`${String(value.firstname ?? "")} ${String(value.lastname ?? "")}`.trim() || "Cliente general");
                                            setDocumentNumber(String(value.document ?? ""));
                                        }}
                                    />
                                )}

                                {step === "APORTES" && (
                                    <>
                                        <section className="rounded-[24px] border border-slate-200 bg-white/90 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/5">
                                        <div className="mb-4 flex items-center justify-between gap-3">
                                            <div>
                                                <h3 className="text-base font-bold text-slate-950 dark:text-white">Datos del aporte</h3>
                                                <p className="text-sm text-slate-500 dark:text-slate-300">Completa los datos base del aporte escolar.</p>
                                            </div>
                                                <div className="rounded-2xl bg-slate-50 px-4 py-2 text-right dark:bg-white/5">
                                                    <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500 dark:text-slate-300">Referencia</p>
                                                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{saleReference}</p>
                                                </div>
                                        </div>

                                        <div className="grid gap-4 md:grid-cols-2">
                                                <Input
                                                    label="Cliente o tutor"
                                                    error={undefined}
                                                    value={clientName}
                                                    onChange={(event) => setClientName(event.target.value)}
                                                    placeholder="Nombre del cliente"
                                                />
                                                <Input
                                                    label="Documento"
                                                    error={undefined}
                                                    value={documentNumber}
                                                    onChange={(event) => setDocumentNumber(event.target.value)}
                                                    placeholder="001-0000000-0"
                                                />
                                                <SelectInput
                                                    label="Metodo de pago"
                                                    error={undefined}
                                                    value={paymentMethod}
                                                    onChange={(event) => setPaymentMethod(event.target.value as PaymentMethod)}
                                                    className="md:col-span-1"
                                                >
                                                    <option value="efectivo">Efectivo</option>
                                                    <option value="tarjeta">Tarjeta</option>
                                                    <option value="transferencia">Transferencia</option>
                                                    <option value="mixto">Mixto</option>
                                                </SelectInput>
                                                <Input
                                                    label="Referencia interna"
                                                    error={undefined}
                                                    value={saleReference}
                                                    onChange={(event) => setSaleReference(event.target.value)}
                                                    placeholder="COB-2024-0018"
                                                />
                                                <TextareaInput
                                                    label="Notas"
                                                    error={undefined}
                                                    className="md:col-span-2"
                                                    value={notes}
                                                    onChange={(event) => setNotes(event.target.value)}
                                                    rows={3}
                                                    placeholder="Observaciones del aporte"
                                                />
                                                <Input
                                                    label="Descuento"
                                                    error={undefined}
                                                    value={discount}
                                                    onChange={(event) => setDiscount(event.target.value)}
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                />
                                                <Input
                                                    label="Recibido"
                                                    error={undefined}
                                                    value={receivedAmount}
                                                    onChange={(event) => setReceivedAmount(event.target.value)}
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                />
                                            </div>
                                        </section>

                                <section className="rounded-[24px] border border-slate-200 bg-white/90 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/5">
                                    <div className="mb-5 flex items-center justify-between gap-3">
                                        <div>
                                            <h3 className="text-base font-bold text-slate-950 dark:text-white">Aportes / conceptos</h3>
                                            <p className="text-sm text-slate-500 dark:text-slate-300">Agrega cualquier aporte, aunque no exista en la app.</p>
                                        </div>
                                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                                            {concepts.length} concepto{concepts.length === 1 ? "" : "s"}
                                        </span>
                                    </div>

                                    <div className="grid gap-4 lg:grid-cols-[1.1fr_0.6fr_0.8fr_auto]">
                                        <Input
                                            label="Concepto"
                                            error={undefined}
                                            value={conceptLabel}
                                            onChange={(event) => setConceptLabel(event.target.value)}
                                            placeholder="Ej: Cuota de transporte"
                                        />
                                        <Input
                                            label="Monto"
                                            error={undefined}
                                            type="number"
                                            inputMode="decimal"
                                            min="0"
                                            step="0.01"
                                            value={conceptAmount}
                                            onChange={(event) => setConceptAmount(event.target.value)}
                                            placeholder="0.00"
                                        />
                                        <Input
                                            label="Detalle opcional"
                                            error={undefined}
                                            value={conceptNote}
                                            onChange={(event) => setConceptNote(event.target.value)}
                                            placeholder="Descripcion corta"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleAddConcept}
                                            className="mt-6 inline-flex h-12 items-center justify-center rounded-2xl bg-slate-950 px-5 text-sm font-semibold text-white shadow-lg shadow-slate-950/15 transition hover:bg-slate-800"
                                        >
                                            <i className="fa fa-plus mr-2"/>
                                            Agregar
                                        </button>
                                    </div>

                                    <div className="mt-4 flex flex-wrap gap-2">
                                        {suggestedConcepts.map((concept) => (
                                            <button
                                                key={concept.label}
                                                type="button"
                                                onClick={() => handleQuickConcept(concept.label, concept.amount)}
                                                className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-800"
                                            >
                                                + {concept.label}
                                                <span className="ml-2 text-xs text-slate-500">{formatMoney(concept.amount)}</span>
                                            </button>
                                        ))}
                                    </div>

                                    <div className="mt-5 space-y-3">
                                        {concepts.length === 0 ? (
                                            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50/80 px-6 py-8 text-center">
                                                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm">
                                                    <i className="fa fa-receipt"/>
                                                </div>
                                                <h4 className="text-base font-semibold text-slate-900">Sin conceptos agregados</h4>
                                                <p className="mt-1 text-sm text-slate-500">
                                                    Escribe un concepto libre o usa una sugerencia rapida.
                                                </p>
                                            </div>
                                        ) : (
                                            concepts.map((concept) => (
                                                <article
                                                    key={concept.id}
                                                    className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-slate-50/90 p-4 md:flex-row md:items-center md:justify-between"
                                                >
                                                    <div className="min-w-0">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <h4 className="text-sm font-semibold text-slate-950">{concept.label}</h4>
                                                            {concept.note && (
                                                                <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-slate-500">
                                                                    {concept.note}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="mt-1 text-xs text-slate-500">
                                                            Concepto libre agregado manualmente.
                                                        </p>
                                                    </div>

                                                    <div className="flex items-center gap-3">
                                                        <span className="rounded-2xl bg-white px-4 py-2 text-sm font-bold text-slate-950 shadow-sm">
                                                            {formatMoney(concept.amount)}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => removeConcept(concept.id)}
                                                            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:border-rose-200 hover:text-rose-600"
                                                            aria-label={`Eliminar concepto ${concept.label}`}
                                                        >
                                                            <i className="fa fa-times"/>
                                                        </button>
                                                    </div>
                                                </article>
                                            ))
                                        )}
                                    </div>
                                </section>

                                <section className="rounded-[24px] border border-slate-200 bg-white/90 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/5">
                                    <h3 className="text-base font-bold text-slate-950 dark:text-white">Actividad y contexto</h3>
                                    <div className="mt-4 space-y-3">
                                        <div className="rounded-2xl bg-slate-50 px-4 py-3 dark:bg-white/5">
                                            <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-300">Estado</p>
                                            <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">Aporte listo para revisar</p>
                                        </div>
                                        <div className="rounded-2xl bg-slate-50 px-4 py-3 dark:bg-white/5">
                                            <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-300">Origen</p>
                                            <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">Ingreso manual desde caja escolar</p>
                                        </div>
                                        <div className="rounded-2xl bg-slate-50 px-4 py-3 dark:bg-white/5">
                                            <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-300">Nota</p>
                                            <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{notes}</p>
                                        </div>
                                    </div>
                                </section>
                            </>
                        )}

                                {step === "REVISION" && (
                                    <section className="rounded-[24px] border border-slate-200 bg-white/90 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/5">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <h3 className="text-base font-bold text-slate-950 dark:text-white">Revision final</h3>
                                                <p className="text-sm text-slate-500 dark:text-slate-300">Verifica todo antes de registrar.</p>
                                            </div>
                                            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                                                Lista para registrar
                                            </span>
                                        </div>

                                        <div className="mt-4 grid gap-4 md:grid-cols-2">
                                            <div className="rounded-2xl bg-slate-50 px-3 py-3 dark:bg-white/5">
                                                <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500 dark:text-slate-300">Representantes</p>
                                                <div className="mt-2 space-y-1 text-sm font-semibold text-slate-900 dark:text-white">
                                                    {guardians.map((guardian) => (
                                                        <p key={guardian.document}>
                                                            {guardian.firstname} {guardian.lastname} - {guardian.document}
                                                        </p>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="rounded-2xl bg-slate-50 px-3 py-3 dark:bg-white/5">
                                                <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500 dark:text-slate-300">Pago</p>
                                                <p className="mt-2 text-sm font-semibold text-slate-900 capitalize dark:text-white">{paymentMethod}</p>
                                                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{clientName}</p>
                                                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{documentNumber}</p>
                                            </div>
                                        </div>

                                        <div className="mt-4 rounded-2xl bg-slate-50 px-3 py-3 dark:bg-white/5">
                                            <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500 dark:text-slate-300">Conceptos</p>
                                            <div className="mt-3 space-y-2">
                                                {concepts.map((concept) => (
                                                    <div key={concept.id} className="flex items-start justify-between gap-3">
                                                        <div className="min-w-0">
                                                            <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{concept.label}</p>
                                                            {concept.note && <p className="truncate text-xs text-slate-500 dark:text-slate-300">{concept.note}</p>}
                                                        </div>
                                                        <p className="text-sm font-bold text-slate-900 dark:text-white">{formatMoney(concept.amount)}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </section>
                                )}

                                <section className="sticky bottom-0 -mx-5 border-t border-slate-200/80 bg-white/85 px-5 py-4 backdrop-blur dark:border-white/10 dark:bg-slate-950/40 xl:static xl:mx-0 xl:border-none xl:bg-transparent xl:px-0 xl:py-0 xl:backdrop-blur-0">
                                    <div className="flex items-center justify-between gap-3">
                                        <button
                                            type="button"
                                            onClick={handleBack}
                                            disabled={step === "ESTUDIANTE"}
                                            className={clsx(
                                                "inline-flex h-11 items-center justify-center rounded-2xl border px-5 text-sm font-semibold transition",
                                                step === "ESTUDIANTE"
                                                    ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 dark:border-white/10 dark:bg-white/5 dark:text-slate-500"
                                                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10"
                                            )}
                                        >
                                            Volver atras
                                        </button>

                                        <button
                                            type="button"
                                            onClick={handleNext}
                                            disabled={!canContinue() && step !== "REVISION"}
                                            className={clsx(
                                                "inline-flex h-11 items-center justify-center rounded-2xl px-6 text-sm font-bold transition",
                                                step === "REVISION"
                                                    ? "bg-cyan-400 text-slate-950 hover:bg-cyan-300"
                                                    : !canContinue()
                                                        ? "cursor-not-allowed bg-slate-200 text-slate-500 dark:bg-white/10 dark:text-slate-300"
                                                        : "bg-slate-900 text-white hover:bg-slate-800 dark:bg-white/10 dark:hover:bg-white/15"
                                            )}
                                        >
                                            {step === "REVISION" ? "Registrar" : "Continuar"}
                                        </button>
                                    </div>
                                </section>
                            </div>

                            <div className="xl:sticky xl:top-6 self-start">
                                <InvoicePreviewCard/>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>,
        document.body
    );
};

export const EnrollmentInscriptionModal = CommercialCollectionModal;
