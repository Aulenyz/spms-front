import {useEffect, useState} from "react";
import {useLocation, useParams} from "react-router-dom";
import {toast} from "react-toastify";

import {Guardian} from "../../domain/student/Guardian.ts";
import {GuardianService} from "../../services/student/guardian/GuardianService.ts";
import {DetailHeader} from "../../components/ui/detail/DetailHeader.tsx";
import {DetailSection} from "../../components/ui/detail/DetailSection.tsx";
import {InfoList} from "../../components/ui/detail/InfoList.tsx";
import {EmptyState} from "../../components/ui/feedback/EmptyState.tsx";
import {LoadingContent} from "../../components/io/output/LoadingContent.tsx";

const guardianService = GuardianService.instance;

const getApiErrorMessage = (error: unknown) => {
    if (!error) return null;
    if (typeof error === "string") return error;
    if (typeof error === "object") {
        const maybeMessage = (error as {message?: unknown}).message;
        if (typeof maybeMessage === "string" && maybeMessage.trim()) return maybeMessage;
    }
    return null;
};

export const GuardianDetailsPage = () => {
    const {id} = useParams<{id: string}>();
    const location = useLocation();
    const stateGuardian = (location.state as {guardian?: Guardian} | null)?.guardian;

    const [loading, setLoading] = useState(false);
    const [guardian, setGuardian] = useState<Guardian | null>(stateGuardian ?? null);

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        guardianService
            .getOne(id)
            .then((res) => setGuardian(res ?? null))
            .catch((error) => {
                toast.error(getApiErrorMessage(error) ?? "No se pudo cargar el detalle del representante.");
                setGuardian(null);
            })
            .finally(() => setLoading(false));
    }, [id]);

    if (loading && !guardian) return <LoadingContent loading className="py-16"/>;
    if (!guardian) return <EmptyState title="No se encontró el representante"
                                      description="Vuelve al listado e intenta nuevamente." icon="fa-user"/>;

    const name = `${guardian.firstname ?? ""} ${guardian.lastname ?? ""}`.trim() || guardian.name || "Representante";

    return (
        <div className="space-y-4">
            <DetailHeader
                avatar={name}
                title={name}
                subtitle={guardian.document ? `Documento ${guardian.document}` : "Sin documento registrado"}
            />

            <DetailSection title="Datos de contacto">
                <InfoList items={[
                    {label: "Teléfono", value: guardian.phone},
                    {label: "Correo", value: guardian.email},
                    {label: "Dirección", value: guardian.address, full: true},
                ]}/>
            </DetailSection>
        </div>
    );
};
