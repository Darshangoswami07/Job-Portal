import { createSlice } from "@reduxjs/toolkit";

const authSlice = createSlice({
    name: "auth",
    initialState: {
        loading: false,
        user: null,
        token: localStorage.getItem("token") || null,
    },
    reducers: {
        setLoading: (state, action) => {
            state.loading = action.payload;
        },
        setUser: (state, action) => {
            state.user = action.payload;
        },
        setToken: (state, action) => {
            state.token = action.payload;
            if (action.payload) {
                localStorage.setItem("token", action.payload);
            } else {
                localStorage.removeItem("token");
            }
        },
        setCredentials: (state, action) => {
            state.user = action.payload.user;
            state.token = action.payload.token;
            if (action.payload.token) {
                localStorage.setItem("token", action.payload.token);
            }
        },
        clearAuth: (state) => {
            state.user = null;
            state.token = null;
            localStorage.removeItem("token");
        }
    }
});

export const { setLoading, setUser, setToken, setCredentials, clearAuth } = authSlice.actions;
export default authSlice.reducer;
