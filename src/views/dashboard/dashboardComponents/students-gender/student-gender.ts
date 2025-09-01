import { reactive } from 'vue';

export const useStudentsGenderChart = () => {
  const chartOptions = reactive({
    chart: {
      type: 'donut',
      height: 180,
    },
    labels: ['Male', 'Female'],
    colors: ['#1E90FF', '#FF69B4'], // Adjust colors as needed
    legend: {
      position: 'bottom',
    },
    dataLabels: {
      enabled: true,
      formatter: (val: number) => `${val.toFixed(1)}%`,
    },
    tooltip: {
      y: {
        formatter: (val: number) => `${val} students`,
      },
    },
  });

  const chartSeries = reactive<number[]>([120, 80]); // Sample data: Adjust with actual values

  return { chartOptions, chartSeries };
};
