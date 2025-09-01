export const currentBalanceOverviewData = {
  series: [15000, 10000, 13000],
  chartOptions: {
    chart: {
      type: 'donut',
      height: 350
    },
    labels: ['Bitcoin', 'Etherium', 'BNB'],
    legend: {
      position: 'bottom'
    },
    plotOptions: {
      pie: {
        donut: {
          size: '70%' // Adjust the size as needed
        }
      }
    },
    // title: {
    //   text: 'Current Balance Across All Accounts',
    //   align: 'center'
    // },
    dataLabels: {
      enabled: false
      // formatter: (val: number, opts: any) => {
      //   const total = opts.w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0)
      //   const percent = ((opts.w.globals.series[opts.seriesIndex] / total) * 100).toFixed(1)
      //   return `${percent}%`
      // }
    },
    tooltip: {
      y: {
        formatter: (val: number) =>
          `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      }
    }
  },
  totalBalance: 38000
}
