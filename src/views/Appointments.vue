<script setup>
import { ref, onMounted, computed } from "vue"
import { airtableBase } from "../api/airtable"
import { useLoading } from 'vue-loading-overlay'
import Modal from "@/components/Modal.vue";
const tableDatas = ref([])
const rowId = ref();
const $loading = useLoading();
const searchText = ref("");
const loadedTable = () => {
    const loader = $loading.show();
    airtableBase('RealEstateTbl').select({
        view: "Grid"
    }).eachPage(function page(records, fetchNextPage) {
        tableDatas.value = []
        records.forEach(function (record) {
            tableDatas.value.push(record)
        });
        fetchNextPage();
    }, (err) => {
        loader.hide()
        if (err) {
            console.error(err);
            return;
        }
    });
}
/**
 * @param {string} id - Row id
 */
const edit = (id) => {
    rowId.value = id
}
/**
 * @param {string} val - Takes increasing or decreasing values
 */
const sortDate = (val) => {
    if (val === "increasing") {
        return tableDatas.value.sort((a, b) => new Date(a.fields.appointment_date) - new Date(b.fields.appointment_date));
    }
    else {
        return tableDatas.value.sort((b,a) => new Date(a.fields.appointment_date) - new Date(b.fields.appointment_date));
    }
}
/**
 * @param {string} date - formatted dates
 */
const disabledDate = (date) => {
    return new Date() > new Date(date)
}
onMounted(() => {
    loadedTable();
});
const filteredList = computed(() => {
    return tableDatas.value.filter(item => item.fields.agent_name.toLowerCase().includes(searchText.value.toLowerCase()));
})
</script>
<template>
    <h3><i class="bi bi-table"></i> Randevular</h3>
    <hr>
    <div class="row my-4">
        <div class="col-lg-6 mb-2 mb-lg-0">
            <input type="text" class="form-control" placeholder="Emlakçı çalışan ismine göre filtrele" v-model="searchText" />
        </div>
        <div class="col-lg-6">
            <!-- <v-select v-model="selectedOption" :options="options" @change="handleSelectChange" /> -->
            <select class="form-control" @change="(e) => sortDate(e.target.value)">
                <option value="" disabled selected>Randevu tarihine göre sırala</option>
                <option value="increasing">Yakın tarihten uzak tarihe göre</option>
                <option value="decreasing">Uzak tarihten yakın tarihe göre</option>
            </select>
        </div>
    </div>
   <div class="table-responsive">
    <table class="table table-striped align-middle">
        <thead>
            <tr>
                <th scope="col">Posta Kodu</th>
                <th scope="col">Randevu Tarihi</th>
                <th scope="col">Müşteri Adı</th>
                <th scope="col">Müşteri Mail</th>
                <th scope="col">Müşteri Telefon</th>
                <th scope="col">Emlakçı Çalışanı Adı</th>
            </tr>
        </thead>
        <tbody>
            <tr v-for="item in filteredList" :key="item.id" :class="{disabled: disabledDate(item.fields.appointment_date)}">
                <td>
                    {{ item.fields.appointment_postcode }}
                </td>
                <td>
                    {{ item.fields.appointment_date }}
                </td>
                <td>
                    {{ item.fields.contact_name }}
                </td>
                <td>
                    {{ item.fields.contact_email }}
                </td>
                <td>
                    {{ item.fields.contact_phone }}
                </td>
                <td>
                    {{ item.fields.agent_name }}
                </td>
                <td>
                    <button class="btn btn-sm btn-primary" data-bs-toggle="modal" data-bs-target="#editModal"
                        @click="edit(item.id)" :disabled="disabledDate(item.fields.appointment_date)">Düzenle</button>
                </td>
            </tr>
        </tbody>
    </table>
   </div>
    <Modal :rowId="rowId" :loadedTable="loadedTable" />    
</template>
<style scoped></style>