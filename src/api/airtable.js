import Airtable from 'airtable';

const {VITE_AIRTABLE_TOKEN, VITE_AIRTABLE_URL, VITE_AIRTABLE_BASEID} = import.meta.env;

Airtable.configure({
    endpointUrl: VITE_AIRTABLE_URL,
    apiKey: VITE_AIRTABLE_TOKEN
});

export const airtableBase = Airtable.base(VITE_AIRTABLE_BASEID);