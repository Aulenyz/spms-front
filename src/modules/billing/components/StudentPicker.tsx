import {useState} from "react";
import {keepPreviousData, useQuery} from "@tanstack/react-query";
import {SearchSelect} from "../../../components/io/input/SearchSelect.tsx";
import {StudentService} from "../../../services/student/StudentService.ts";
import {Pagination} from "../../../domain/filters/Page.ts";
import {PersonRef} from "../../../domain/billing/Invoice.ts";

const studentService = StudentService.instance;

/** Buscador de estudiantes por nombre o documento. */
export const StudentPicker = ({value, onChange, label = "Estudiante"}: {
    value: PersonRef | null;
    onChange: (student: PersonRef | null) => void;
    label?: string;
}) => {
    const [term, setTerm] = useState("");
    const {data} = useQuery({
        queryKey: ["students", "picker", term],
        queryFn: ({signal}) => studentService.withSignal(signal).search(term, {...Pagination.first, size: 8}),
        placeholderData: keepPreviousData,
        meta: {silent: true},
    });
    const options = (data?.content ?? []).map((student) => ({
        value: student.id,
        description: `${student.firstname} ${student.lastname} · ${student.document}`,
        person: {id: student.id, name: `${student.firstname} ${student.lastname}`, document: String(student.document)},
    }));
    return (
        <label className="block">
            <span className="form-label mb-1 block text-sm font-semibold">{label}</span>
            <SearchSelect
                text="Busca por nombre o documento"
                hasError={false}
                value={value?.id}
                options={options}
                onSearch={setTerm}
                onSelect={(id) => onChange(options.find((option) => option.value === Number(id))?.person ?? null)}
                portal
            />
        </label>
    );
};
