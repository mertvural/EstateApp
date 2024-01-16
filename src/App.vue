<script setup>
import { RouterView } from 'vue-router'
import Header from './components/Header.vue'
import Menu from './components/Menu.vue'
</script>


<template>
    <Header />
    <div class="container-fluid">
        <div class="row">
            <nav class="col-12 col-md-3 col-lg-2 col-xl-2 bg-dark py-2">
                <Menu />
            </nav>
            <main class="col-12 col-md-9 col-lg-10 col-xl-10 px-4 py-4">
                <RouterView />
            </main>
        </div>
    </div>
</template>





<style scoped></style>