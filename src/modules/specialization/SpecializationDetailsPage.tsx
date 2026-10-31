import {useEffect, useState} from "react";
import {useQueryClient} from "@tanstack/react-query";
import {queryKeys} from "../../app/query/queryKeys.ts";
import {useParams} from "react-router-dom";
import {toast} from "react-toastify";

import {GradeType, GradeTypeLabel, Specialization} from "../../domain/model/course/Course.ts";
import {SpecializationService} from "../../services/specialization/SpecializationService.ts";
import {RightModal} from "../../components/shared/RightModal.tsx";
import {DropdownSelect} from "../../components/io/input/DropdownSelect.tsx";
import {SelectOption} from "../../components/io/output/Select.tsx";
import {useAuthContext} from "../../contexts/AuthContext.tsx";
import {AuthorityKey} from "../../domain/model/user/authorities.ts";
import {LoadingContent} from "../../components/io/output/LoadingContent.tsx";
import {EmptyState} from "../../components/ui/feedback/EmptyState.tsx";
import {DetailHeader} from "../../components/ui/detail/DetailHeader.tsx";
import {DetailSection} from "../../components/ui/detail/DetailSection.tsx";
import {InfoList} from "../../components/ui/detail/InfoList.tsx";
import {StatusBadge} from "../../components/ui/detail/StatusBadge.tsx";

const specializationService = SpecializationService.instance;

const getApiErrorMessage = (error: unknown) => {
    if (!error) return null;
    if (typeof error === "string") return error;
    if (typeof error === "object") {
        const maybeMessage = (error as {message?: unknown}).message;
        if (typeof maybeMessage === "string" && maybeMessage.trim()) return maybeMessage;
    }
    return null;
};

const typeOptions: SelectOption[] = Object.values(GradeType).map((type) => ({
    value: type,
    description: GradeTypeLabel[type],
}));

export const SpecializationDetailsPage = () => {
    const {hasAuthority} = useAuthContext();
    const queryClient = useQueryClient();
    const {id} = useParams<{id: string}>();
    const canEdit = hasAuthority(AuthorityKey.SPECIALIZATION_EDIT);
    const canChangeStatus = hasAuthority(AuthorityKey.SPECIALIZATION_STATUS_UPDATE);

    const [loading, setLoading] = useState(false);
    const [entity, setEntity] = useState<Specialization | null>(null);
    const [showEdit, setShowEdit] = useState(false);
    const [editValues, setEditValues] = useState<{name: string; description: string; type: GradeType | ""}>({
        name: "",
        description: "",
        type: "",
    });
    const [saving, setSaving] = useState(false);
    const [togglingStatus, setTogglingStatus] = useState(false);

    const refresh = async () => {
        if (!id) return;
        setLoading(true);
        try {
            const response = await specializationService.getOne(id);
            setEntity(response ?? null);
        } catch (error) {
            toast.error(getApiErrorMessage(error) ?? "No se pudo cargar el detalle.");
            setEntity(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void refresh();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    // Tras modificar el área se refresca el detalle y se invalida el listado en caché.
    const refreshAfterChange = async () => {
        void queryClient.invalidateQueries({queryKey: queryKeys.specializations.all});
        await refresh();
    };

    useEffect(() => {
        if (!entity) return;
        setEditValues({
            name: (entity.name ?? "").toString(),
            description: (entity.description ?? "").toString(),
            type: entity.type ?? "",
        });
    }, [entity]);

    const toggleStatus = () => {
        if (!entity?.id) return;
        setTogglingStatus(true);
        specializationService
            .updateStatus(entity.id)
            .then(() => {
                toast.success("Estado actualizado.");
                void refreshAfterChange();
            })
            .catch((error) => toast.error(getApiErrorMessage(error) ?? "No se pudo actualizar el estado."))
            .finally(() => setTogglingStatus(false));
    };

    const save = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!entity?.id) return;
        const name = editValues.name.trim();
        const description = editValues.description.trim();
        if (!name) return toast.error("El nombre es requerido.");
        if (!description) return toast.error("La descripción es requerida.");
        if (!editValues.type) return toast.error("El tipo es requerido.");
        setSaving(true);
        specializationService
            .update(entity.id, {name, description, type: editValues.type})
            .then(() => {
                toast.success("Área actualizada.");
                setShowEdit(false);
                void refreshAfterChange();
            })
            .catch((error) => toast.error(getApiErrorMessage(error) ?? "No se pudo actualizar."))
            .finally(() => setSaving(false));
    };

    if (loading && !entity) return <LoadingContent loading className="py-16"/>;
    if (!entity) return <EmptyState title="No se encontró el área especializada"
                                    description="Vuelve al listado e intenta nuevamente." icon="fa-layer-group"/>;

    const title = entity.name ?? "Área especializada";

    return (
        <div className="space-y-4">
            <DetailHeader
                avatar={title}
                title={title}
                subtitle="Área especializada"
                badges={<StatusBadge active={entity.active} activeLabel="Activa" inactiveLabel="Inactiva"/>}
                actions={<>
                    {canChangeStatus && (
                        <button type="button" className="btn btn-sm" disabled={togglingStatus} onClick={toggleStatus}>
                            <i className={togglingStatus ? "fa fa-spinner fa-spin" : entity.active ? "fa fa-circle-pause" : "fa fa-circle-check"}/>
                            {entity.active ? "Inactivar" : "Activar"}
                        </button>
                    )}
                    {canEdit && (
                        <button type="button" className="btn btn-sm btn-primary" onClick={() => setShowEdit(true)}>
                            <i className="fa fa-pen"/>Editar
                        </button>
                    )}
                </>}
            />

            <DetailSection title="Información">
                <InfoList items={[
                    {label: "Tipo", value: entity.type ? GradeTypeLabel[entity.type] : undefined},
                    {label: "Descripción", value: entity.description, full: true},
                ]}/>
            </DetailSection>

            <RightModal
                title="Editar área"
                isOpen={canEdit && showEdit}
                onClose={() => setShowEdit(false)}
                className="w-[420px] h-full z-[9999]"
            >
                <form className="relative flex h-full flex-col gap-4 px-5 pb-20 pt-4" onSubmit={save}>
                    <label className="block">
                        <span className="form-label">Nombre *</span>
                        <span className="input input-sm w-full">
                            <input
                                value={editValues.name}
                                onChange={(e) => setEditValues((p) => ({...p, name: e.target.value}))}
                                placeholder="Nombre del área"
                                maxLength={40}
                            />
                        </span>
                    </label>

                    <label className="block">
                        <span className="form-label">Descripción *</span>
                        <span className="input input-sm w-full">
                            <input
                                value={editValues.description}
                                onChange={(e) => setEditValues((p) => ({...p, description: e.target.value}))}
                                placeholder="Descripción del área"
                            />
                        </span>
                    </label>

                    <div>
                        <span className="form-label">Tipo *</span>
                        <DropdownSelect
                            text="Seleccionar tipo"
                            hasError={false}
                            options={typeOptions}
                            value={editValues.type}
                            onSelect={(value) => setEditValues((p) => ({...p, type: value as GradeType}))}
                            className="w-full"
                        />
                    </div>

                    <div className="absolute bottom-5 left-5 right-5 flex items-center justify-end gap-2">
                        <button type="button" className="btn btn-sm" onClick={() => setShowEdit(false)} disabled={saving}>
                            Cancelar
                        </button>
                        <button type="submit" className="btn btn-sm btn-primary" disabled={saving}>
                            <i className={saving ? "fa fa-spinner fa-spin" : "fa fa-check"}/>
                            {saving ? "Guardando..." : "Guardar"}
                        </button>
                    </div>
                </form>
            </RightModal>
        </div>
    );
};
