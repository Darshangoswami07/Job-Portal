import Navbar from './shared/Navbar'
import Job from './Job'
import { useDispatch, useSelector } from 'react-redux'
import { useEffect } from 'react';
import { setSearchQuery } from '@/redux/jobSlice';
import useGetAllJobs from '@/hooks/useGetAllJobs';

export default function Browse() {
    useGetAllJobs();
    const {allJobs}=useSelector((store)=>store.job || {});
    const dispatch =useDispatch();
    useEffect(()=>{
        return()=>{
            dispatch(setSearchQuery(""))
        }
    },[dispatch])
  return (
    <div className='max-w-7xl mx-auto my-10'>
        <Navbar/>
        <div className="bg-gray-50 px-4 py-6 sm:px-6 lg:px-8">
          <div className="bg-white shadow-lg rounded-2xl border border-gray-200 p-5">
            <div className="mb-5">
              <h1 className="text-2xl font-bold text-slate-900">Search Results</h1>
              <p className="text-sm text-slate-500 mt-1">{allJobs.length || 0} jobs found</p>
            </div>

            {allJobs.length <= 0 ? (
              <div className="text-center py-12">
                <div className="space-y-3">
                  <h2 className="text-xl font-semibold text-slate-700">No Jobs Found</h2>
                  <p className="text-slate-500">Try searching with different keywords or check back later for new opportunities.</p>
                </div>
              </div>
            ) : (
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                {allJobs.map((job)=>{
                  return(
                    <Job key={job._id} job={job}/>
                  )
                })}
              </div>
            )}
          </div>
        </div>
    </div>
  )
}
