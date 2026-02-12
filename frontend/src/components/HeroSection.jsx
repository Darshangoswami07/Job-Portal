import { Search } from 'lucide-react'
import React from 'react'

export default function HeroSection() {
  return (
    <div className='text-center'>
        <div className='flex flex-col gap-5 my-10'>
        <span className="mx-auto px-4 py-2 rounded-full bg-amber-100 text-red-500 font-medium">No.1 job Hunt Website</span>
        <h1 className='text-5xl font-bold  '>Search,Apply & <br /> Get Your <span className='text-purple-500'>Dream Job</span></h1>
        <p className='text-lg text-gray-600'>Find your dream job with our easy-to-use platform</p>
        <div className='flex w-[40%] shadow-lg border border-gray-200 pl-5 rounded-full items-center gap-4 m-auto '>
            <input
             type="text"
             placeholder="Search Jobs"
             className='outline-none border-none w-full'
             />
             <button className='rounded-r-full bg-purple-500 text-white px-4 py-2'><Search className='h-5 w-5'/></button>
        </div>
        </div>
    </div>
  )
}
