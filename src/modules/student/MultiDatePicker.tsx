import { useState } from "react";

interface Props {
    value: string[];
    onChange: (dates: string[]) => void;
    label?: string;
}

export const MultiDatePicker = ({ value, onChange, label }: Props) => {
    const [date, setDate] = useState("");

    const today = new Date().toISOString().split("T")[0];

    const addDate = () => {
        if (!date) return;

        if (date > today) {
            alert("No puedes seleccionar fechas futuras");
            return;
        }

        if (value.includes(date)) return;

        onChange([...value, date]);
        setDate("");
    };

    const removeDate = (d: string) => {
        onChange(value.filter((x) => x !== d));
    };

    return (
        <div className="space-y-2">
            {label && (
                <label className="block font-medium">{label}</label>
            )}

            <div className="flex gap-2">
                <input
                    type="date"
                    value={date}
                    max={today}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2"
                />

                <button
                    type="button"
                    onClick={addDate}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg"
                >
                    Agregar
                </button>
            </div>

            {/* lista de fechas */}
            <div className="flex flex-wrap gap-2 mt-2">
                {value.map((d) => (
                    <div
                        key={d}
                        className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full"
                    >
                        <span>{d}</span>

                        <button
                            type="button"
                            onClick={() => removeDate(d)}
                            className="text-red-500 font-bold"
                        >
                            ×
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};