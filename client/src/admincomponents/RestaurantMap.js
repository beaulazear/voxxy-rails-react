import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import styled from "styled-components";
import colors from '../styles/Colors';

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
        return (
            <ChatButton>
                <StyledButton>
                    Map Loading...
                </StyledButton>
            </ChatButton>)
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
                            top: "110px",
                            right: "10px",
                            padding: "8px 15px",
                            fontSize: "1.2rem",
                            cursor: "pointer",
                            zIndex: 9999, // Increase the z-index here
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
  align-items: center;
  justify-content: center;
  /* no top margin so it sits level with sibling button */
`;

export const StyledButton = styled.button`
  background: ${colors.primaryButton};
  color: ${colors.textPrimary};
  padding: 0.75rem 1rem;
  font-size: 1rem;
  font-weight: 600;
  border: none;
  border-radius: 9999px;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background: rgba(157,96,248,0.9);
  }
`;