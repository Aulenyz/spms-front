import {useEffect, useState} from "react";
import {Input} from "../../../../components/io/Input.tsx";
import {KeyValueOf, State, UseForm} from "../../../../domain/types/steoreotype.ts";
import {useForm} from "react-hook-form";
import {yupResolver} from "@hookform/resolvers/yup";
import {Guardian, GuardianFormValues} from "../../../../domain/student/Guardian.ts";
import {GuardianSchema} from "../../../../schemas/GuardianSchema.ts";
import {GuardianService} from "../../../../services/student/guardian/GuardianService.ts";
import {toast} from "react-toastify";
import {Form} from "../../../../components/io/Form.tsx";
import {RightModal} from "../../../../components/shared/RightModal";
import {Page, Pagination} from "../../../../domain/filters/Page.ts";
import {GuardianFilter} from "../../../../domain/filters/student/GuardianFilter.tsx";
import {Pager} from "../../../../components/io/input/Pager.tsx";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onCreated?: (guardian: GuardianFormValues) => void;
}

type ViewMode = "SELECT" | "CREATE";

const guardianService = GuardianService.instance;

export const AddGuardianModal = ({isOpen, onClose, onCreated}: Props) => {
    const [view, setView] = useState<ViewMode>("SELECT");
    const [guardians, setGuardians]: State<Page<Guardian>> = useState(Pagination.empty<Guardian>());
    const [filters, setFilters]: State<KeyValueOf<string>> = useState<KeyValueOf<string>>({});
    const [pagination, setPagination]: State<Pagination> = useState(Pagination.first);

    useEffect(() => {
        guardianService.getAll(filters, pagination).then(setGuardians)
    }, [filters, pagination]);

    const {
        register,
        handleSubmit,
        formState: {errors},
        reset
    }: UseForm<GuardianFormValues> = useForm<GuardianFormValues>({
        resolver: yupResolver(GuardianSchema),
        reValidateMode: "onChange"
    });

    const doSend = async (params: GuardianFormValues) => {
        guardianService.create('', params)
            .then(() => {
                toast.success("Representante agregado con éxito");
                onCreated?.(params);
                reset();
                onClose();
            })
            .catch(() => {
                toast.error("Error agregando el representante");
            });
    };

    const handlePageChange = (page: number) => {
        setPagination((prev) => ({...prev, page}));
    };

    const handleUpdateFilter = (filters: KeyValueOf<string>) => {
        setFilters({...filters});
        handlePageChange(0);
    };

    return (
        <RightModal title="Agregar Representante" isOpen={isOpen} onClose={onClose}
                    className="w-[460px] h-full z-[9999]">
            <Form className="flex flex-col h-full" submit={handleSubmit(doSend)} name="Guardian Form">
                {/* ================= HEADER ================= */}
                <div className="mb-4">
                    <h2 className="text-xl font-bold">
                        {view === "SELECT" ? "Seleccionar Representante" : "Registrar Nuevo Representante"}
                    </h2>
                    <p className="text-sm text-slate-500">
                        {view === "SELECT" ? "Seleccione un representante existente o búsquelo por documento." : "Complete los datos del representante."}
                    </p>
                </div>

                {/* ================= BODY ================= */}
                <div className="flex-1 overflow-y-auto">
                    {view === "SELECT" && (
                        <div className="space-y-4">
                            <GuardianFilter onFilter={handleUpdateFilter}/>
                            {/* LIST */}
                            {guardians.content.map((guardian: Guardian) => (
                                <div>
                                    <div className="space-y-3">
                                        <button type="button"
                                                className="w-full text-left p-4 border rounded-lg hover:bg-blue-50">
                                            <h4 className="font-semibold">{guardian.firstname} {guardian.lastname}</h4>
                                            <p className="text-xs text-slate-500">Doc: {guardian.document}</p>
                                        </button>
                                    </div>
                                </div>
                            ))}
                            <div className="mt-3 border-t pt-3 flex justify-end">
                                <Pager page={guardians} onChange={handlePageChange} compact showSummary={false}
                                       className="text-slate-500" paginationClassName="justify-center"/>
                            </div>

                            <div className="pt-4 border-t text-center">
                                <button type="button" onClick={() => setView("CREATE")}
                                        className="text-sm text-blue-600 hover:underline">
                                    + Registrar nuevo representante
                                </button>
                            </div>
                        </div>
                    )}

                    {view === "CREATE" && (
                        <div className="space-y-4">
                            <Input label="Documento*" {...register("document")} error={errors.document?.message}/>
                            <Input label="Nombre(s)*" {...register("firstname")} error={errors.firstname?.message}/>
                            <Input label="Apellido(s)*" {...register("lastname")} error={errors.lastname?.message}/>
                            <Input label="Teléfono*" {...register("phone")} error={errors.phone?.message}/>
                            <Input label="Email" {...register("email")} error={errors.email?.message}/>
                            <Input label="Dirección" {...register("address")} error={errors.address?.message}/>
                            <div className="pt-4 border-t text-center">
                                <button type="button" onClick={() => setView("SELECT")}
                                        className="text-sm text-blue-600 hover:underline">
                                    ← Volver a seleccionar
                                </button>
                            </div>
                        </div>
                    )}
                </div>
                {/* ================= FOOTER ================= */}
                <div className="pt-4 border-t flex justify-end gap-2">
                    <button type="button" onClick={onClose} className="px-4 py-2 border rounded-md text-sm">
                        Cancelar
                    </button>
                    {view === "CREATE" && (
                        <button type="submit" className="px-5 py-2 bg-blue-600 text-white rounded-md text-sm">
                            Guardar Representante
                        </button>
                    )}
                </div>
            </Form>
        </RightModal>
    );
};
