import React from 'react'
import Navbar from './shared/Navbar'
import HeroSection from './HeroSection'
import CategoryCarousel from './CategoryCarousel'

export default function Home() {
  return (
    <div>
      <Navbar/>
       <HeroSection/>
      <CategoryCarousel/>
      {/* <LatestJobs/> */}
      {/* <Footer/>  */}
    </div>
  )
}
