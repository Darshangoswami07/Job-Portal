import React from 'react'
import LatestJobCard from './LatestJobCards'
import { useSelector } from 'react-redux'
import useGetAllJobs from '@/hooks/useGetAllJobs'


export default function LatestJobs() {
  useGetAllJobs();
  const {allJobs} = useSelector(store=>store.job);
  return (
    <div className='max-w-7xl mx-auto my-20 px-4'>
        <h1 className='text-4xl font-bold text-center mb-10'><span className='text-purple-500'>Latest</span> Job Opening</h1>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {
            allJobs.length<=0?
            <div className="col-span-full text-center py-12">
              <h2 className="text-2xl font-semibold text-slate-700 mb-2">No Jobs Available</h2>
              <p className="text-slate-500">Check back later for new job opportunities.</p>
            </div>
            :allJobs?.slice(0,6).map((job)=><LatestJobCard  key={job._id} job={job}/>)
        }
        </div>
    </div>
  )
}
