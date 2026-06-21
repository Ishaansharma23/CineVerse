import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import './index.css'
import { Route, Routes } from 'react-router-dom'
import Header from './component/shared/Header'
import Footer from './component/shared/Footer'

function App() {

  return (
    <>
    <div className='flex flex-col min-h-screen'>
    <main className='flex-grow'>
      <Header/>
      <Routes>
        <Route path='/' element={<h1>Homepage</h1>} />
        <Route path='/profile/:id' element={<h1>Profile Page</h1>} />
        <Route path='/movies' element={<h1>Movies Page</h1>} />
      </Routes>
      <Footer/>
    </main>
    </div>
    </>
  )
}

export default App
