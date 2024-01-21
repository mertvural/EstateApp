<script setup>
import { ref, reactive, onMounted, defineProps, watch } from "vue"
import { useLoading } from 'vue-loading-overlay'
import { airtableBase } from "../api/airtable"
import vSelect from 'vue-select'
import VueDatePicker from '@vuepic/vue-datepicker';
import { GoogleMap, Polyline } from "vue3-google-map";
import { useToast } from 'vue-toast-notification';
import { postCode } from "../api/postCodes"
import { AlertsTexts } from "../components/AlertsText.js"
const { VITE_LAT, VITE_LNG, VITE_MAP_API, VITE_APPOINTMENT_TIME } = import.meta.env;
const props = defineProps({
    rowId: String,
    loadedTable: Function
});
const estatePostalCode = { lat: parseFloat(VITE_LAT), lng: parseFloat(VITE_LNG) };
const mapZoom = ref(10);
const $loading = useLoading();
const btnDisabled = ref(false);
const estateEmployeeNameOption = ref([]);
const $toast = useToast();
const distanceObj = reactive({});
const distanceLine = reactive({});
const date = ref();
const estimated = reactive({
    going: null,
    back: null
})
const editRowId = ref();
const alert = ref(false);
const alertText = ref(null)
const AppointmentForm = reactive({
    appointment_postcode: null,
    appointment_date: null,
    contact_name: null,
    contact_email: null,
    contact_phone: null,
    agent_name: null,
    time_period: null
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
            $toast.error(AlertsTexts.validationError);
            return
        }
    }
    return true
}
/**
 * @param {string} date - Formats and returns the date
 */
const format = (date) => {
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    const hour = date.getHours();
    const minute = date.getMinutes();
    return `${day}.${month}.${year} - ${hour}:${minute}`;
}
/**
 * @param {string} modelData - selected date
 */
const handleDate = (modelData) => {
    date.value = modelData;
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
/**
 * @param {string} appointmentTime - Appointment time
 * @param {string} durationTime - Total time it will take to address
 */
const estimatedTime = (appointmentTime, durationTime) => {
    let [hour1, minute1] = appointmentTime.split(":").map(Number);
    let [hour2, minute2] = durationTime.split(":").map(Number);
    let totalMinutes1 = hour1 * 60 + minute1;
    let totalMinutes2 = hour2 * 60 + minute2;
    let differenceInMinutes = totalMinutes1 - totalMinutes2;
    let resultHours = Math.floor(differenceInMinutes / 60);
    let resultMinutes = differenceInMinutes % 60;
    let returnTime = totalMinutes1 + totalMinutes2;
    let returnTimeHours = Math.floor(returnTime / 60) + parseInt(VITE_APPOINTMENT_TIME);
    let returnTimeMinutes = returnTime % 60;
    if (resultHours < 0) {
        resultHours = 24 - Math.abs(resultHours);
    }
    if (resultHours < 10) {
        resultHours = "0" + resultHours;
    }
    if (resultMinutes < 0) {
        resultMinutes = 59 - Math.abs(resultMinutes);
    }
    if (resultMinutes < 10) {
        resultMinutes = "0" + resultMinutes;
    }
    if (returnTimeHours > 23) {
        returnTimeHours = Math.abs(returnTimeHours) - 24
    }
    if (returnTimeHours < 10) {
        returnTimeHours = "0" + returnTimeHours;
    }
    if (returnTimeMinutes < 10) {
        returnTimeMinutes = "0" + returnTimeMinutes;
    }
    estimated.going = resultHours + ":" + resultMinutes;//going
    estimated.back = returnTimeHours + ":" + returnTimeMinutes;//return office
    AppointmentForm.time_period = estimated.going + "-" + estimated.back;
}
/**
 * @param {string} code - post code
 */
const getPostCode = (code) => {
    const loader = $loading.show();
    postCode(code).then(function (response) {
        if (response.status === 200) {
            getDistance(response.data.result);
            setDistanceLine(response.data.result);
        }
    }).catch(() => {
        $toast.error(AlertsTexts.postCodeError);
        distanceObj.value = ""
        AppointmentForm.appointment_postcode = null;
    }).finally(() => {
        loader.hide();
    })
}
/**
 * @param {object} response - Data returned from postcodes API
 */
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
            const elements = response.rows[0].elements[0];
            distanceObj.value = elements;
            AppointmentForm.appointment_date && handleDate(date.value)
            zoomSetting(parseInt(distanceObj.value.distance.text))

        } else {
            console.error(`Distance Matrix request failed due to ${status}`);
        }
    });
}
/**
 * @param {object} response - Data returned from postcodes API
 */
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
/**
 * @param {number} val - Zoom level of the map
 */
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
            $toast.error(AlertsTexts.createAppointmentsError);
            btnDisabled.value = false;
            loader.hide()
            return;
        }
        btnDisabled.value = false;
        $toast.success(AlertsTexts.createAppointmentsSuccess);
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
            $toast.error(AlertsTexts.editAppointmentsError);
            loader.hide()
            btnDisabled.value = false;
            return;
        }
        loader.hide()
        $toast.success(AlertsTexts.editAppointmentsSuccess);
        props.loadedTable();
        btnDisabled.value = false;
        var myModalEl = document.getElementById('editModal');
        myModalEl && myModalEl.querySelector(".btn-close").click();
    });
}
/*Fills in the names of employees working at the real estate agency*/
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
/**
 * @param {string} date - date 
 * @param {string} start1 - start of busy time interval
 * @param {string} end1 - end of busy time slot
 * @param {string} start2 - time out of office
 * @param {string} end2 - office arrival time
 */
const isConflict = (date, start1, end1, start2, end2) => {
    start1 = new Date(date.replaceAll(".", "-") + "T" + start1);
    end1 = new Date(date.replaceAll(".", "-") + "T" + end1);
    start2 = new Date(date.replaceAll(".", "-") + "T" + start2);
    end2 = new Date(date.replaceAll(".", "-") + "T" + end2);
    start1.getHours() >= 12 && end1.getHours() < 12 && end1.setDate(end1.getDate() + 1);  //If it is past 12 at night, increase the day of the month.
    start2.getHours() >= 12 && end2.getHours() < 12 && end2.setDate(end2.getDate() + 1);  //If it is past 12 at night, increase the day of the month.
    if (isConflictFunc(start1, end1, start2, end2)) {
        alert.value = true;
        alertText.value = AlertsTexts.conflictError;
        btnDisabled.value = true;
    }
    function isConflictFunc(start1, end1, start2, end2) {
        return end1 > start2 && start1 < end2;
    }
}

onMounted(() => {
    estateEmployeeNameLoaded();
});

/*Runs when editing is triggered*/
watch(() => props.rowId, (id) => {
    editRowId.value = id; //get the edit row id
    airtableBase('RealEstateTbl').find(id, function (err, record) {
        if (err) { console.error(err); return; }
        for (const property in AppointmentForm) {
            AppointmentForm[property] = record.get([property])
        }
        getPostCode(record.get('appointment_postcode'));
        date.value = new Date(record.get('appointment_date'));
    });
});

/*conflict time detect*/
watch(() => [AppointmentForm.agent_name, AppointmentForm.appointment_date], () => {
    alert.value = false;
    btnDisabled.value = false;
    if (AppointmentForm.agent_name !== null && AppointmentForm.appointment_date !== null) {
        airtableBase('RealEstateTbl').select({
            view: "Grid"
        }).eachPage(function page(records) {
            const nameFilter = records.filter((item) => {
                if (item.fields.agent_name === AppointmentForm.agent_name
                    && item.fields.appointment_date.split("-")[0] === AppointmentForm.appointment_date.split("-")[0]) {
                    return item
                }
            })
            nameFilter.forEach((item) => {
                if (item.id === editRowId.value) return
                let [start, end] = item.fields.time_period.split("-");
                const { going, back } = estimated;
                let date = item.fields.appointment_date.split("-")[0];
                isConflict(date, start, end, going, back);
            })

        }, function done(err) {
            if (err) { console.error(err); return; }
        });
    }
})

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
        <div class="alert alert-danger" v-if="alert">
            {{ alertText }}
        </div>
        <div class="alert alert-primary" v-if="distanceObj.value">
            <p>Adrese emlak ofisinden olan uzaklık = <strong>{{ distanceObj?.value?.distance?.text }}</strong></p>
            <p>Emlak ofisinden adrese sürecek toplam süre = <strong>{{ distanceObj?.value?.duration?.text }}</strong></p>
            <p v-if="estimated.going">
                Tahmini ofisten çıkış zamanı = <strong><u>{{ estimated.going }}</u></strong>
            </p>
            <p class="mb-0" v-if="estimated.back">
                Tahmini ofise varış zamanı = <strong><u>{{ estimated.back }}</u></strong>
            </p>
        </div>
        <div class="mb-3 row" v-show="distanceObj.value">
            <GoogleMap class="mb-3" id="map" :api-key="VITE_MAP_API" style="width: 100%; height: 500px"
                :center="estatePostalCode" :zoom="mapZoom">
                <Polyline :options="distanceLine.value" v-if="distanceLine.value" />
            </GoogleMap>
        </div>
        <button v-if="!editRowId" class="btn w-100 btn-primary btn-lg" @click="btnCreate()" :disabled="btnDisabled">Randevu
            Oluştur</button>
        <button v-else class="btn w-100 btn-primary btn-lg" @click="btnEdit()" :disabled="btnDisabled">Randevu
            Düzenle</button>
    </div>
</template>


<style scoped></style>