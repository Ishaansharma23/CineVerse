import BannerSlider from '../component/shared/BannerSlider'

const Home = () => {
  return (
    <div>
        {/* home page ka content yaha hoga, jaise ki banner slider, featured movies, recommended etc. */}
        <BannerSlider />
        {/* recommended movies shows honge */}
        <Recommended /> 
    </div>
  )
}

export default Home