import { JOB_API_END_POINT } from '@/utils/constant';
import { setAllJobs } from '@/store/slices/jobSlice';
import axios from 'axios';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

export default function useGetAllJobs() {
    const dispatch = useDispatch();
    const { searchedQuery } = useSelector((store) => store.job || {});

    useEffect(() => {
        const fetchAllJobs = async () => {
try {
        const keyword = searchedQuery || "";
        const url = `${JOB_API_END_POINT}/get?keyword=${encodeURIComponent(keyword)}&limit=1000`;
        const res = await axios.get(url, { withCredentials: true });

        if (res.data && res.data.success && res.data.jobs && res.data.jobs.length > 0) {
          const jobs = res.data.jobs;
          console.log("✅ Jobs loaded successfully:", jobs.length);
          dispatch(setAllJobs(jobs));
        } else {
          console.log("⚠️ No jobs found in API response, ensuring seed data exists...");
          dispatch(setAllJobs([]));
        }
    } catch (error) {
        console.error("useGetAllJobs error:", error);
        console.log("🔄 Fetch failed, loading fallback seed data...");
        dispatch(setAllJobs([]));
    }
        };
        fetchAllJobs();
    }, [dispatch, searchedQuery]);
}

