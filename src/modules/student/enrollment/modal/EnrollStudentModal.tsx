import {useState} from "react";
import {keepPreviousData, useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {Link} from "react-router-dom";
import {toast} from "react-toastify";
import {CenterModal} from "../../../../components/shared/CenterModal.tsx";
import {SearchSelect} from "../../../../components/io/input/SearchSelect.tsx";
import {CourseSelect} from "../../../payment/components/CourseSelect.tsx";
import {StudentService} from "../../../../services/student/StudentService.ts";
import {EnrollmentService} from "../../../../services/student/enrollment/EnrollmentService.ts";
import {queryKeys} from "../../../../app/query/queryKeys.ts";
import {Course} from "../../../../domain/model/course/Course.ts";
import {Student} from "../../../../domain/student/Student.ts";
import {Pagination} from "../../../../domain/filters/Page.ts";
import {EnrollmentResult, money} from "../../../../domain/billing/Invoice.ts";
import {EnrollmentStatus, EnrollmentStatusLabel} from "../../../../domain/student/Enrollment.ts";

const studentService = StudentService.instance;
const enrollmentService = EnrollmentService.instance;

const studentLabel = (student: Student) => `${student.firstname} ${student.lastname} · ${student.document}`;

type Props = {
    isOpen: boolean;
    onClose: () => void;
};

/**
 * Inscribe a un estudiante en un curso del periodo actual. Antes de confirmar muestra el concepto
 * que se cobrará (inscripción o reinscripción), el total y lo que falta configurar, si algo.
 */
export const EnrollStudentModal = ({isOpen, onClose}: Props) => {
    const queryClient = useQueryClient();
    const [term, setTerm] = useState("");
    const [student, setStudent] = useState<Student | null>(null);
    const [course, setCourse] = useState<Course | null>(null);
    const [result, setResult] = useState<EnrollmentResult | null>(null);

    const studentsQuery = useQuery({
        queryKey: ["students", "enroll-search", term],
        queryFn: ({signal}) => studentService.withSignal(signal).search(term, {...Pagination.first, size: 8}),
        enabled: isOpen,
        placeholderData: keepPreviousData,
        meta: {silent: true},
    });
    const students = studentsQuery.data?.content ?? [];

    const previewQuery = useQuery({
        queryKey: queryKeys.enrollments.preview(student?.id, course?.id),
        queryFn: ({signal}) => enrollmentService.withSignal(signal).preview(student!.id, course!.id),
        enabled: isOpen && Boolean(student && course),
        meta: {errorMessage: "No se pudo calcular el cobro de la inscripción."},
    });
    const preview = previewQuery.data;

    const enroll = useMutation({
        mutationFn: () => enrollmentService.enroll(student!.id, course!.id),
        onSuccess: (saved) => {
            setResult(saved);
            void queryClient.invalidateQueries({queryKey: queryKeys.enrollments.all});
            toast.success(`Inscripción registrada. Factura ${saved.invoice.number}.`);
        },
        onError: (error) => toast.error((error as {message?: string})?.message ?? "No se pudo inscribir al estudiante."),
    });

    const close = () => {
        setTerm("");
        setStudent(null);
        setCourse(null);
        setResult(null);
        onClose();
    };

    const canConfirm = Boolean(preview && preview.problems.length === 0) && !enroll.isPending;

    return (
        <CenterModal
            title="Inscribir estudiante"
            description="Elige el estudiante y el curso del periodo actual. La inscripción genera su factura."
            isOpen={isOpen}
            onClose={close}
            className="max-w-2xl"
        >
            {result ? (
                <div className="space-y-5 text-center">
                    <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full text-xl"
                          style={{background: "var(--success-soft)", color: "var(--success)"}}>
                        <i className="fa fa-check"/>
                    </span>
                    <div>
                        <h3 className="text-lg font-bold" style={{color: "var(--text-primary)"}}>
                            {result.enrollment.student.firstname} {result.enrollment.student.lastname} quedó{" "}
                            {EnrollmentStatusLabel[result.enrollment.status].toLowerCase()}
                        </h3>
                        <p className="mt-1 text-sm" style={{color: "var(--text-secondary)"}}>
                            Se generó la factura <strong>{result.invoice.number}</strong> por {money.format(result.invoice.total)}.
                            {result.enrollment.status === EnrollmentStatus.PENDING && " Quedará inscrito al registrar el pago."}
                        </p>
                    </div>
                    <div className="flex justify-center gap-2">
                        <button type="button" className="btn btn-sm" onClick={() => {
                            setResult(null);
                            setStudent(null);
                            setCourse(null);
                        }}>
                            Inscribir otro
                        </button>
                        <Link to={`/enrollments/${result.enrollment.id}`} className="btn btn-sm btn-primary" onClick={close}>
                            Ver inscripción
                        </Link>
                    </div>
                </div>
            ) : (
                <div className="space-y-5">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <label className="block">
                            <span className="form-label mb-1 block text-sm font-semibold">Estudiante</span>
                            <SearchSelect
                                text="Busca por nombre o documento"
                                hasError={false}
                                value={student?.id}
                                options={students.map((item) => ({value: item.id, description: studentLabel(item)}))}
                                onSearch={setTerm}
                                onSelect={(id) => setStudent(students.find((item) => item.id === Number(id)) ?? null)}
                                portal
                            />
                        </label>
                        <CourseSelect value={course} onChange={setCourse}/>
                    </div>

                    {!student || !course ? (
                        <p className="rounded-2xl border border-dashed p-5 text-center text-sm"
                           style={{borderColor: "var(--border-soft)", color: "var(--text-tertiary)"}}>
                            Al elegir estudiante y curso verás aquí lo que se le cobrará.
                        </p>
                    ) : previewQuery.isFetching && !preview ? (
                        <p className="p-5 text-center text-sm" style={{color: "var(--text-secondary)"}}>
                            <i className="fa fa-spinner fa-spin me-2"/>Calculando cobro...
                        </p>
                    ) : preview && (
                        <section className="overflow-hidden rounded-2xl border" style={{borderColor: "var(--border-soft)"}}>
                            <div className="flex items-center justify-between gap-4 p-5">
                                <div>
                                    <span className="text-xs font-bold uppercase tracking-[0.1em]" style={{color: "var(--text-tertiary)"}}>
                                        Se cobrará
                                    </span>
                                    <strong className="block text-base" style={{color: "var(--text-primary)"}}>{preview.conceptName}</strong>
                                    <span className="text-sm" style={{color: "var(--text-secondary)"}}>
                                        {preview.conceptKey === "RE_ENROLLMENT" ? "Estudiante que ya estuvo inscrito antes" : "Primer año en el colegio"}
                                        {preview.billedTo && ` · Factura a ${preview.billedTo}`}
                                    </span>
                                </div>
                                <div className="text-right">
                                    <strong className="block text-xl" style={{color: "var(--text-primary)"}}>{money.format(preview.total)}</strong>
                                    {preview.taxAmount > 0 && (
                                        <span className="text-xs" style={{color: "var(--text-tertiary)"}}>
                                            Incluye {money.format(preview.taxAmount)} de impuestos
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="border-t px-5 py-3 text-sm" style={{borderColor: "var(--border-soft)", background: "var(--surface-muted)", color: "var(--text-secondary)"}}>
                                <i className="fa fa-circle-info me-2"/>
                                {preview.resultingStatus === EnrollmentStatus.PENDING
                                    ? "Quedará pendiente hasta que se pague la factura."
                                    : "Quedará inscrito de inmediato; la factura quedará por cobrar."}
                            </div>
                            {preview.problems.length > 0 && (
                                <ul className="space-y-1 border-t px-5 py-3 text-sm"
                                    style={{borderColor: "var(--border-soft)", color: "var(--danger)"}}>
                                    {preview.problems.map((problem) => (
                                        <li key={problem}><i className="fa fa-triangle-exclamation me-2"/>{problem}</li>
                                    ))}
                                </ul>
                            )}
                        </section>
                    )}

                    <div className="flex justify-end gap-2">
                        <button type="button" className="btn btn-sm" onClick={close}>Cancelar</button>
                        <button type="button" className="btn btn-sm btn-primary" disabled={!canConfirm}
                                onClick={() => enroll.mutate()}>
                            {enroll.isPending ? <i className="fa fa-spinner fa-spin"/> : <i className="fa fa-user-plus"/>}
                            Inscribir y facturar
                        </button>
                    </div>
                </div>
            )}
        </CenterModal>
    );
};
