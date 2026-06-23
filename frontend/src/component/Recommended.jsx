import { useEffect, useState } from 'react'
import { movieService } from '../services/movieService'

const Recommended = () => {
    const [movies, setMovies] = useState([])

    useEffect(() => {
        let isMounted = true

        const loadRecommendedMovies = async () => {
            try {
                const response = await movieService.getRecommendedMovies(10);
                console.log(response);

                if (isMounted) {
                    setMovies(response.movies || [])
                }
            } catch (error) {
                console.error('Failed to load recommended movies:', error.message)
            }
        }

        loadRecommendedMovies()

        return () => {
            isMounted = false
        }
    }, [])

  return (
    <div className='bg-white w-full py-6'>
        <div className='max-w-7xl mx-auto px-4'>
            <div className='items-center flex justify-between mb-4'>
                <h2 className='font-semibold text-2xl'>Recommended Movies</h2>
                <span className='text-md text-red-500 cursor-pointer hover:underline font-medium'>
                    See All
                </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {/* Recommended movies will be displayed here */}
                {
                    movies.map((movie, index) => (
                        <div key={movie.id || index} className="group relative overflow-hidden rounded-lg border border-black/10 bg-[#f7f7f7] shadow-[0_12px_30px_rgba(0,0,0,0.16)] transition duration-300 ease-out hover:scale-[1.01]">
                            <img
                                src={movie.image || movie.posterUrl || movie.backdropUrl}
                                alt={movie.title}
                                className="h-full w-full object-cover transition duration-500 ease-out group-hover:scale-[1.01]"
                                loading="lazy"
                            />
                            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04),rgba(0,0,0,0.04),rgba(255,255,255,0.04))]" />
                        </div>
                    ))
                }
            </div>

        </div>
    </div>
  )
}

export default Recommended