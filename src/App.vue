<script setup>
import { RouterView } from 'vue-router'
import Header from './components/Header.vue'
import Menu from './components/Menu.vue'
</script>


<template>
    <Header />
    <div class="container-fluid">
        <div class="row">
            <nav class="col-auto col-md-3 col-xl-2 px-sm-2 px-0 bg-dark">
                <Menu />
            </nav>
            <main class="col py-4 px-4">
                <RouterView />
            </main>
        </div>
    </div>
</template>





<style scoped></style>