<script setup>
import { ref, onMounted } from "vue"
import { airtableBase } from "../api/airtable"
import Form from "@/components/Form.vue";
const tableDatas = ref([])
const rowId = ref();
const loadedTable = () => {
    airtableBase('RealEstateTbl').select({
        view: "Grid"
    }).eachPage(function page(records) {
        records.forEach(function (record) {
            tableDatas.value.push(record)
        });
    }, function done(err) {
        if (err) { console.error(err); return; }
    });
}
const edit = (id) => {
    rowId.value = id
}


onMounted(() => {
    loadedTable();
});
</script>
<template>
    <h3>Randevular</h3>
    <hr>
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
            <tr v-for="datas in tableDatas">
                <td>
                    {{ datas.fields.appointment_postcode }}
                </td>
                <td>
                    {{ datas.fields.appointment_date }}
                </td>
                <td>
                    {{ datas.fields.contact_name }}
                </td>
                <td>
                    {{ datas.fields.contact_email }}
                </td>
                <td>
                    {{ datas.fields.contact_phone }}
                </td>
                <td>
                    {{ datas.fields.agent_name }}
                </td>
                <td>
                    <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#editModal"
                        @click="edit(datas.id)">Düzenle</button>
                </td>
            </tr>
        </tbody>
    </table>

    <!-- Modal -->
    <div class="modal fade" id="editModal">
        <div class="modal-dialog modal-xl">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Modal title</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <Form :rowId="rowId" />
                </div>
            </div>
        </div>
    </div>
</template>


<style scoped></style>