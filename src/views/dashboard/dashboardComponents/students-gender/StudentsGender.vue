<template>
    <div>
      <v-card>
        <v-card-text>
          <h5 class="title font-weight-medium mb-2 text-h6">Students Gender</h5>
          <div>
            <apexchart
              type="pie"
              height="180px"
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
  import { useStudentsGenderChart } from './student-gender';
  
  export default defineComponent({
    setup() {
      const { chartOptions, chartSeries } = useStudentsGenderChart();
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
  