import React from 'react'
import LatestJobCard from './LatestJobCards'

const randomJobs=[1,2,3,4,5,6,7,8]
export default function LatestJobs() {
    
  return (
    <div className='max-w-7xl  mx-auto my-20'>
        <h1 className='text-4xl font-bold'><span className='text-purple-500'>Latest</span> Job Opening</h1>
        <div className='grid grid-cols-3 gap-4 cols-3 my-5'>
        {
            randomJobs.slice(0,6).map((item,index)=><LatestJobCard  key={item} />)
        }
        </div>
    </div>
  )
}
