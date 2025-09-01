export const BitcoinOverviewData = {
  series: [
    {
      name: 'Bitcoin',
      data: [45000, 50000, 55000, 65000, 48000]
    }
  ],
  chartOptions: {
    grid: {
      show: true,
      borderColor: '#e0e0e0',
      padding: { left: 10, right: 10, bottom: 10 },
      xaxis: {
        lines: {
          show: false
        }
      },
      yaxis: {
        lines: {
          show: false
        }
      }
    },
    plotOptions: {
      area: {
        curve: 'smooth',
        fillTo: 'origin'
      }
    },
    colors: ['#cac4fc'],
    fill: { type: 'solid', opacity: 1 },
    chart: {
      type: 'area',
      height: 270,
      offsetX: -15,
      toolbar: { show: false },
      foreColor: '#333',
      fontFamily: 'DM sans',
      sparkline: { enabled: false }
    },
    dataLabels: { enabled: false },
    markers: { size: 4, colors: ['#635bff'], strokeColors: '#fff', strokeWidth: 2 },
    legend: { show: true, position: 'top', horizontalAlign: 'left' },
    xaxis: {
      type: 'category',
      labels: { show: false },
      axisBorder: { show: false },
      axisTicks: { show: false }
    },
    yaxis: {
      show: false,
      min: 40000,
      max: 80000
    },
    stroke: {
      show: true,
      width: 2,
      curve: 'smooth',
      colors: ['#635bff']
    },
    tooltip: { theme: 'dark' }
  }
}
