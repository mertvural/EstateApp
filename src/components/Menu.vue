<script setup>

</script>
<template>
    <div class="d-flex flex-column align-items-center align-items-sm-start px-3 pt-2 text-white min-vh-100">

        <h2 class="mb-4 d-none d-md-block">Menu</h2>

        <ul class="nav nav-pills flex-row flex-md-column mb-sm-auto mb-0 align-items-center align-items-sm-start" id="menu">
            <li class="nav-item mb-0 mb-md-3 me-3 me-md-0">
                <router-link to="/" class="nav-link px-0 text-white"><i class="bi bi-house"></i> Ana sayfa</router-link>
            </li>
            <li class="nav-item mb-0 mb-md-3 me-3 me-md-0">
                <router-link to="/Appointments" class="nav-link px-0 text-white"><i class="bi bi-table"></i>
                    Randevular</router-link>
            </li>
            <li class="nav-item">
                <router-link to="/CreateAppointment" class="nav-link px-0 text-white"><i class="bi bi-pencil-square"></i>
                    Randevu Oluştur</router-link>
            </li>
        </ul>
        <a href="https://www.linkedin.com/in/mert-vural-b8080563/" class="d-none d-md-block text-warning text-decoration-none d-flex align-items-center" target="_blank">
            <i class="bi bi-linkedin pe-1"></i>
            Mert Vural
        </a>
    </div>
</template>


<style scoped></style>