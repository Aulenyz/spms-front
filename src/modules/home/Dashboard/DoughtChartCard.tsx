import {ArcElement, Chart as ChartJS, Legend} from "chart.js";

type DoughtChartCard = {
    daily: boolean;
}

ChartJS.register(ArcElement, Legend);

export const DoughtChartCard = () => {
    return (
        <div>

        </div>
    );
};
