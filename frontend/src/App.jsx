import './index.css'
import { Route, Routes } from 'react-router-dom'
import Header from './component/shared/Header'
import Footer from './component/shared/Footer'
import Home from './pages/Home'

function App() {

  return (
    <>
    <div className='flex flex-col min-h-screen'>
    <main className='grow'>
      <Header/>
      <Routes>
        <Route path='/' element={<Home />} />
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
