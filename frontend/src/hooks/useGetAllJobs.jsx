import { JOB_API_END_POINT } from '@/utils/constant';
import { setAllJobs } from '@/redux/jobSlice';
import axios from 'axios';
import  { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux';

export default function useGetAllJobs() {
    const dispatch = useDispatch();
    const { searchedQuery } = useSelector((store) => store.job || {});

    useEffect(() => {
        const fetchAllJobs = async () => {
            try {
                const keyword = searchedQuery || "";
                const url = `${JOB_API_END_POINT}/get?keyword=${encodeURIComponent(keyword)}`;
                const res = await axios.get(url, { withCredentials: true });

                if (res.data && res.data.success) {
                    dispatch(setAllJobs(res.data.jobs || []));
                } else {
                    dispatch(setAllJobs([]));
                }
            } catch (error) {
                console.error("useGetAllJobs error:", error);
                dispatch(setAllJobs([]));
            }
        };
        fetchAllJobs();
    }, [dispatch, searchedQuery]);
}

