import {useMemo, useState} from "react";
import {keepPreviousData, useQuery} from "@tanstack/react-query";
import {SearchSelect} from "../SearchSelect.tsx";
import {CourseService} from "../../../../services/course/CourseService.ts";
import {Course, GradeTypeLabel} from "../../../../domain/model/course/Course.ts";
import {Pagination} from "../../../../domain/filters/Page.ts";

const courseService = CourseService.instance;

/** "Tercero A · Primaria · Desarrollo Software": nombre y sección, nivel y área especializada si la tiene. */
export const courseLabel = (course: Course) => {
    const base = [course.name, course.division].filter(Boolean).join(" ").trim() || "Curso";
    const level = course.type ? GradeTypeLabel[course.type] : "";
    const specialization = (course.specialization?.name ?? "").toString().trim();
    return [base, level, specialization].filter(Boolean).join(" · ");
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
