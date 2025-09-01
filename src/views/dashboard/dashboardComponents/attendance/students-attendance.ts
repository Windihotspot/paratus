import { reactive } from 'vue';

export const useStudentsAttendanceChart = () => {
  const chartOptions = reactive({
    chart: {
      type: 'bar',
      height: 300,
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '50%',
        endingShape: 'rounded',
      },
    },
    dataLabels: {
      enabled: true,
      formatter: (val: number) => `${val}`,
    },
    xaxis: {
      categories: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], // Days of the week
      title: {
        text: 'Days of the Week',
      },
    },
    yaxis: {
      title: {
        text: 'Number of Students',
      },
    },
    colors: ['#1E90FF', '#87CEFA', '#FF69B4', '#FFC0CB'], // Adjust colors for each category
    legend: {
      position: 'bottom',
    },
    tooltip: {
      shared: true,
      intersect: false,
    },
  });

  const chartSeries = reactive([
    {
      name: 'Present (Male)',
      data: [30, 25, 28, 32, 27], // Sample data for male present attendance
    },
    {
      name: 'Absent (Male)',
      data: [5, 8, 7, 6, 10], // Sample data for male absent attendance
    },
    {
      name: 'Present (Female)',
      data: [25, 27, 30, 28, 26], // Sample data for female present attendance
    },
    {
      name: 'Absent (Female)',
      data: [10, 8, 5, 7, 9], // Sample data for female absent attendance
    },
  ]);

  return { chartOptions, chartSeries };
};
