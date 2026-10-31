import {PermittedLink} from "../../../components/auth/PermittedLink.tsx";
import {useQuery} from "@tanstack/react-query";
import {Bar, Doughnut} from "react-chartjs-2";
import {ArcElement, BarElement, CategoryScale, Chart as ChartJS, Legend, LinearScale, Tooltip} from "chart.js";
import {PageHeader} from "../../../components/ui/layout/PageHeader.tsx";
import {MetricCard} from "../../../components/ui/metrics/MetricCard.tsx";
import {SurfaceCard} from "../../../components/ui/surfaces/SurfaceCard.tsx";
import {LoadingContent} from "../../../components/io/output/LoadingContent.tsx";
import {queryKeys} from "../../../app/query/queryKeys.ts";
import {AccountService} from "../../../services/billing/BillingService.ts";
import {formatDate, money, PaymentMethodLabel, receiptLink} from "../../../domain/billing/Invoice.ts";
import {useAuthContext} from "../../../contexts/AuthContext.tsx";
import {AuthorityKey} from "../../../domain/model/user/authorities.ts";

ChartJS.register(ArcElement, Legend, Tooltip, CategoryScale, LinearScale, BarElement);

const AXIS = {color: "#575d7c", font: {size: 12, family: "Plus Jakarta Sans", weight: 600 as const}};
const METHOD_COLORS = ["#059669", "#0284c7", "#7c3aed", "#d97706", "#64748b"];
const compact = new Intl.NumberFormat("es-DO", {notation: "compact", maximumFractionDigits: 1});
const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;
const monthName = (value: string) =>
    new Date(`${value}-01T00:00:00`).toLocaleDateString("es-DO", {month: "short"}).replace(".", "");

/** Panel general: cobros, deudas y movimientos recientes de la organización. */
export const Dashboard = () => {
    const {hasAuthority} = useAuthContext();
    const canSeeFinance = hasAuthority(AuthorityKey.PAYMENTS_VIEW);
    const summaryQuery = useQuery({
        queryKey: queryKeys.accounts.summary,
        queryFn: ({signal}) => AccountService.instance.withSignal(signal).summary(),
        enabled: canSeeFinance,
        meta: {errorMessage: "No se pudo cargar el resumen financiero."},
    });
    const summary = summaryQuery.data;

    if (!canSeeFinance) {
        return (
            <div className="space-y-6">
                <PageHeader title="Panel general" description="Bienvenido. Usa el menú para ir a tus módulos."/>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <PageHeader title="Panel general" description="Cómo van los cobros del colegio y quién tiene pagos pendientes."/>

            <LoadingContent loading={summaryQuery.isPending} className="min-h-[320px]">
                {summary && (
                    <>
                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                            <MetricCard title="Cobrado este mes" value={money.format(summary.collectedThisMonth)}
                                        delta={`Hoy: ${money.format(summary.collectedToday)}`} icon="fa-wallet" tone="success"/>
                            <MetricCard title="Por cobrar" value={money.format(summary.outstanding)}
                                        delta={plural(summary.openInvoices, "factura con saldo", "facturas con saldo")} icon="fa-file-invoice-dollar" tone="brand"/>
                            <MetricCard title="Vencido" value={money.format(summary.overdue)}
                                        delta={plural(summary.overdueInvoices, "factura vencida", "facturas vencidas")} icon="fa-triangle-exclamation" tone="danger"/>
                            <MetricCard title="Cobrado en el periodo" value={money.format(summary.collectedThisPeriod)}
                                        delta={`de ${money.format(summary.billedThisPeriod)} facturado`} icon="fa-chart-column" tone="warning"/>
                        </div>

                        {summary.pendingEnrollments > 0 && (
                            <PermittedLink authority={AuthorityKey.ENROLLMENTS_VIEW} to="/enrollments/list" className="flex items-center gap-3 rounded-[18px] border px-4 py-3 text-sm"
                                  style={{borderColor: "var(--border-soft)", background: "var(--warning-soft)", color: "var(--warning)"}}>
                                <i className="fa fa-user-clock"/>
                                <span><strong>{summary.pendingEnrollments}</strong> {summary.pendingEnrollments === 1 ? "inscripción espera" : "inscripciones esperan"} el pago para confirmarse.</span>
                                <i className="fa fa-chevron-right ms-auto text-xs"/>
                            </PermittedLink>
                        )}

                        <div className="grid gap-4 xl:grid-cols-[1.35fr_0.95fr]">
                            <SurfaceCard title="Facturado y cobrado" description="Últimos seis meses.">
                                <div className="h-[280px]">
                                    <Bar
                                        data={{
                                            labels: summary.months.map((item) => monthName(item.month)),
                                            datasets: [
                                                {label: "Facturado", data: summary.months.map((item) => Number(item.billed)), backgroundColor: "#cbd5e1", borderRadius: 8, maxBarThickness: 26},
                                                {label: "Cobrado", data: summary.months.map((item) => Number(item.collected)), backgroundColor: "#059669", borderRadius: 8, maxBarThickness: 26},
                                            ],
                                        }}
                                        options={{
                                            maintainAspectRatio: false,
                                            plugins: {legend: {position: "bottom", labels: {boxWidth: 10, ...AXIS}}},
                                            scales: {
                                                y: {beginAtZero: true, ticks: {...AXIS, callback: (value) => compact.format(Number(value))}, grid: {color: "rgba(16, 32, 61, 0.08)"}},
                                                x: {ticks: AXIS, grid: {display: false}},
                                            },
                                        }}
                                    />
                                </div>
                            </SurfaceCard>

                            <SurfaceCard title="Formas de pago" description="Cobros del periodo escolar.">
                                {summary.methods.length === 0 ? (
                                    <p className="flex h-[280px] items-center justify-center text-sm" style={{color: "var(--text-tertiary)"}}>Aún no hay cobros en el periodo.</p>
                                ) : (
                                    <div className="flex h-[280px] items-center justify-center">
                                        <div className="h-full w-full max-w-[280px]">
                                            <Doughnut
                                                data={{
                                                    labels: summary.methods.map((item) => PaymentMethodLabel[item.method]),
                                                    datasets: [{data: summary.methods.map((item) => Number(item.amount)), backgroundColor: METHOD_COLORS, borderColor: "#ffffff", borderWidth: 4}],
                                                }}
                                                options={{maintainAspectRatio: false, cutout: "68%", plugins: {legend: {position: "bottom", labels: {boxWidth: 10, ...AXIS}}}}}
                                            />
                                        </div>
                                    </div>
                                )}
                            </SurfaceCard>
                        </div>

                        <div className="grid gap-4 xl:grid-cols-2">
                            <SurfaceCard title="Mayores saldos pendientes" description="Estudiantes que más deben.">
                                {summary.topDebtors.length === 0 ? (
                                    <p className="text-sm" style={{color: "var(--text-tertiary)"}}>Nadie tiene saldo pendiente.</p>
                                ) : (
                                    <ul className="divide-y" style={{borderColor: "var(--border-soft)"}}>
                                        {summary.topDebtors.map((account) => (
                                            <li key={account.studentId}>
                                                <PermittedLink authority={AuthorityKey.INVOICES_VIEW} to={`/accounts/${account.studentId}`} className="flex items-center justify-between gap-3 py-3 hover:text-[var(--accent)]">
                                                    <span>
                                                        <strong className="block text-sm" style={{color: "var(--text-primary)"}}>{account.firstname} {account.lastname}</strong>
                                                        <span className="text-xs" style={{color: "var(--text-tertiary)"}}>
                                                            {account.oldestDueDate ? `Debe desde ${formatDate(account.oldestDueDate)}` : ""}
                                                        </span>
                                                    </span>
                                                    <span className="text-right">
                                                        <strong className="block text-sm" style={{color: "var(--text-primary)"}}>{money.format(account.due)}</strong>
                                                        {Number(account.overdue) > 0 && <span className="text-xs" style={{color: "var(--danger)"}}>{money.format(account.overdue)} vencido</span>}
                                                    </span>
                                                </PermittedLink>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </SurfaceCard>

                            <SurfaceCard title="Últimos pagos" description="Recibos registrados más recientes.">
                                {summary.latestReceipts.length === 0 ? (
                                    <p className="text-sm" style={{color: "var(--text-tertiary)"}}>Aún no se han registrado pagos.</p>
                                ) : (
                                    <ul className="divide-y" style={{borderColor: "var(--border-soft)"}}>
                                        {summary.latestReceipts.map((receipt) => (
                                            <li key={receipt.id}>
                                                <PermittedLink authority={AuthorityKey.PAYMENTS_VIEW} to={receiptLink(receipt.number)} className="flex items-center justify-between gap-3 py-3 hover:text-[var(--accent)]">
                                                    <span>
                                                        <strong className="block text-sm" style={{color: "var(--text-primary)"}}>{receipt.student.name}</strong>
                                                        <span className="text-xs" style={{color: "var(--text-tertiary)"}}>
                                                            {receipt.number} · {formatDate(receipt.date)} · {PaymentMethodLabel[receipt.method]}
                                                        </span>
                                                    </span>
                                                    <strong className="text-sm" style={{color: "var(--success)"}}>{money.format(receipt.amount)}</strong>
                                                </PermittedLink>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </SurfaceCard>
                        </div>
                    </>
                )}
            </LoadingContent>
        </div>
    );
};
