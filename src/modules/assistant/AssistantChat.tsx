import {FormEvent, Fragment, KeyboardEvent, ReactNode, useEffect, useRef, useState} from "react";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {Link} from "react-router-dom";
import {AssistantService, ChatMessage, PaymentDraft} from "../../services/assistant/AssistantService.ts";
import {ReceiptService} from "../../services/billing/BillingService.ts";
import {money, PaymentMethodLabel, receiptLink} from "../../domain/billing/Invoice.ts";
import {queryKeys} from "../../app/query/queryKeys.ts";
import {useCompany} from "../../contexts/CompanyContext.tsx";
import {useAuthContext} from "../../contexts/AuthContext.tsx";
import {AuthorityKey} from "../../domain/model/user/authorities.ts";

type DraftState = {status: "pending" | "saving" | "done" | "discarded" | "error"; receiptId?: number; receiptNumber?: string; error?: string};
type Entry = ChatMessage & {id: number; drafts?: PaymentDraft[]; draftStates?: DraftState[]; failed?: boolean};

const SUGGESTIONS = [
    "¿Cuánto se ha cobrado este mes?",
    "¿Quiénes deben más?",
    "¿Qué facturas están vencidas?",
    "¿Cómo inscribo a un estudiante?",
];
const MAX_HISTORY = 30;

/** Texto con **negritas** y listas con guion, sin interpretar HTML. */
const RichText = ({text}: {text: string}) => {
    const inline = (line: string): ReactNode[] => line.split(/(\*\*[^*]+\*\*)/g).map((part, index) =>
        part.startsWith("**") && part.endsWith("**") ? <strong key={index}>{part.slice(2, -2)}</strong> : <Fragment key={index}>{part}</Fragment>);
    return (
        <div className="space-y-1.5">
            {text.split("\n").filter((line, index, lines) => line.trim() || (index > 0 && lines[index - 1].trim())).map((line, index) => {
                const bullet = /^\s*[-•*]\s+/.exec(line);
                if (!line.trim()) return <div key={index} className="h-1"/>;
                return bullet
                    ? <div key={index} className="flex gap-2 ps-1"><span aria-hidden="true">•</span><span>{inline(line.slice(bullet[0].length))}</span></div>
                    : <p key={index}>{inline(line)}</p>;
            })}
        </div>
    );
};

/** Burbuja flotante con el asistente de la organización actual. */
export const AssistantChat = () => {
    const {rnc} = useCompany();
    const {hasAuthority} = useAuthContext();
    const queryClient = useQueryClient();
    const [open, setOpen] = useState(false);
    const [entries, setEntries] = useState<Entry[]>([]);
    const [input, setInput] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const statusQuery = useQuery({
        queryKey: ["assistant", "status"],
        queryFn: ({signal}) => AssistantService.instance.withSignal(signal).status(),
        staleTime: Infinity,
        meta: {silent: true},
    });

    // Cada organización tiene su propia conversación.
    useEffect(() => setEntries([]), [rnc]);

    useEffect(() => {
        scrollRef.current?.scrollTo({top: scrollRef.current.scrollHeight, behavior: "smooth"});
    }, [entries, open]);

    useEffect(() => {
        if (open) inputRef.current?.focus();
    }, [open]);

    const send = useMutation({
        mutationFn: (history: ChatMessage[]) => AssistantService.instance.chat(history.slice(-MAX_HISTORY)),
        onSuccess: (reply) => setEntries((current) => [...current, {
            id: Date.now(), role: "assistant", content: reply.reply,
            drafts: reply.drafts, draftStates: reply.drafts.map(() => ({status: "pending"})),
        }]),
        onError: (error) => setEntries((current) => [...current, {
            id: Date.now(), role: "assistant", failed: true,
            content: (error as {message?: string})?.message ?? "No pude responder. Intenta de nuevo.",
        }]),
    });

    const ask = (text: string) => {
        const content = text.trim();
        if (!content || send.isPending) return;
        const next: Entry[] = [...entries, {id: Date.now(), role: "user", content}];
        setEntries(next);
        setInput("");
        send.mutate(next.filter((entry) => !entry.failed).map(({role, content: body}) => ({role, content: body})));
    };

    const updateDraft = (entryId: number, index: number, state: DraftState) => setEntries((current) => current.map((entry) =>
        entry.id === entryId ? {...entry, draftStates: entry.draftStates?.map((value, position) => position === index ? state : value)} : entry));

    const confirmDraft = async (entryId: number, index: number, draft: PaymentDraft) => {
        updateDraft(entryId, index, {status: "saving"});
        try {
            const saved = await ReceiptService.instance.register({
                studentId: draft.studentId, method: draft.method, reference: draft.reference, amount: draft.total,
                allocations: draft.lines.map((line) => ({invoiceId: line.invoiceId, amount: line.amount})),
            });
            updateDraft(entryId, index, {status: "done", receiptId: saved.receipt.id, receiptNumber: saved.receipt.number});
            [queryKeys.invoices.all, queryKeys.payments.all, queryKeys.accounts.all, queryKeys.enrollments.all]
                .forEach((queryKey) => void queryClient.invalidateQueries({queryKey}));
        } catch (error) {
            updateDraft(entryId, index, {status: "error", error: (error as {message?: string})?.message ?? "No se pudo registrar el pago."});
        }
    };

    const onSubmit = (event: FormEvent) => {
        event.preventDefault();
        ask(input);
    };

    const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            ask(input);
        }
    };

    if (!statusQuery.data?.enabled) return null;

    return (
        <div className="no-print fixed bottom-5 right-5 z-[9000] flex flex-col items-end gap-3">
            {open && (
                <section role="dialog" aria-label="Asistente"
                         className="flex h-[min(620px,calc(100vh-110px))] w-[min(420px,calc(100vw-32px))] flex-col overflow-hidden rounded-[22px] border"
                         style={{borderColor: "var(--border-soft)", background: "var(--surface)", boxShadow: "0 24px 60px rgba(15, 23, 42, 0.22)"}}>
                    <header className="flex items-center gap-3 border-b px-4 py-3" style={{borderColor: "var(--border-soft)"}}>
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl text-white"
                              style={{background: "linear-gradient(145deg, #34d399, #059669)"}}>
                            <i className="fa fa-wand-magic-sparkles"/>
                        </span>
                        <div className="min-w-0 flex-1">
                            <strong className="block text-sm" style={{color: "var(--text-primary)"}}>Asistente</strong>
                            <span className="text-xs" style={{color: "var(--text-tertiary)"}}>
                                Consulta cobros, saldos e inscripciones
                            </span>
                        </div>
                        {entries.length > 0 && (
                            <button type="button" className="row-action" title="Nueva conversación" aria-label="Nueva conversación"
                                    onClick={() => setEntries([])} disabled={send.isPending}>
                                <i className="fa fa-rotate-left"/>
                            </button>
                        )}
                        <button type="button" className="row-action" title="Cerrar" aria-label="Cerrar asistente" onClick={() => setOpen(false)}>
                            <i className="fa fa-xmark"/>
                        </button>
                    </header>

                    <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4 text-sm leading-6" aria-live="polite">
                        {entries.length === 0 && (
                            <div className="space-y-3">
                                <p style={{color: "var(--text-secondary)"}}>
                                    Hola. Puedo consultar saldos, facturas y pagos de tu colegio, explicarte cómo usar el sistema
                                    {hasAuthority(AuthorityKey.COLLECTION_CREATE) && " y preparar pagos para que los confirmes"}.
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {SUGGESTIONS.map((suggestion) => (
                                        <button key={suggestion} type="button" className="rounded-full border px-3 py-1 text-xs font-semibold"
                                                style={{borderColor: "var(--border-soft)", color: "var(--text-secondary)"}}
                                                onClick={() => ask(suggestion)}>
                                            {suggestion}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {entries.map((entry) => (
                            <div key={entry.id} className={entry.role === "user" ? "flex justify-end" : "space-y-2"}>
                                <div className={entry.role === "user" ? "max-w-[85%] rounded-2xl rounded-br-md px-3.5 py-2 text-white" : "max-w-[95%]"}
                                     style={entry.role === "user" ? {background: "var(--accent)"} : {color: entry.failed ? "var(--danger)" : "var(--text-primary)"}}>
                                    {entry.role === "user" ? <p className="whitespace-pre-wrap">{entry.content}</p> : <RichText text={entry.content}/>}
                                </div>
                                {entry.drafts?.map((draft, index) => {
                                    const state = entry.draftStates?.[index] ?? {status: "pending"};
                                    return (
                                        <article key={index} className="rounded-2xl border p-3.5" style={{borderColor: "var(--border-soft)", background: "var(--surface-muted)"}}>
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <span className="text-[11px] font-bold uppercase tracking-[0.08em]" style={{color: "var(--text-tertiary)"}}>Pago por confirmar</span>
                                                    <strong className="block" style={{color: "var(--text-primary)"}}>{draft.studentName}</strong>
                                                    <span className="text-xs" style={{color: "var(--text-secondary)"}}>
                                                        {PaymentMethodLabel[draft.method]}{draft.reference && ` · Ref. ${draft.reference}`}
                                                    </span>
                                                </div>
                                                <strong className="text-base" style={{color: "var(--text-primary)"}}>{money.format(draft.total)}</strong>
                                            </div>
                                            <ul className="mt-2 space-y-0.5 text-xs" style={{color: "var(--text-secondary)"}}>
                                                {draft.lines.map((line) => (
                                                    <li key={line.invoiceId} className="flex justify-between gap-3">
                                                        <span>{line.description || line.invoiceNumber} <span style={{color: "var(--text-tertiary)"}}>({line.invoiceNumber})</span></span>
                                                        <span>{money.format(line.amount)}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                            <div className="mt-3 flex items-center justify-end gap-2">
                                                {state.status === "done" ? (
                                                    <Link to={receiptLink(state.receiptNumber ?? "")} className="text-xs font-semibold" style={{color: "var(--success)"}}>
                                                        <i className="fa fa-check me-1"/>Registrado: recibo {state.receiptNumber}
                                                    </Link>
                                                ) : state.status === "discarded" ? (
                                                    <span className="text-xs" style={{color: "var(--text-tertiary)"}}>Descartado</span>
                                                ) : (
                                                    <>
                                                        {state.status === "error" && <span className="me-auto text-xs" style={{color: "var(--danger)"}}>{state.error}</span>}
                                                        <button type="button" className="btn btn-xs" disabled={state.status === "saving"}
                                                                onClick={() => updateDraft(entry.id, index, {status: "discarded"})}>Descartar</button>
                                                        <button type="button" className="btn btn-xs btn-primary" disabled={state.status === "saving"}
                                                                onClick={() => void confirmDraft(entry.id, index, draft)}>
                                                            {state.status === "saving" ? <i className="fa fa-spinner fa-spin"/> : <i className="fa fa-check"/>}
                                                            Confirmar pago
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                        ))}

                        {send.isPending && (
                            <p className="flex items-center gap-2 text-xs" style={{color: "var(--text-tertiary)"}}>
                                <i className="fa fa-circle-notch fa-spin"/>Consultando…
                            </p>
                        )}
                    </div>

                    <form onSubmit={onSubmit} className="flex items-end gap-2 border-t p-3" style={{borderColor: "var(--border-soft)"}}>
                        <textarea ref={inputRef} rows={1} maxLength={4000} value={input} onKeyDown={onKeyDown}
                                  onChange={(event) => setInput(event.target.value)} placeholder="Escribe tu pregunta…"
                                  className="textarea textarea-bordered max-h-32 min-h-[40px] flex-1 resize-none text-sm" aria-label="Mensaje"/>
                        <button type="submit" className="btn btn-primary btn-sm h-10 w-10 p-0" disabled={!input.trim() || send.isPending} aria-label="Enviar">
                            <i className="fa fa-paper-plane"/>
                        </button>
                    </form>
                    <p className="px-4 pb-2 text-[10px]" style={{color: "var(--text-tertiary)"}}>
                        El asistente puede equivocarse. Revisa los montos antes de confirmar un pago.
                    </p>
                </section>
            )}

            <button type="button" onClick={() => setOpen((value) => !value)} aria-label={open ? "Cerrar asistente" : "Abrir asistente"}
                    className="flex h-14 w-14 items-center justify-center rounded-full text-xl text-white transition-transform hover:scale-105"
                    style={{background: "linear-gradient(145deg, #34d399, #059669)", boxShadow: "0 12px 30px rgba(5, 150, 105, 0.35)"}}>
                <i className={`fa ${open ? "fa-xmark" : "fa-wand-magic-sparkles"}`}/>
            </button>
        </div>
    );
};
