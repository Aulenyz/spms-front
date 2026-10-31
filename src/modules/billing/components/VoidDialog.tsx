import {useState} from "react";
import {CenterModal} from "../../../components/shared/CenterModal.tsx";

type Props = {
    isOpen: boolean;
    title: string;
    /** Qué pasará al anular, en una o dos frases. */
    consequence: string;
    loading?: boolean;
    onConfirm: (reason: string) => void;
    onClose: () => void;
};

/** Confirmación de anulación con su motivo (obligatorio). */
export const VoidDialog = ({isOpen, title, consequence, loading, onConfirm, onClose}: Props) => {
    const [reason, setReason] = useState("");
    const close = () => {
        setReason("");
        onClose();
    };
    return (
        <CenterModal title={title} isOpen={isOpen} onClose={close} className="max-w-lg">
            <div className="space-y-4">
                <p className="rounded-xl px-4 py-3 text-sm" style={{background: "var(--danger-soft)", color: "var(--danger)"}}>
                    <i className="fa fa-triangle-exclamation me-2"/>{consequence}
                </p>
                <label className="block">
                    <span className="form-label mb-1 block text-sm font-semibold">Motivo*</span>
                    <textarea className="textarea textarea-bordered w-full" rows={3} maxLength={255} value={reason}
                              placeholder="Ej.: transferencia rechazada por el banco"
                              onChange={(event) => setReason(event.target.value)}/>
                </label>
                <div className="flex justify-end gap-2">
                    <button type="button" className="btn btn-sm" onClick={close}>Cancelar</button>
                    <button type="button" className="btn btn-sm btn-error" disabled={!reason.trim() || loading}
                            onClick={() => onConfirm(reason.trim())}>
                        {loading ? <i className="fa fa-spinner fa-spin"/> : <i className="fa fa-ban"/>}Anular
                    </button>
                </div>
            </div>
        </CenterModal>
    );
};
