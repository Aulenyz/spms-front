import {useMemo, useState} from "react";
import {keepPreviousData, useQuery} from "@tanstack/react-query";
import {SearchSelect} from "../SearchSelect.tsx";
import {CourseService} from "../../../../services/course/CourseService.ts";
import {Course} from "../../../../domain/model/course/Course.ts";
import {Pagination} from "../../../../domain/filters/Page.ts";

const courseService = CourseService.instance;

/** "Primero A · Ciencias": nombre y sección, y la especialización si la tiene. */
export const courseLabel = (course: Course) => {
    const base = [course.name, course.division].filter(Boolean).join(" ").trim();
    const specialization = (course.specialization?.name ?? "").toString().trim();
    return base && specialization ? `${base} · ${specialization}` : base || specialization || "Curso";
};

/** Buscador de cursos del periodo actual con el mismo SearchSelect de los demás formularios. */
export const CourseSearchSelect = ({value, onChange, hasError = false}: {
    value: Course | null;
    onChange: (course: Course | null) => void;
    hasError?: boolean;
}) => {
    const [term, setTerm] = useState("");
    const {data} = useQuery({
        queryKey: ["courses", "search-select", term],
        queryFn: ({signal}) => courseService.withSignal(signal).search(term, {...Pagination.first, size: 20}),
        placeholderData: keepPreviousData,
        meta: {silent: true},
    });
    const courses = useMemo(() => {
        const list = data?.content ?? [];
        // El curso elegido siempre está entre las opciones, aunque la búsqueda actual no lo traiga.
        return value && !list.some((course) => course.id === value.id) ? [value, ...list] : list;
    }, [data, value]);

    return (
        <SearchSelect
            text="Busca el curso"
            hasError={hasError}
            value={value?.id}
            options={courses.map((course) => ({value: course.id, description: courseLabel(course)}))}
            onSearch={setTerm}
            onSelect={(id) => onChange(courses.find((course) => course.id === Number(id)) ?? null)}
            portal
        />
    );
};
