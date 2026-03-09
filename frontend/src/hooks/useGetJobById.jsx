import { JOB_API_END_POINT } from '@/utils/constant';
import axios from 'axios';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setSingleJob } from '@/redux/jobSlice';

export default function useGetJobById(jobId) {
  const dispatch = useDispatch();

  useEffect(() => {
    if (!jobId) return;

    const fetchJob = async () => {
      try {
        const res = await axios.get(
          `${JOB_API_END_POINT}/get/${jobId}`,
          { withCredentials: true }
        );
        if (res.data.success) {
          dispatch(setSingleJob(res.data.job));
        }
      } catch (error) {
        console.log(error);
      }
    };

    fetchJob();
  }, [jobId, dispatch]);
}
