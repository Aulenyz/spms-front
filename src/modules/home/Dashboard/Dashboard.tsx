import {Bar, Doughnut} from "react-chartjs-2";
import {ArcElement, BarElement, CategoryScale, Chart as ChartJS, Legend, LinearScale, Tooltip} from "chart.js";
import {PageHeader} from "../../../components/ui/layout/PageHeader.tsx";
import {MetricCard} from "../../../components/ui/metrics/MetricCard.tsx";
import {SurfaceCard} from "../../../components/ui/surfaces/SurfaceCard.tsx";

ChartJS.register(ArcElement, Legend, Tooltip, CategoryScale, LinearScale, BarElement);

const dashboardStats = {
    activeStudents: 790,
    overdueAccounts: 42,
    paymentsToday: 14,
    monthlyIncome: 152340,
};

const incomeData = {
    labels: ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago"],
    datasets: [
        {
            label: "Ingresos",
            data: [14, 18, 17, 22, 25, 27, 29, 31],
            backgroundColor: "#0f62fe",
            borderRadius: 10,
            maxBarThickness: 28,
        },
    ],
};

const statusData = {
    labels: ["Activos", "Pendientes", "Inactivos"],
    datasets: [
        {
            data: [790, 42, 18],
            backgroundColor: ["#12805c", "#c47b07", "#d14f5c"],
            borderColor: "#ffffff",
            borderWidth: 4,
        },
    ],
};

export const Dashboard = () => {
    return (
        <div className="space-y-6">
            <PageHeader
                eyebrow="Operacion diaria"
                title="Panel general"
                description="Resumen corto del estado academico y financiero del dia."
            />

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard title="Estudiantes activos" value={dashboardStats.activeStudents.toString()} delta="Actualizado hoy" icon="fa-user-graduate" tone="success"/>
                <MetricCard title="Cuentas vencidas" value={dashboardStats.overdueAccounts.toString()} delta="Requieren seguimiento" icon="fa-triangle-exclamation" tone="warning"/>
                <MetricCard title="Pagos registrados" value={dashboardStats.paymentsToday.toString()} delta="Movimientos del dia" icon="fa-wallet" tone="brand"/>
                <MetricCard title="Ingreso mensual" value={`$${dashboardStats.monthlyIncome.toLocaleString()}`} delta="Corte del periodo" icon="fa-chart-column" tone="danger"/>
            </div>

            <div className="grid gap-4 xl:grid-cols-[1.35fr_0.95fr]">
                <SurfaceCard title="Ingresos por mes" description="Comportamiento reciente de cobros registrados.">
                    <div className="h-[280px]">
                        <Bar
                            data={incomeData}
                            options={{
                                maintainAspectRatio: false,
                                plugins: {legend: {display: false}},
                                scales: {
                                    y: {
                                        beginAtZero: true,
                                        ticks: {color: "#7b8799", font: {size: 11}},
                                        grid: {color: "rgba(16, 32, 61, 0.08)"},
                                    },
                                    x: {
                                        ticks: {color: "#7b8799", font: {size: 11}},
                                        grid: {display: false},
                                    },
                                },
                            }}
                        />
                    </div>
                </SurfaceCard>

                <SurfaceCard title="Estado estudiantil" description="Distribucion actual de la cartera academica.">
                    <div className="flex h-[280px] items-center justify-center">
                        <div className="w-full max-w-[260px]">
                            <Doughnut
                                data={statusData}
                                options={{
                                    maintainAspectRatio: false,
                                    cutout: "68%",
                                    plugins: {
                                        legend: {
                                            position: "bottom",
                                            labels: {boxWidth: 10, color: "#7b8799", font: {size: 11}},
                                        },
                                    },
                                }}
                            />
                        </div>
                    </div>
                </SurfaceCard>
            </div>

            <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
                <SurfaceCard title="Pendientes de hoy" description="Tareas operativas que conviene revisar antes del cierre.">
                    <div className="grid gap-3">
                        {[
                            "Validar dos pagos manuales pendientes.",
                            "Revisar cuarenta y dos cuentas con atraso.",
                            "Confirmar nuevas inscripciones del periodo actual.",
                        ].map((item) => (
                            <div
                                key={item}
                                className="flex items-center gap-3 rounded-[18px] border px-4 py-3"
                                style={{borderColor: "var(--border-soft)", background: "var(--surface-muted)"}}
                            >
                                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full" style={{background: "var(--accent-soft)", color: "var(--accent)"}}>
                                    <i className="fa fa-check"/>
                                </span>
                                <p className="text-sm" style={{color: "var(--text-secondary)"}}>{item}</p>
                            </div>
                        ))}
                    </div>
                </SurfaceCard>

                <SurfaceCard title="Cierre rapido" description="Resumen corto para supervisar el turno.">
                    <div className="space-y-3">
                        <div className="rounded-[18px] border px-4 py-3" style={{borderColor: "var(--border-soft)", background: "var(--surface-muted)"}}>
                            <p className="text-xs uppercase tracking-[0.08em]" style={{color: "var(--text-tertiary)"}}>Cobros conciliados</p>
                            <strong className="mt-1 block text-xl" style={{color: "var(--text-primary)"}}>$94,500</strong>
                        </div>
                        <div className="rounded-[18px] border px-4 py-3" style={{borderColor: "var(--border-soft)", background: "var(--surface-muted)"}}>
                            <p className="text-xs uppercase tracking-[0.08em]" style={{color: "var(--text-tertiary)"}}>Alertas</p>
                            <strong className="mt-1 block text-xl" style={{color: "var(--text-primary)"}}>3 abiertas</strong>
                        </div>
                    </div>
                </SurfaceCard>
            </div>
        </div>
    );
};
