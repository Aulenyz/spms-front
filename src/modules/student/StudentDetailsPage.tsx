import {useState} from "react";
import {useParams} from "react-router-dom";
import {useQuery} from "@tanstack/react-query";
import clsx from "clsx";
import {queryKeys} from "../../app/query/queryKeys.ts";
import {StudentService} from "../../services/student/StudentService.ts";
import {EnrollmentService} from "../../services/student/enrollment/EnrollmentService.ts";
import {Pagination} from "../../domain/filters/Page.ts";
import {Student} from "../../domain/student/Student.ts";
import {RelationshipLabel} from "../../domain/student/Guardian.ts";
import {Gender, Genders} from "../../domain/model/user/user.ts";
import {formatDate} from "../../domain/billing/Invoice.ts";
import {AuthorityKey} from "../../domain/model/user/authorities.ts";
import {useAuthContext} from "../../contexts/AuthContext.tsx";
import {PermittedLink} from "../../components/auth/PermittedLink.tsx";
import {DetailHeader} from "../../components/ui/detail/DetailHeader.tsx";
import {DetailSection} from "../../components/ui/detail/DetailSection.tsx";
import {LoadingContent} from "../../components/io/output/LoadingContent.tsx";
import {EmptyState} from "../../components/ui/feedback/EmptyState.tsx";
import {StudentStatusPill} from "../../components/io/output/pill/StudentStatusPill.tsx";
import {EnrollmentStatusPill} from "../../components/io/output/pill/EnrollmentStatusPill.tsx";
import {GradeTypePill} from "../../components/io/output/pill/GradeTypePill.tsx";

/** El estudiante como lo devuelve el detalle: incluye la fecha de nacimiento. */
type StudentDetails = Student & {birthDate?: string};
type Tab = "guardians" | "enrollments";

const yearsOld = (birthDate: string) => {
    const [year, month, day] = birthDate.split("-").map(Number);
    const today = new Date();
    return today.getFullYear() - year - (today.getMonth() + 1 < month || (today.getMonth() + 1 === month && today.getDate() < day) ? 1 : 0);
};

/**
 * Ficha del estudiante. El resumen (matrícula, género, nacimiento y estado) va en el encabezado y se ve
 * en todas las pestañas, junto al botón del estado de cuenta; representantes e inscripciones van cada
 * uno en su pestaña.
 */
export const StudentDetailsPage = () => {
    const {id = ""} = useParams();
    const {hasAuthority} = useAuthContext();
    const studentId = Number(id);
    const tabs: {key: Tab; label: string; icon: string; visible: boolean}[] = [
        {key: "guardians", label: "Representantes", icon: "fa-user-group", visible: true},
        {key: "enrollments", label: "Inscripciones", icon: "fa-file-signature", visible: hasAuthority(AuthorityKey.ENROLLMENTS_VIEW)},
    ];
    const [tab, setTab] = useState<Tab>("guardians");

    const studentQuery = useQuery({
        queryKey: [...queryKeys.students.all, "details", id],
        queryFn: ({signal}) => StudentService.instance.withSignal(signal).getOne(id) as Promise<StudentDetails>,
        meta: {errorMessage: "No se pudo cargar el estudiante."},
    });
    const guardiansQuery = useQuery({
        queryKey: [...queryKeys.students.all, "guardians", id],
        queryFn: ({signal}) => StudentService.instance.withSignal(signal).guardians(studentId),
        enabled: tab === "guardians",
        meta: {errorMessage: "No se pudieron cargar los representantes."},
    });
    const enrollmentsQuery = useQuery({
        queryKey: [...queryKeys.enrollments.all, "by-student", id],
        queryFn: ({signal}) => EnrollmentService.instance.withSignal(signal).getAll({studentId}, Pagination.ofSize(20)),
        enabled: tab === "enrollments",
        meta: {errorMessage: "No se pudieron cargar las inscripciones."},
    });

    const student = studentQuery.data;
    if (studentQuery.isPending) return <LoadingContent loading className="min-h-[320px]"><span/></LoadingContent>;
    if (!student) return <EmptyState title="Estudiante no encontrado" icon="fa-user-graduate" description="Vuelve al listado e intenta de nuevo."/>;

    const name = [student.firstname, student.lastname].filter(Boolean).join(" ");
    const guardians = guardiansQuery.data ?? [];
    const enrollments = [...(enrollmentsQuery.data?.content ?? [])].sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));

    return (
        <div className="space-y-6">
            <DetailHeader
                avatar={name}
                title={name}
                subtitle={[
                    `Matrícula ${student.document}`,
                    Genders[student.gender as Gender] ?? student.gender,
                    student.birthDate ? `Nació el ${formatDate(student.birthDate)} (${yearsOld(student.birthDate)} años)` : null,
                ].filter(Boolean).join(" · ")}
                badges={<StudentStatusPill status={student.status}/>}
                actions={hasAuthority(AuthorityKey.INVOICES_VIEW) ? (
                    <PermittedLink authority={AuthorityKey.INVOICES_VIEW} to={`/accounts/${student.id}`} className="btn btn-sm whitespace-nowrap">
                        <i className="fa fa-scale-balanced"/>Estado de cuenta
                    </PermittedLink>
                ) : undefined}
            />

            <nav className="section-tabs w-fit">
                {tabs.filter((item) => item.visible).map((item) => (
                    <button key={item.key} type="button" onClick={() => setTab(item.key)}
                            className={clsx("section-tab", tab === item.key && "section-tab-active")}>
                        <i className={`fa ${item.icon}`}/><span>{item.label}</span>
                    </button>
                ))}
            </nav>

            {tab === "guardians" && (
                <DetailSection title="Representantes" description="Todas las personas que representan al estudiante y pueden pagar por él.">
                    {guardiansQuery.isPending ? <LoadingContent loading className="py-8"><span/></LoadingContent>
                        : guardians.length === 0 ? (
                            <p className="text-sm" style={{color: "var(--text-tertiary)"}}>Sin representantes registrados.</p>
                        ) : (
                            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                                {guardians.map(({guardian, relationship}) => (
                                    <article key={guardian.id} className="rounded-2xl border p-4" style={{borderColor: "var(--border-soft)", background: "var(--surface-muted)"}}>
                                        <div className="flex items-start justify-between gap-2">
                                            <p className="font-bold" style={{color: "var(--text-primary)"}}>{guardian.firstname} {guardian.lastname}</p>
                                            <span className="billing-pill billing-pill-info">{RelationshipLabel[relationship] ?? relationship}</span>
                                        </div>
                                        <ul className="mt-2 space-y-1 text-sm" style={{color: "var(--text-secondary)"}}>
                                            <li><i className="fa fa-id-card me-2 w-4 text-center text-xs"/>{guardian.document || "—"}</li>
                                            <li><i className="fa fa-phone me-2 w-4 text-center text-xs"/>{guardian.phone || "—"}</li>
                                            <li className="truncate"><i className="fa fa-envelope me-2 w-4 text-center text-xs"/>{guardian.email || "—"}</li>
                                        </ul>
                                    </article>
                                ))}
                            </div>
                        )}
                </DetailSection>
            )}

            {tab === "enrollments" && (
                <DetailSection title="Inscripciones" description="Cursos en los que ha estado inscrito, del más reciente al más antiguo." flush>
                    {enrollmentsQuery.isPending ? <LoadingContent loading className="py-8"><span/></LoadingContent>
                        : enrollments.length === 0 ? (
                            <p className="p-5 text-sm" style={{color: "var(--text-tertiary)"}}>Sin inscripciones.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="table-shell min-w-[560px]">
                                    <thead><tr><th>Periodo</th><th>Curso</th><th>Fecha</th><th>Estado</th></tr></thead>
                                    <tbody>
                                    {enrollments.map((enrollment) => (
                                        <tr key={enrollment.id}>
                                            <td className="whitespace-nowrap">{enrollment.period?.name ?? "—"}</td>
                                            <td>
                                                <span className="flex items-center gap-2 whitespace-nowrap">
                                                    <PermittedLink authority={AuthorityKey.COURSE_DETAILS_VIEW} to={`/courses/${enrollment.course.id}`}
                                                                   className="font-semibold hover:text-[var(--accent)] hover:underline" style={{color: "var(--text-primary)"}}>
                                                        {enrollment.course.name} {enrollment.course.division}
                                                    </PermittedLink>
                                                    {enrollment.course.type && <GradeTypePill type={enrollment.course.type}/>}
                                                </span>
                                                {enrollment.course.specialization?.name && (
                                                    <span className="block text-xs text-[var(--text-tertiary)]">{enrollment.course.specialization.name}</span>
                                                )}
                                            </td>
                                            <td className="whitespace-nowrap">{formatDate(enrollment.date)}</td>
                                            <td><EnrollmentStatusPill status={enrollment.status}/></td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                </DetailSection>
            )}
        </div>
    );
};
