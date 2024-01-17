<script setup>
import { ref, reactive, onMounted, defineProps, watch } from "vue"
import { useLoading } from 'vue-loading-overlay'
import { airtableBase } from "../api/airtable"
import vSelect from 'vue-select'
import VueDatePicker from '@vuepic/vue-datepicker';
import { GoogleMap, Polyline } from "vue3-google-map";
import { useToast } from 'vue-toast-notification';
import { postCode } from "../api/postCodes"
const { VITE_LAT, VITE_LNG, VITE_MAP_API } = import.meta.env;
const props = defineProps({
    rowId: String,
    loadedTable: Function
});
const estatePostalCode = { lat: parseFloat(VITE_LAT), lng: parseFloat(VITE_LNG) };
const mapZoom = ref(10);
const $loading = useLoading();
const btnDisabled = ref(false);
const isEditForm = ref(false);
const estateEmployeeNameOption = ref([]);
const $toast = useToast();
const distanceObj = reactive({});
const distanceLine = reactive({});
const editRowId = ref();
const AppointmentForm = reactive({
    appointment_postcode: null,
    appointment_date: null,
    contact_name: null,
    contact_email: null,
    contact_phone: null,
    agent_name: null
})
const btnCreate = () => {
    validationControl() === true && createAppointments();
}
const btnEdit = () => {
    validationControl() === true && editAppointments();
}
const validationControl = () => {
    for (const property in AppointmentForm) {
        if (!AppointmentForm[property]) {
            $toast.error('Lütfen tüm alanları doldurunuz!');
            return
        }
    }
    return true
}
const format = (date) => {
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    const hour = date.getHours();
    const minute = date.getMinutes();

    return `${day}.${month}.${year} - ${hour}:${minute}`;
}
const handleDate = (modelData) => {
    const day = modelData.getDate();
    const month = modelData.getMonth() + 1;
    const year = modelData.getFullYear();
    const hour = modelData.getHours();
    const minute = modelData.getMinutes();
    const formattedDate = year + "." + (month < 10 ? '0' : '') + month + "." + (day < 10 ? '0' : '') + day + "-" + (hour < 10 ? '0' : '') + hour + ":" + (minute < 10 ? '0' : '') + minute;
    AppointmentForm.appointment_date = formattedDate;
    const appointmentTime = hour + ":" + minute;
    const totalMinutes = Math.floor(distanceObj.value.duration.value / 60);
    const hours = Math.floor(totalMinutes / 60);
    const remainingMinutes = totalMinutes % 60;
    const durationTime = hours + ":" + remainingMinutes;
    estimatedTime(appointmentTime, durationTime)
}
const estimatedTime = (appointmentTime, durationTime) => {
    let [hour1, minute1] = appointmentTime.split(":").map(Number);
    let [hour2, minute2] = durationTime.split(":").map(Number);
    let totalMinutes1 = hour1 * 60 + minute1;
    let totalMinutes2 = hour2 * 60 + minute2;
    let differenceInMinutes = totalMinutes1 - totalMinutes2;
    let resultHours = Math.floor(differenceInMinutes / 60);
    let resultMinutes = differenceInMinutes % 60;
    resultHours = resultHours < 0 && 24 - Math.abs(resultHours);
    resultMinutes = resultMinutes < 0 && 59 - Math.abs(resultMinutes);
    distanceObj.value.estimated = resultHours + ":" + resultMinutes;
}
const getPostCode = (code) => {
    const loader = $loading.show();
    postCode(code).then(function (response) {
        if (response.status === 200) {
            getDistance(response.data.result);
            setDistanceLine(response.data.result);
        }
    }).catch(() => {
        $toast.error('Lütfen İngiltere de geçerli bir posta kodu giriniz!');
        distanceObj.value = ""
        AppointmentForm.appointment_postcode = null;
    }).finally(() => {
        loader.hide();
    })
}
const getDistance = (response) => {
    const { latitude, longitude } = response;
    const service = new window.google.maps.DistanceMatrixService();
    const matrixOptions = {
        origins: [new window.google.maps.LatLng(estatePostalCode.lat, estatePostalCode.lng)],
        destinations: [new window.google.maps.LatLng(latitude, longitude)],
        travelMode: 'DRIVING',
    };
    service.getDistanceMatrix(matrixOptions, (response, status) => {
        if (status === 'OK') {
            //console.log(response)
            const elements = response.rows[0].elements[0];
            distanceObj.value = elements;
            zoomSetting(parseInt(distanceObj.value.distance.text))

        } else {
            console.error(`Distance Matrix request failed due to ${status}`);
        }
    });
}
const setDistanceLine = (response) => {
    const { latitude, longitude } = response;
    const coordinates = [
        { lat: estatePostalCode.lat, lng: estatePostalCode.lng },
        { lat: latitude, lng: longitude }
    ];
    distanceLine.value = {
        path: coordinates,
        geodesic: true,
        strokeColor: "#FF0000",
        strokeOpacity: 1.0,
        strokeWeight: 2,
    };
}
const zoomSetting = (val) => {
    if (val > 500) {
        mapZoom.value = 5
    }
    else if (val > 200 && val <= 500) {
        mapZoom.value = 6
    }
    else if (val > 100 && val <= 200) {
        mapZoom.value = 7
    }
    else if (val > 80 && val <= 100) {
        mapZoom.value = 8
    }
    else {
        mapZoom.value = 10
    }
}
const createAppointments = () => {
    btnDisabled.value = true;
    const loader = $loading.show();
    airtableBase('RealEstateTbl').create({
        ...AppointmentForm
    }, function (err, record) {
        if (err) {
            console.error(err);
            $toast.error('Randevu oluşturulurken hata meydana geldi');
            btnDisabled.value = false;
            loader.hide()
            return;
        }
        btnDisabled.value = false;
        $toast.success('Randevu başarılı bir şekilde oluşturuldu');
        loader.hide()
    });
    clearForm();
}
const editAppointments = () => {
    btnDisabled.value = true;
    const loader = $loading.show();
    airtableBase('RealEstateTbl').update(editRowId.value, {
        ...AppointmentForm
    }, function (err, record) {
        if (err) {
            console.error(err);
            $toast.error('Randevu düzenlenirken hata meydana geldi');
            loader.hide()
            btnDisabled.value = false;
            return;
        }
        loader.hide()
        $toast.success('Randevu başarılı bir şekilde düzenlendi');
        props.loadedTable();
        btnDisabled.value = false;
        var myModalEl = document.getElementById('editModal');
        myModalEl && myModalEl.querySelector(".btn-close").click();
    });
}
const estateEmployeeNameLoaded = () => {
    airtableBase('AgentNameTbl').select({
        view: "Grid"
    }).eachPage(function page(records) {
        records.forEach(function (record) {
            estateEmployeeNameOption.value.push(record.get('agent_name'))
            const filter = [...new Set(estateEmployeeNameOption.value)];
            estateEmployeeNameOption.value = filter;
        });
    }, function done(err) {
        if (err) { console.error(err); return; }
    });
}
const clearForm = () => {
    for (const property in AppointmentForm) {
        AppointmentForm[property] = null
    }
    distanceLine.value = null
    distanceObj.value = null
}

onMounted(() => {
    estateEmployeeNameLoaded();
});

watch(() => props.rowId, (id) => {
    editRowId.value = id; //get the edit row id
    isEditForm.value = id ? true : false
    airtableBase('RealEstateTbl').find(id, function (err, record) {
        if (err) { console.error(err); return; }
        for (const property in AppointmentForm) {
            AppointmentForm[property] = record.get([property])
        }
        getPostCode(record.get('appointment_postcode'))
    });
});

</script>
<template>
    <div class="form">
        <div class="mb-3 row">
            <label for="appointment_postcode" class="col-sm-2 col-form-label">Randevu adresinin posta kodu</label>
            <div class="col-sm-10">
                <input type="text" class="form-control" id="appointment_postcode"
                    v-model="AppointmentForm.appointment_postcode" @change="(e) => getPostCode(e.target.value)">
            </div>
        </div>
        <div class="mb-3 row" v-if="distanceObj.value">
            <label for="appointment_date" class="col-sm-2 col-form-label">Randevu tarihi</label>
            <div class="col-sm-10">
                <VueDatePicker v-model="AppointmentForm.appointment_date" :format="format" :min-date="new Date()"
                    locale="tr" @update:model-value="handleDate"></VueDatePicker>
            </div>
        </div>

        <h4>Katılacak müşterinin</h4>
        <hr>
        <div class="mb-3 row">
            <label for="contact_name" class="col-sm-2 col-form-label">Ad Soyad</label>
            <div class="col-sm-10">
                <input type="text" class="form-control" v-model="AppointmentForm.contact_name" id="contact_name">
            </div>
        </div>
        <div class="mb-3 row">
            <label for="contact_email" class="col-sm-2 col-form-label">Email adresi</label>
            <div class="col-sm-10">
                <input type="text" class="form-control" v-model="AppointmentForm.contact_email" id="contact_email">
            </div>
        </div>
        <div class="mb-3 row">
            <label for="contact_phone" class="col-sm-2 col-form-label">Telefon Numarası</label>
            <div class="col-sm-10">
                <input type="text" class="form-control" v-model="AppointmentForm.contact_phone" id="contact_phone"
                    maxlength="11">
            </div>
        </div>
        <div class="mb-3 row">
            <label for="agent_name" class="col-sm-2 col-form-label">Müşteri ile ilgilenecek emlakçı çalışanı</label>
            <div class="col-sm-10">
                <v-select :options="estateEmployeeNameOption" v-model="AppointmentForm.agent_name"></v-select>
            </div>
        </div>
        <div class="alert alert-primary" v-if="distanceObj.value">
            <p>Adrese emlak ofisinden olan uzaklık = <strong>{{ distanceObj?.value?.distance?.text }}</strong></p>
            <p>Emlak ofisinden adrese sürecek toplam süre = <strong>{{ distanceObj?.value?.duration?.text }}</strong></p>
            <p class="mb-0" v-if="distanceObj.value.estimated">
                Tahmini ofisten çıkış zamanı = <strong><u>{{ distanceObj?.value?.estimated }}</u></strong>
            </p>
        </div>
        <div class="mb-3 row" v-show="distanceObj.value">
            <GoogleMap class="mb-3" id="map" :api-key="VITE_MAP_API" style="width: 100%; height: 500px"
                :center="estatePostalCode" :zoom="mapZoom">
                <Polyline :options="distanceLine.value" v-if="distanceLine.value" />
            </GoogleMap>
        </div>
        <button v-if="!isEditForm" class="btn w-100 btn-primary btn-lg" @click="btnCreate()" :disabled="btnDisabled">Randevu
            Oluştur</button>
        <button v-else class="btn w-100 btn-primary btn-lg" @click="btnEdit()" :disabled="btnDisabled">Randevu
            Düzenle</button>
    </div>
</template>


<style scoped></style>