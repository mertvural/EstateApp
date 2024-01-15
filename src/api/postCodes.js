import axios from "axios"
const { VITE_POSTCODESIO } = import.meta.env;

export const postCode = (code) => {
    return axios.get(VITE_POSTCODESIO + "/postcodes/" + code)
}