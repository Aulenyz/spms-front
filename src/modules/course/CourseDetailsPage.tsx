import {useEffect, useMemo, useState} from "react";
import {Link, useLocation, useParams} from "react-router-dom";
import clsx from "clsx";
import {toast} from "react-toastify";

import {Course} from "../../domain/model/course/Course.ts";
import {CourseService} from "../../services/course/CourseService.ts";

type TabKey = "students" | "subjects" | "teachers";

const TABS: Array<{key: TabKey; label: string; icon: string; hint: string}> = [
    {key: "students", label: "Estudiantes", icon: "fa-user-graduate", hint: "Listado"},
    {key: "subjects", label: "Materias", icon: "fa-book-open", hint: "Plan"},
    {key: "teachers", label: "Profesores", icon: "fa-chalkboard-user", hint: "Asignados"},
];

const courseService = CourseService.instance;

const getApiErrorMessage = (error: unknown) => {
    if (!error) return null;
    if (typeof error === "string") return error;
    if (typeof error === "object") {
        const maybeMessage = (error as {message?: unknown}).message;
        if (typeof maybeMessage === "string" && maybeMessage.trim()) return maybeMessage;
    }
    return null;
};

export const CourseDetailsPage = () => {
    const {id} = useParams<{id: string}>();
    const location = useLocation();
    const stateCourse = (location.state as {course?: Course} | null)?.course;

    const [loading, setLoading] = useState(false);
    const [course, setCourse] = useState<Course | null>(stateCourse ?? null);
    const [tab, setTab] = useState<TabKey>("students");

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        courseService
            .getOne(id)
            .then((res) => setCourse(res ?? null))
            .catch((error) => {
                toast.error(getApiErrorMessage(error) ?? "No se pudo cargar el detalle del curso.");
                setCourse(null);
            })
            .finally(() => setLoading(false));
    }, [id]);

    const title = useMemo(() => course?.division ?? "Curso", [course?.division]);
    const specialization = useMemo(() => course?.specialization?.name ?? "Sin área especializada", [course?.specialization?.name]);

    const renderBody = () => {
        if (loading) {
            return <div className="p-6 text-sm font-semibold" style={{color: "var(--text-secondary)"}}>Cargando...</div>;
        }

        if (!course) {
            return <div className="p-6 text-sm font-semibold" style={{color: "var(--text-secondary)"}}>No se encontro el curso.</div>;
        }

        const rows = tab === "students"
            ? [
                {name: "Estudiante demo", note: "Pendiente endpoint"},
                {name: "Otro estudiante demo", note: "Pendiente endpoint"},
            ]
            : tab === "subjects"
                ? [
                    {name: "Materia demo", note: "Pendiente endpoint"},
                    {name: "Materia demo 2", note: "Pendiente endpoint"},
                ]
                : [
                    {name: "Profesor demo", note: "Pendiente endpoint"},
                ];

        return (
            <table className="table-shell">
                <thead>
                <tr>
                    <th scope="col">Nombre</th>
                    <th scope="col">Nota</th>
                </tr>
                </thead>
                <tbody>
                {rows.map((row) => (
                    <tr key={row.name}>
                        <td><strong>{row.name}</strong></td>
                        <td>{row.note}</td>
                    </tr>
                ))}
                </tbody>
            </table>
        );
    };

    return (
        <div className="space-y-5">
            <div
                className="px-4 pb-4 pt-8 sm:px-6 sm:pb-5"
                style={{
                    background:
                        "radial-gradient(circle at top, rgba(15, 98, 254, 0.08), transparent 55%)," +
                        "radial-gradient(circle at top right, rgba(18, 128, 92, 0.06), transparent 45%)," +
                        "linear-gradient(180deg, rgba(255,255,255,0.9), rgba(255,255,255,0.9))",
                }}
            >
                <div className="mx-auto flex w-full max-w-[1480px] flex-col items-center text-center">
                    <div
                        className="mb-3 flex h-20 w-20 items-center justify-center rounded-full border text-lg font-extrabold"
                        style={{borderColor: "var(--border-soft)", background: "var(--surface)", boxShadow: "var(--shadow-card)", color: "var(--text-primary)"}}
                    >
                        <i className="fa fa-book"/>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-2">
                        <h1 className="text-2xl font-extrabold tracking-tight" style={{color: "var(--text-primary)"}}>
                            {title}
                        </h1>
                        <Link
                            to="/courses/list"
                            className="inline-flex items-center justify-center rounded-full border px-3 py-1.5 text-xs font-semibold"
                            style={{borderColor: "var(--border-soft)", background: "var(--surface)", color: "var(--text-secondary)"}}
                        >
                            Cursos
                        </Link>
                    </div>

                    <div className="mt-2 max-w-[820px] text-sm font-semibold" style={{color: "var(--text-secondary)"}}>
                        {specialization}
                    </div>
                </div>
            </div>

            <div className="mx-auto w-full max-w-[1480px] px-2 sm:px-4">
                <div
                    className="flex flex-wrap items-center justify-between gap-3 rounded-[22px] border px-4 py-3"
                    style={{
                        borderColor: "var(--border-soft)",
                        background: "color-mix(in srgb, var(--surface) 95%, transparent)",
                        boxShadow: "var(--shadow-soft)",
                    }}
                >
                    <div className="flex flex-wrap items-center gap-2">
                        {TABS.map((item) => (
                            <button
                                key={item.key}
                                type="button"
                                onClick={() => setTab(item.key)}
                                className={clsx(
                                    "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold transition",
                                    item.key === tab ? "shadow-sm" : "opacity-80 hover:opacity-100"
                                )}
                                style={{
                                    borderColor: "var(--border-soft)",
                                    background: item.key === tab ? "var(--surface)" : "transparent",
                                    color: item.key === tab ? "var(--text-primary)" : "var(--text-secondary)",
                                }}
                            >
                                <i className={`fa ${item.icon}`}/>
                                <span>{item.label}</span>
                                <span className="text-xs" style={{color: "var(--text-tertiary)"}}>
                                    {item.hint}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="mt-4 overflow-hidden rounded-[26px] border" style={{borderColor: "var(--border-soft)", background: "var(--surface)", boxShadow: "var(--shadow-card)"}}>
                    {renderBody()}
                </div>
            </div>
        </div>
    );
};

