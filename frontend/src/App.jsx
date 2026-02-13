import React from 'react'
import Navbar from './components/shared/Navbar'
import './App.css'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Home from './components/Home'
import Login from './components/auth/Login'
import Signup from './components/auth/Signup'
import Jobs from './components/Jobs'
import Browse from './components/Browse'



const appRouter =createBrowserRouter([
  {
    path:'/',
    element:<Home/>
  },
  {
    path:'/login',
    element:<Login/>
  },
  {
    path:'/signup',
    element:<Signup/>
  },
  {
    path:'/browse',
    element:<Browse/>
  },
  {
    path:"/jobs",
    element:<Jobs/>
  }
])

function App() {

  return (
    <div>
    <RouterProvider router={appRouter}/>
    </div>
  )
}

export default App
