import { createContext, useContext, useEffect, useState } from "react";

export const LocationContext = createContext();

export const LocationProvider = ({children}) => {

    const [location, setLocation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {

        // logic to fetch location data based on coordinates
        const fetchLocationData = async (latitude, longitude) => {
            try {
                const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
                const data = await response.json();
                const userlocation = data?.city || data?.locality || data?.principalSubdivision || "Unknown Location";
                setLocation(userlocation);
                setLoading(false);
            } catch (err) {
                setError("Failed to fetch location data");
                setLoading(false);
            }
        }

        // logic to fetch and set location 
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                // You can use these coordinates to fetch location data from an API 
                fetchLocationData(latitude, longitude);
            },
            (err) => {
                console.error(err);
                setError("unable to retrieve your location");
                setLoading(false);
            }
        );
    }, []);

    return (
        <LocationContext.Provider value={{location, loading, error}}>
            {children}
        </LocationContext.Provider>
    )
}

export const useLocation = () => useContext(LocationContext);