import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

const defaultIcon = new L.Icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
});

const RestaurantMap = ({ recommendations }) => {
    const [locations, setLocations] = useState([]);

    useEffect(() => {
        if (!recommendations || recommendations.length === 0) return;

        const fetchCoordinates = async () => {
            const geocodedLocations = await Promise.all(
                recommendations.map(async (rec) => {
                    if (!rec.address) return null;

                    try {
                        const response = await fetch(
                            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(rec.address)}`
                        );

                        const data = await response.json();
                        if (data.length > 0) {
                            return {
                                name: rec.name,
                                lat: parseFloat(data[0].lat),
                                lon: parseFloat(data[0].lon),
                                address: rec.address,
                            };
                        }
                    } catch (error) {
                        console.error("❌ Geocoding failed for:", rec.address, error);
                    }

                    return null;
                })
            );

            setLocations(geocodedLocations.filter((loc) => loc !== null));
        };

        fetchCoordinates();
    }, [recommendations]);

    return (
        <div style={{ height: "100%", width: "100%", marginTop: "2rem" }}>
            <MapContainer center={[40.7128, -74.006]} zoom={12} style={{ height: "100%", width: "100%", borderRadius: "12px" }}>
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                {locations.map((location, index) => (
                    <Marker key={index} position={[location.lat, location.lon]} icon={defaultIcon}>
                        <Popup>
                            <strong>{location.name}</strong> <br />
                            📍 {location.address}
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
};

export default RestaurantMap;