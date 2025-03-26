import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import styled from "styled-components";
import SmallerLoading from "../components/SmallerLoading";

import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

const defaultIcon = new L.Icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
});

const FitBoundsToMarkers = ({ locations }) => {
    const map = useMap();

    useEffect(() => {
        if (locations.length === 0) return;

        const bounds = L.latLngBounds(locations.map(loc => [loc.lat, loc.lon]));
        map.fitBounds(bounds, { padding: [50, 50] });

    }, [locations, map]);

    return null;
};

const RestaurantMap = ({ recommendations }) => {
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showMap, setShowMap] = useState(false);

    useEffect(() => {
        if (!recommendations || recommendations.length === 0) {
            setLoading(true);
            return;
        }

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

            const filteredLocations = geocodedLocations.filter((loc) => loc !== null);
            setLocations(filteredLocations);
            setLoading(false);
        };

        fetchCoordinates();
    }, [recommendations]);

    if (loading) {
        return <SmallerLoading title={'Map View'} />;
    }

    return (
        <div>
            {!showMap ? (
                <ChatButton>
                    <StyledButton onClick={() => setShowMap(true)}>
                        Map View
                    </StyledButton>
                </ChatButton>
            ) : (
                <div style={{ height: "100vh", width: "100vw", position: "fixed", top: 0, left: 0, backgroundColor: "#fff", zIndex: 1000 }}>
                    <button
                        onClick={() => setShowMap(false)}
                        style={{
                            position: "absolute",
                            top: "10px",
                            right: "10px",
                            padding: "8px 15px",
                            fontSize: "1.2rem",
                            cursor: "pointer",
                            zIndex: 1100,
                        }}
                    >
                        Back
                    </button>

                    <MapContainer center={[40.7128, -74.006]} zoom={12} style={{ height: "100%", width: "100%" }}>
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        />

                        {locations.length > 0 && <FitBoundsToMarkers locations={locations} />}

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
            )}
        </div>
    );
};

export default RestaurantMap;

export const ChatButton = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 1rem;

  @media (max-width: 768px) {
    margin-top: 0.75rem;
  }

  @media (max-width: 480px) {
    margin-top: 0.5rem;
  }
`;

export const StyledButton = styled.button`
  padding: 0.75rem 1.5rem;
  font-size: 1.1rem;
  font-weight: bold;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  transition: background 0.3s ease;
  color: white;
  background: ${(props) =>
        props.$isDelete ? "red" : "linear-gradient(135deg, #6a1b9a, #8e44ad)"};

  &:hover {
    background: ${(props) =>
        props.$isDelete
            ? "darkred"
            : "linear-gradient(135deg, #4e0f63, #6a1b8a)"};
  }

  @media (max-width: 768px) {
    padding: 0.6rem 1.2rem;
    font-size: 1rem;
  }

  @media (max-width: 480px) {
    padding: 0.5rem 1rem;
    font-size: 0.9rem;
  }
`;