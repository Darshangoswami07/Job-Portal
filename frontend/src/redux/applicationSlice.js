import { createSlice } from "@reduxjs/toolkit";

const applicationSlice = createSlice({
    name: "application",
    initialState: {
        Applicants: [],
    },
    reducers:{
        setAllApplicants:(state,action)=>{
            state.Applicants=action.payload
        }
    }
});

export const {setAllApplicants}=applicationSlice.actions;
export default applicationSlice.reducer;