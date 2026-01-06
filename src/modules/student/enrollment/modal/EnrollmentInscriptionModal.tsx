import {LeftModal} from "../../../../components/shared/LeftModal.tsx";
import SidebarLink from "../../../shared/main/SidebarLink";

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export const EnrollmentInscriptionModal = ({isOpen, onClose}: Props) => {
    return (
        <LeftModal title="Gestión de Pagos de Inscripción" isOpen={isOpen} onClose={onClose} className="w-[1200px] h-full z-[9999]">
            <div className="h-full overflow-y-auto bg-slate-100 p-6">
                {/* HEADER */}
                <div className="mb-6">
                    <h1 className="text-2xl font-black text-slate-900">
                        Gestión de Pagos
                    </h1>
                    <p className="text-slate-500">
                        Seleccione un estudiante, su representante y agregue los conceptos a facturar.
                    </p>
                </div>

                <div className="grid grid-cols-12 gap-6">
                    {/* LEFT COLUMN */}
                    <div className="col-span-8 flex flex-col gap-6">
                        {/* ================= ESTUDIANTE ================= */}
                        <section className="bg-white rounded-xl border border-slate-200 shadow-sm">
                            <div className="p-5 border-b flex justify-between items-center bg-slate-50">
                                <h3 className="font-bold flex items-center gap-2">
                                    <span className="size-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center">
                                        1
                                    </span>
                                    Estudiante
                                </h3>

                                <SidebarLink icon="fa-user-plus" label="Gestión de Pagos" collapsed={collapsed} onClick={() => setShowEnrollmentModal(true)}/>
                                <AddStudentModal isOpen={showEnrollmentModal} onClose={() => setShowEnrollmentModal(false)}/>
                            </div>

                            <div className="p-5">
                                {/* STUDENT CARD */}
                                <div className="flex gap-5 p-4 bg-blue-50 border border-blue-200 rounded-xl relative">
                                    <button
                                        className="absolute top-3 right-3 text-slate-400 hover:text-blue-600"
                                        title="Cambiar estudiante"
                                    >
                                        <i className="fa fa-edit"/>
                                    </button>

                                    <div className="size-20 rounded-full bg-slate-300"/>

                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold">
                                            Sofía Martínez
                                        </h3>

                                        <div className="flex flex-wrap gap-6 mt-2 text-sm text-slate-600">
                                            <span>Documento: <b>2023-8492</b></span>
                                            <span>Grado: <b>5to Secundaria</b></span>
                                            <span>
                                                Saldo Pendiente: <b className="text-red-500">$0.00</b>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* ================= REPRESENTANTE ================= */}
                        <section className="bg-white rounded-xl border border-slate-200 shadow-sm">
                            <div className="p-5 border-b flex justify-between items-center bg-slate-50">
                                <h3 className="font-bold flex items-center gap-2">
                                    <span className="size-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center">
                                        2
                                    </span>
                                    Representante
                                </h3>

                                <button
                                    className="text-sm px-3 py-1 rounded-md bg-blue-600 text-white hover:bg-blue-700">
                                    Seleccionar representante
                                </button>
                            </div>

                            <div className="p-5">
                                {/* GUARDIAN CARD */}
                                <div className="flex gap-5 p-4 bg-slate-50 border border-slate-200 rounded-xl relative">
                                    <button
                                        className="absolute top-3 right-3 text-slate-400 hover:text-blue-600"
                                        title="Cambiar representante"
                                    >
                                        <i className="fa fa-edit"/>
                                    </button>

                                    <div className="size-16 rounded-full bg-slate-300"/>

                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold">
                                            María González
                                        </h3>

                                        <div className="flex flex-wrap gap-6 mt-2 text-sm text-slate-600">
                                            <span>Documento: <b>001-9876543-2</b></span>
                                            <span>Teléfono: <b>809-555-1234</b></span>
                                            <span>Email: <b>maria@email.com</b></span>
                                        </div>

                                        {/* RELATIONSHIP */}
                                        <div className="mt-4 max-w-xs">
                                            <label className="text-sm font-medium">Relación</label>
                                            <select className="input w-full">
                                                <option value="MOTHER">Madre</option>
                                                <option value="FATHER">Padre</option>
                                                <option value="TUTOR">Tutor</option>
                                                <option value="GRANDPARENT">Abuelo/a</option>
                                                <option value="UNCLE">Tío/a</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* ================= CONCEPTOS ================= */}
                        <section className="bg-white rounded-xl border border-slate-200 shadow-sm flex-1">
                            <div className="p-5 border-b bg-slate-50">
                                <h3 className="font-bold flex items-center gap-2">
                                    <span className="size-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center">
                                        3
                                    </span>
                                    Conceptos de Pago
                                </h3>
                            </div>

                            <div className="p-5 grid grid-cols-3 gap-4">
                                <button className="border rounded-xl p-4 text-left hover:border-blue-600 hover:shadow">
                                    <h4 className="font-semibold">Matrícula Anual</h4>
                                    <p className="text-xs text-slate-500">Inscripción 2024</p>
                                    <span className="font-bold">$200.00</span>
                                </button>

                                <button className="border rounded-xl p-4 text-left hover:border-blue-600 hover:shadow">
                                    <h4 className="font-semibold">Seguro</h4>
                                    <p className="text-xs text-slate-500">Cobertura anual</p>
                                    <span className="font-bold">$30.00</span>
                                </button>

                                <button
                                    className="border-dashed border-2 rounded-xl p-4 flex flex-col items-center justify-center text-slate-500 hover:border-blue-600">
                                    <i className="fa fa-plus mb-2"/>
                                    Agregar otro
                                </button>
                            </div>
                        </section>
                    </div>

                    {/* RIGHT COLUMN */}
                    <div className="col-span-4 flex flex-col gap-4">
                        <div className="bg-white rounded-xl border border-slate-200 shadow-lg">
                            <div className="p-5 border-b bg-slate-50">
                                <h3 className="font-bold text-lg">Resumen de Pago</h3>
                            </div>

                            <div className="p-5 space-y-4 max-h-[300px] overflow-y-auto">
                                <div className="flex justify-between">
                                    <span>Matrícula Anual</span>
                                    <b>$200.00</b>
                                </div>
                                <div className="flex justify-between">
                                    <span>Seguro</span>
                                    <b>$30.00</b>
                                </div>
                            </div>

                            <div className="border-t p-5 space-y-3">
                                <div className="flex justify-between text-sm text-slate-500">
                                    <span>Subtotal</span>
                                    <span>$230.00</span>
                                </div>

                                <div className="flex justify-between text-lg font-bold">
                                    <span>Total</span>
                                    <span>$230.00</span>
                                </div>

                                <button className="w-full mt-3 py-3 bg-blue-600 text-white rounded-lg font-bold">
                                    Registrar Pago
                                </button>
                            </div>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl text-sm text-blue-800">
                            Recuerde verificar si el estudiante tiene saldos pendientes antes de crear un nuevo
                            plan de financiamiento.
                        </div>
                    </div>
                </div>
            </div>
        </LeftModal>
    );
};
