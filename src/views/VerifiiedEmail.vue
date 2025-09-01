<script setup>
import { onMounted } from "vue";
import confetti from "canvas-confetti";

const launchConfetti = () => {
    let duration = 3 * 1000;
    let end = Date.now() + duration;

    (function frame() {
        confetti({
            particleCount: 5,
            spread: 100,
            origin: { y: 0.6 },
        });

        if (Date.now() < end) {
            requestAnimationFrame(frame);
        }
    })();
};

onMounted(() => {
    launchConfetti();
});
</script>

<template>
    <div class="flex items-center justify-center min-h-screen bg-gray-100">
        <div class="bg-white shadow-lg rounded-lg p-12 max-w-lg text-center ">
            <i class="fas fa-check-circle text-green-500 text-6xl mb-4"></i>
            <h1 class="text-2xl font-bold text-gray-800">Congratulations!</h1>
            <p class="text-gray-600 mt-2">
                Your email has been successfully verified.
            </p>
            <div class="mt-8">
              <RouterLink to="/dashboard">
                <v-btn
                    no-uppercase
                    size="large"
                    class="normal-case w-full p-4 bg-blue-600 hover:bg-blue-700 text-white text-none mr-2 custom-btn"
                >
                    Go to Dashboard
                </v-btn>
              </RouterLink>
               
            </div>
        </div>
    </div>
</template>

<style scoped>
.custom-btn {
    background-color: #0056d2;
}
</style>
