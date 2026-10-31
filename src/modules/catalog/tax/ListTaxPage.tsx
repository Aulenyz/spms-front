import {FormEvent, useState} from "react";
import {useQuery, useQueryClient} from "@tanstack/react-query";
import {toast} from "react-toastify";
import {queryKeys} from "../../../app/query/queryKeys.ts";
import {TaxCategory} from "../../../domain/model/product/Product.ts";
import {TaxCategoryService} from "../../../services/product/TaxCategoryService.ts";
import {DetailSection} from "../../../components/ui/detail/DetailSection.tsx";
import {PageHeader} from "../../../components/ui/layout/PageHeader.tsx";
import {EmptyState} from "../../../components/ui/feedback/EmptyState.tsx";
import {useAuthContext} from "../../../contexts/AuthContext.tsx";
import {AuthorityKey} from "../../../domain/model/user/authorities.ts";
import {StatusBadge} from "../../../components/ui/detail/StatusBadge.tsx";
import {RightModal} from "../../../components/shared/RightModal.tsx";
import {LoadingContent} from "../../../components/io/output/LoadingContent.tsx";

const taxService = TaxCategoryService.instance;
const percent = (rate: number) => `${Number((rate * 100).toFixed(2))}%`;
const errorMessage = (error: unknown, fallback: string) =>
    typeof error === "object" && error && typeof (error as {message?: unknown}).message === "string"
        ? (error as {message: string}).message : fallback;

/**
 * Impuestos que se aplican a los conceptos de pago. Los del sistema (Exento, ITBIS 18%) solo permiten
 * cambiar el nombre; los demás se crean, editan y activan o inactivan aquí.
 */
export const ListTaxPage = () => {
    const {hasAuthority} = useAuthContext();
    const canEdit = hasAuthority(AuthorityKey.CATALOG_EDIT);
    const queryClient = useQueryClient();
    const [editing, setEditing] = useState<TaxCategory | null | undefined>(undefined);
    const {data: taxes = [], isLoading} = useQuery({
        queryKey: queryKeys.taxes,
        queryFn: ({signal}) => taxService.withSignal(signal).list(),
        meta: {errorMessage: "No se pudieron cargar los impuestos."},
    });

    return (
        <div className="space-y-4">
            <PageHeader title="Impuestos"
                        description="Los impuestos que se aplican a cada concepto de pago. La educación suele estar exenta de ITBIS."/>
            <DetailSection title="Impuestos registrados" description="Los que tienen candado son del sistema: solo se les puede cambiar el nombre." flush
                           actions={canEdit && <button type="button" className="btn btn-sm btn-primary" onClick={() => setEditing(null)}>
                               <i className="fa fa-plus"/>Nuevo impuesto
                           </button>}>
                <LoadingContent loading={isLoading} className="py-10">
                    {taxes.length === 0 ? (
                        <div className="p-5">
                            <EmptyState title="Sin impuestos" icon="fa-percent" description="Crea el primer impuesto de la organización."/>
                        </div>
                    ) : (
                    <table className="table-shell">
                        <thead>
                        <tr>
                            <th>Impuesto</th>
                            <th>Código</th>
                            <th className="text-right">Tasa</th>
                            <th>Estado</th>
                            {canEdit && <th className="w-12"/>}
                        </tr>
                        </thead>
                        <tbody>
                        {taxes.map((tax) => (
                            <tr key={tax.id}>
                                <td className="font-semibold text-[var(--text-primary)]">
                                    {tax.name}
                                    {tax.systemKey && <i className="fa fa-lock ms-2 text-xs text-[var(--text-tertiary)]" title="Del sistema"/>}
                                </td>
                                <td>{tax.code}</td>
                                <td className="text-right">{percent(tax.rate)}</td>
                                <td><StatusBadge active={tax.active}/></td>
                                {canEdit && <td className="text-right">
                                    <button type="button" className="row-action" title="Editar" aria-label="Editar impuesto" onClick={() => setEditing(tax)}>
                                        <i className="fa fa-pen"/>
                                    </button>
                                </td>}
                            </tr>
                        ))}
                        </tbody>
                    </table>
                    )}
                </LoadingContent>

                <RightModal title={editing ? "Editar impuesto" : "Nuevo impuesto"} isOpen={editing !== undefined}
                            onClose={() => setEditing(undefined)} className="h-full w-[420px] z-[9999]">
                    {editing !== undefined && (
                        <TaxForm tax={editing} onDone={() => setEditing(undefined)}
                                 onSaved={() => void queryClient.invalidateQueries({queryKey: queryKeys.taxes})}/>
                    )}
                </RightModal>
            </DetailSection>
        </div>
    );
};

const TaxForm = ({tax, onDone, onSaved}: {tax: TaxCategory | null; onDone: () => void; onSaved: () => void}) => {
    const locked = Boolean(tax?.systemKey);
    const [code, setCode] = useState(tax?.code ?? "");
    const [name, setName] = useState(tax?.name ?? "");
    const [rate, setRate] = useState(tax ? String(Number((tax.rate * 100).toFixed(2))) : "");
    const [active, setActive] = useState(tax?.active ?? true);
    const [saving, setSaving] = useState(false);
    const rateValue = Number(rate);
    const valid = Boolean(code.trim() && name.trim()) && rate !== "" && rateValue >= 0 && rateValue <= 100;

    const submit = async (event: FormEvent) => {
        event.preventDefault();
        if (!valid) return;
        setSaving(true);
        try {
            const payload = {code: code.trim(), name: name.trim(), rate: Number((rateValue / 100).toFixed(4)), active};
            if (tax) await taxService.updateTax(tax.id, payload);
            else await taxService.createTax(payload);
            toast.success(tax ? "Impuesto actualizado." : "Impuesto creado.");
            onSaved();
            onDone();
        } catch (error) {
            toast.error(errorMessage(error, "No se pudo guardar el impuesto."));
        } finally {
            setSaving(false);
        }
    };

    return (
        <form className="flex h-full min-h-0 flex-col" onSubmit={submit}>
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 pb-4 pt-4">
                {locked && <p className="rounded-[12px] px-3 py-2 text-xs" style={{background: "var(--accent-soft)", color: "var(--accent)"}}>
                    <i className="fa fa-lock me-1"/>Impuesto del sistema: solo puedes cambiar el nombre.
                </p>}
                <label className="block">
                    <span className="form-label">Nombre *</span>
                    <input className="input input-sm" value={name} maxLength={64} onChange={(event) => setName(event.target.value)}/>
                </label>
                <div className="grid grid-cols-2 gap-3">
                    <label className="block">
                        <span className="form-label">Código *</span>
                        <input className="input input-sm uppercase" value={code} maxLength={20} disabled={locked}
                               onChange={(event) => setCode(event.target.value)}/>
                    </label>
                    <label className="block">
                        <span className="form-label">Tasa (%) *</span>
                        <input className="input input-sm" type="number" min={0} max={100} step="0.01" value={rate} disabled={locked}
                               onChange={(event) => setRate(event.target.value)}/>
                    </label>
                </div>
                {!locked && (
                    <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)}/>
                        Activo
                    </label>
                )}
            </div>
            <div className="flex items-center justify-end gap-2 border-t px-5 py-4" style={{borderColor: "var(--border-soft)"}}>
                <button type="button" className="btn btn-sm" onClick={onDone} disabled={saving}>Cancelar</button>
                <button type="submit" className="btn btn-sm btn-primary" disabled={saving || !valid}>
                    <i className={saving ? "fa fa-spinner fa-spin" : "fa fa-check"}/>{saving ? "Guardando..." : "Guardar"}
                </button>
            </div>
        </form>
    );
};
