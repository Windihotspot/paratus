<template>
    <div>
      <v-card>
        <v-card-text>
          <h5 class="title font-weight-medium mb-2 text-h6">Students Attendance</h5>
          <div>
            <apexchart
              type="bar"
              height="300px"
              :options="chartOptions"
              :series="chartSeries"
            ></apexchart>
          </div>
        </v-card-text>
      </v-card>
    </div>
  </template>
  
  <script lang="ts">
  import { defineComponent } from 'vue';
  import { useStudentsAttendanceChart } from './students-attendance';
  
  export default defineComponent({
    setup() {
      const { chartOptions, chartSeries } = useStudentsAttendanceChart();
      return {
        chartOptions,
        chartSeries,
      };
    },
  });
  </script>
  
  <style scoped>
  /* Optional: Customize the styling */
  </style>
  