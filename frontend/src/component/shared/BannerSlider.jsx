import SliderModule from 'react-slick';
import { banners } from '../../utils/Constants';

const Slider = SliderModule.default || SliderModule;

const ArrowButton = ({ className, onClick, direction }) => (
    <button
        type="button"
        onClick={onClick}
        className={`absolute top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-black/10 bg-black! text-white! shadow-[0_10px_25px_rgba(0,0,0,0.14)] transition hover:scale-105 hover:bg-gray-900! ${className || ''}`}
        aria-label={direction === 'next' ? 'Next banner' : 'Previous banner'}
    >
        <span className="text-lg leading-none">
            {direction === 'next' ? '›' : '‹'}
        </span>
    </button>
);

const BannerSlider = () => {
    const settings = {
        slidesToShow: 1,
        slidesToScroll: 1,
        centerMode: true, // center ka banner bda dikhega 
        centerPadding: '9vw', // Center slide ke left/right 9vw khaal jagah chhod
        speed: 800,
        cssEase: 'cubic-bezier(0.22, 1, 0.36, 1)', // Fancy animation curve.
        autoplay: true,
        autoplaySpeed: 2000,
        infinite: true,
        arrows: true,
        dots: true, // ye dots ko change kr rha jaise slide change hori
        pauseOnHover: true,
        swipeToSlide: true, // mobile m mostly used drag krke swipe krke dekhne k liye banner 
        adaptiveHeight: false, // chote pages or bada banner ke liye height adjust nahi karega, consistent height dega.
        nextArrow: <ArrowButton direction="next" className="right-2 sm:right-4 lg:right-6" />,
        prevArrow: <ArrowButton direction="prev" className="left-2 sm:left-4 lg:left-6" />,
        customPaging: () => ( // Ye dots ka design change kar raha hai.
            <button type="button" className="mx-1 h-2.5 w-2.5 rounded-full bg-black/20 transition hover:bg-black/60" aria-label="Go to slide" /> //. Agar koi visually impaired banda website use kare to screen reader bolega: "Go to slide" jab wo dots pe focus karega. Ye accessibility ke liye important hai.
        ),
        appendDots: (dots) => (  // Ye dots ko style kar raha hai.
            <div>
                <ul className="mt-4 flex items-center justify-center gap-1.5">{dots}</ul>
            </div>
        ),
        responsive: [
            {
                breakpoint: 1280,
                settings: {
                    centerMode: true,
                    centerPadding: '12vw',
                    arrows: true,
                },
            },
            {
                breakpoint: 1024,
                settings: {
                    centerMode: true,
                    centerPadding: '8vw',
                    arrows: true,
                },
            },
            {
                breakpoint: 768,
                settings: {
                    centerMode: false,
                    centerPadding: '0px',
                    arrows: true,
                    dots: true,
                    speed: 800,
                },
            },
        ],
    }


  return (
        <div className="w-full bg-white py-4 sm:py-6">
            <div className="mx-auto w-full max-w-[1600px] px-3 sm:px-4 lg:px-8">
                <Slider {...settings} className="banner-slider">
                    {banners.map((banner, index) => (
                        <div key={index} className="px-2 outline-none">
                            <div className="group relative h-50 overflow-hidden rounded-[14px] border border-black/10 bg-[#f7f7f7] shadow-[0_12px_30px_rgba(0,0,0,0.16)] transition duration-300 ease-out hover:scale-[1.01] sm:h-75 lg:h-95">
                                <img
                                    src={banner}
                                    alt={`Banner ${index + 1}`}
                                    className="h-full w-full object-contain p-1 sm:p-1.5 transition duration-500 ease-out group-hover:scale-[1.01]"
                                />
                                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04),rgba(0,0,0,0.04),rgba(255,255,255,0.04))]" />
                            </div>
                        </div>
                    ))}
                </Slider>
            </div>
        </div>
    )
}

export default BannerSlider