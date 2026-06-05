import ReactDOM from "react-dom";
import { useState } from "react";
import { StudentService } from "../../services/student/StudentService";
import { ValidationError } from "yup";
import { StudentSchema } from "../../schemas/StudentSchema";

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export const StudentModal = ({ isOpen, onClose }: Props) => {
    const [firstname, setFirstname] = useState("");
    const [lastname, setLastname] = useState("");
    const [gender, setGender] = useState("");
    const [birthDate, setBirthDate] = useState("");

    const [errors, setErrors] = useState<Record<string, string>>({});

    const studentService = StudentService.instance;

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            setErrors({});


            await StudentSchema.validate(
                {
                    firstname,
                    lastname,
                    gender,
                    birthDate: birthDate || null,
                },
                { abortEarly: false }
            );

            await studentService.save({
                firstname,
                lastname,
                gender,
                birthDate: birthDate || null,
            });

            setFirstname("");
            setLastname("");
            setGender("");
            setBirthDate("");

            onClose();
        } catch (error) {
            if (error instanceof ValidationError) {
                const validationErrors: Record<string, string> = {};

                error.inner.forEach((err) => {
                    if (err.path) {
                        validationErrors[err.path] = err.message;
                    }
                });

                setErrors(validationErrors);
                return;
            }

            console.error(error);
        }
    };

    if (!isOpen) return null;

    return ReactDOM.createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex justify-end">
            <section className="h-full w-full max-w-4xl bg-white shadow-2xl overflow-y-auto">

                <div className="border-b px-6 py-5 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">
                            Registrar Estudiante
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Complete la información para registrar un nuevo estudiante.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="h-10 w-10 rounded-lg border hover:bg-gray-100"
                    >
                        X
                    </button>
                </div>

                <form onSubmit={handleSave} className="p-6">

                    <div className="bg-white border rounded-xl p-6">
                        <h3 className="text-lg font-semibold mb-6">
                            Información del estudiante
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                            <div>
                                <label className="block mb-2 font-medium">
                                    Nombre(s)*
                                </label>
                                <input
                                    type="text"
                                    value={firstname}
                                    onChange={(e) => setFirstname(e.target.value)}
                                    className="w-full border rounded-lg px-3 py-2"
                                />
                                {errors.firstname && (
                                    <p className="text-red-500 text-sm mt-1">
                                        {errors.firstname}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block mb-2 font-medium">
                                    Apellido(s)*
                                </label>
                                <input
                                    type="text"
                                    value={lastname}
                                    onChange={(e) => setLastname(e.target.value)}
                                    className="w-full border rounded-lg px-3 py-2"
                                />
                                {errors.lastname && (
                                    <p className="text-red-500 text-sm mt-1">
                                        {errors.lastname}
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className="block mb-2 font-medium">
                                    Género*
                                </label>
                                <select
                                    value={gender}
                                    onChange={(e) => setGender(e.target.value)}
                                    className="w-full border rounded-lg px-3 py-2"
                                >
                                    <option value="">Seleccione</option>
                                    <option value="MALE">Masculino</option>
                                    <option value="FEMALE">Femenino</option>
                                    <option value="OTHER">Otro</option>
                                </select>
                                {errors.gender && (
                                    <p className="text-red-500 text-sm mt-1">
                                        {errors.gender}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block mb-2 font-medium">
                                    Fecha de nacimiento
                                </label>
                                <input
                                    type="date"
                                    value={birthDate}
                                    onChange={(e) => setBirthDate(e.target.value)}
                                    className="w-full border rounded-lg px-3 py-2"
                                />
                                {errors.birthDate && (
                                    <p className="text-red-500 text-sm mt-1">
                                        {errors.birthDate}
                                    </p>
                                )}
                            </div>

                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-6 border-t pt-5">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2 border rounded-lg"
                        >
                            Cancelar
                        </button>

                        <button
                            type="submit"
                            className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            Guardar
                        </button>
                    </div>

                </form>
            </section>
        </div>,
        document.body
    );
};