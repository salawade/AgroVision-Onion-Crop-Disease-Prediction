import axios from "axios";

const API = axios.create({
    baseURL: process.env.REACT_APP_API_URL || "http://127.0.0.1:8000",
    timeout: 30000,
});

export const predictDisease = async (file, farmerId = null) => {

    const formData = new FormData();

    formData.append("file", file);

    if (farmerId !== null) {
        formData.append("farmer_id", farmerId);
    }

    const response = await API.post("/predict/", formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });

    return response.data;
};

export default API;