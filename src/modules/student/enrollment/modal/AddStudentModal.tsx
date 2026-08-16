import {useState} from "react";
import {DatePicker} from "../../../../components/io/DatePicker.tsx";
import { RightModal } from "../../../../components/shared/RightModal";

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export const AddStudentModal = ({ isOpen, onClose }: Props) => {
    const [birthDate, setBirthDate] = useState("");

    return (
        <RightModal title="Agregar Estudiante" isOpen={isOpen} onClose={onClose} className="w-[420px] h-full z-[9999]">
            <div className="flex flex-col h-full">
                {/* HEADER */}
                <div className="mb-6">
                    <h2 className="text-xl font-bold text-slate-900">
                        Nuevo Estudiante
                    </h2>
                    <p className="text-sm text-slate-500">
                        Complete los datos básicos del estudiante.
                    </p>
                </div>

                {/* FORM */}
                <div className="flex-1 overflow-y-auto space-y-4">
                    {/* NOMBRE */}
                    <div>
                        <label className="text-sm font-medium text-slate-700">
                            Nombre(s)
                        </label>
                        <input
                            type="text"
                            className="input w-full"
                            placeholder="Ej: Sofía"
                        />
                    </div>

                    {/* APELLIDO */}
                    <div>
                        <label className="text-sm font-medium text-slate-700">
                            Apellido(s)
                        </label>
                        <input
                            type="text"
                            className="input w-full"
                            placeholder="Ej: Martínez"
                        />
                    </div>

                    {/* GÉNERO */}
                    <div>
                        <label className="text-sm font-medium text-slate-700">
                            Género
                        </label>
                        <select className="input w-full">
                            <option value="">Seleccione</option>
                            <option value="MALE">Masculino</option>
                            <option value="FEMALE">Femenino</option>
                            <option value="OTHER">Otro</option>
                        </select>
                    </div>

                    <DatePicker
                        label="Fecha de nacimiento"
                        value={birthDate}
                        icon="fa-calendar-days"
                        onChange={setBirthDate}
                    />
                </div>

                {/* FOOTER */}
                <div className="pt-4 flex justify-end gap-2 border-t">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm rounded-md border border-slate-300 text-slate-600 hover:bg-slate-100"
                    >
                        Cancelar
                    </button>

                    <button
                        className="px-5 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 font-medium"
                    >
                        Guardar Estudiante
                    </button>
                </div>
            </div>
        </RightModal>
    );
};
