<script setup>
import {defineProps, watch } from "vue"
import Form from "@/components/Form.vue";
const props = defineProps({
    rowId: String,
});
</script>
<template>
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
<style scoped>
</style>