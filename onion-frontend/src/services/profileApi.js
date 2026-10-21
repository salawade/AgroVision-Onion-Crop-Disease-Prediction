import axios from "axios";

const API = axios.create({
    baseURL: "http://127.0.0.1:8000"
});

export const getProfile = async(id)=>{

    const res = await API.get(`/profile/${id}`);

    return res.data;

}

export const updateProfile = async(id,data)=>{

    const res = await API.put(`/profile/${id}`,data);

    return res.data;

}