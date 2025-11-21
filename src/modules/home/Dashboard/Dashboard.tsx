import { useState } from "react";
import { Doughnut, Bar } from "react-chartjs-2";
import { ArcElement, Chart as ChartJS, Legend, Tooltip, CategoryScale, LinearScale, BarElement } from "chart.js";

ChartJS.register(ArcElement, Legend, Tooltip, CategoryScale, LinearScale, BarElement);

export const Dashboard = () => {
    const [stats] = useState({
        students: { total: 850, active: 790, inactive: 60, debtors: 42 },
        paymentsToday: 14,
        monthlyIncome: 152340,
        pendingPayments: 27,
    });

    return (
        <div className="@container pt-6 pl-9 pr-5">
            <h1 className="mx-2 text-2xl/7 font-bold">Dashboard</h1>
            <br />

            {/* ========================  TOP STATS (ESSENTIAL ONLY)  ======================== */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-5">
                <StatCard title="Estudiantes Activos" value={stats.students.active} color="#4ade80" />
                <StatCard title="Deudores" value={stats.students.debtors} color="#fb7185" />
                <StatCard title="Pagos Hoy" value={stats.paymentsToday} color="#818cf8" />
                <StatCard title="Ingreso del Mes" value={`$${stats.monthlyIncome.toLocaleString()}`} color="#fbbf24" />
            </div>

            {/* ========================  CHART GRID (ONLY SALES + STUDENTS)  ======================== */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-5">
                <StudentStatusChart active={stats.students.active} inactive={stats.students.inactive} debtors={stats.students.debtors} />
                <MonthlyIncomeChart />
            </div>

            {/* ========================  BOTTOM (PENDING SALES ONLY)  ======================== */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                <StatCard title="Pagos Pendientes" value={stats.pendingPayments} color="#f87171" />
                <SalesSummaryCard />
            </div>
        </div>
    );
};

/* ======================================================================= */
/*                               STAT CARD                                 */
/* ======================================================================= */
const StatCard = ({ title, value, color }: { title: string; value: any; color: string }) => {
    return (
        <div className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition duration-150 flex justify-between items-center">
            <div>
                <p className="text-gray-500 text-sm">{title}</p>
                <h2 className="text-xl font-bold text-gray-800">{value}</h2>
            </div>
            <div style={{ backgroundColor: color + "33" }} className="w-10 h-10 rounded-lg flex items-center justify-center shadow-inner">
                <div style={{ backgroundColor: color }} className="w-3 h-3 rounded-full" />
            </div>
        </div>
    );
};

/* ======================================================================= */
/*              DOUGHNUT – STUDENT STATUS + DEBTORS (SMALL, CLEAN)         */
/* ======================================================================= */
const StudentStatusChart = ({ active, inactive, debtors }: { active: number; inactive: number; debtors: number }) => {
    const data = {
        labels: ["Activos", "Inactivos", "Deudores"],
        datasets: [
            {
                data: [active, inactive, debtors],
                backgroundColor: ["#4ade80", "#f87171", "#fbbf24"],
                borderColor: "#ffffff",
                borderWidth: 3,
                hoverOffset: 10,
                spacing: 4,
            },
        ],
    };

    const options = {
        plugins: {
            legend: {
                position: "bottom" as const,  // "bottom" is a valid position
                labels: { font: { size: 12 } }
            }
        },
        cutout: "70%",
        maintainAspectRatio: false,
    };

    return (
        <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm h-[260px] flex flex-col">
            <h3 className="font-semibold text-gray-700 mb-3 text-sm">Estados de Estudiantes</h3>
            <div className="w-[70%] mx-auto mt-auto mb-auto">
                <Doughnut data={data} options={options} />
            </div>
        </div>
    );
};

/* ======================================================================= */
/*          BAR – MONTHLY INCOME (FULL FOCUS ON SALES METRIC)              */
/* ======================================================================= */
const MonthlyIncomeChart = () => {
    const data = {
        labels: ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"],
        datasets: [
            {
                label: "Ingresos",
                data: [5, 9, 7, 12, 15, 20, 18, 22, 25, 30, 28, 35],
                backgroundColor: "#6366f1",
                borderRadius: 8,
            },
        ],
    };

    const options = {
        plugins: { legend: { display: false } },
        scales: {
            y: { beginAtZero: true, ticks: { color: "#6b7280", font: { size: 11 } } },
            x: { ticks: { color: "#6b7280", font: { size: 11 } } },
        },
        maintainAspectRatio: false,
    };

    return (
        <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm h-[260px]">
            <h3 className="font-semibold text-gray-700 mb-3 text-sm">Ingresos Mensuales</h3>
            <Bar data={data} options={options} />
        </div>
    );
};

/* ======================================================================= */
/*                    SALES SUMMARY – SMALL SIMPLE CARD                    */
/* ======================================================================= */
const SalesSummaryCard = () => {
    return (
        <div className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm h-[130px] flex flex-col justify-center">
            <h3 className="font-semibold text-gray-700 text-sm mb-1">Resumen de Ventas</h3>
            <p className="text-gray-600 text-sm">Ventas consistentes durante la semana.</p>
            <p className="font-bold text-gray-800 text-lg mt-1">$3,420</p>
        </div>
    );
};
