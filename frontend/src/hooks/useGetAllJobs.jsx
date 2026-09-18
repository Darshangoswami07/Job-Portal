import { JOB_API_END_POINT } from '@/utils/constant';
import { setAllJobs } from '@/store/slices/jobSlice';
import axios from 'axios';
import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';

const DEBOUNCE_MS = 400;

export default function useGetAllJobs() {
    const dispatch = useDispatch();
    const { searchedQuery } = useSelector((store) => store.job || {});
    const abortRef = useRef(null);

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (abortRef.current) {
                abortRef.current.abort();
            }
            const controller = new AbortController();
            abortRef.current = controller;

            try {
                const keyword = (searchedQuery || "").trim();
                const params = { limit: 1000 };
                if (keyword) params.keyword = keyword;

                const res = await axios.get(`${JOB_API_END_POINT}/get`, {
                    params,
                    withCredentials: true,
                    signal: controller.signal,
                });

                if (res.data && res.data.success && res.data.jobs) {
                    dispatch(setAllJobs(res.data.jobs));
                }
            } catch (error) {
                if (axios.isCancel(error)) return;
                console.error("useGetAllJobs error:", error);
            }
        }, DEBOUNCE_MS);

        return () => {
            clearTimeout(timer);
            if (abortRef.current) {
                abortRef.current.abort();
            }
        };
    }, [dispatch, searchedQuery]);
}
