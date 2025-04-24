import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import ReactDOM from "react-dom";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import styled from "styled-components";
import colors from '../styles/Colors';
import SmallTriangle from '../assets/SmallTriangle.png';
import markerShadow from "leaflet/dist/images/marker-shadow.png";

const triangleIcon = new L.Icon({
    iconUrl: SmallTriangle,
    shadowUrl: markerShadow,        // optional, you can leave this off
    iconSize: [30, 30],             // tweak to whatever fits
    iconAnchor: [15, 30],           // point of the icon which corresponds to the marker’s location (half width, full height)
    popupAnchor: [0, -30],          // where popups should open relative to the iconAnchor
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
            ) : ReactDOM.createPortal(
                <FullScreenOverlay>
                    <button
                        onClick={() => setShowMap(false)}
                        style={{
                            position: "absolute",
                            top: "10px",
                            right: "10px",
                            padding: "8px 15px",
                            fontSize: "1.2rem",
                            cursor: "pointer",
                            zIndex: 10001,
                        }}
                    >
                        Back
                    </button>

                    <MapContainer
                        center={[40.7128, -74.006]}
                        zoom={12}
                        style={{ height: "100%", width: "100%" }}
                    >
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='&copy; OpenStreetMap contributors'
                        />
                        {locations.length > 0 && (
                            <FitBoundsToMarkers locations={locations} />
                        )}
                        {locations.map((loc, i) => (
                            <Marker
                                key={i}
                                position={[loc.lat, loc.lon]}
                                icon={triangleIcon}
                            >
                                <Popup>
                                    <strong>{loc.name}</strong>
                                    <br />
                                    📍 {loc.address}
                                </Popup>
                            </Marker>
                        ))}
                    </MapContainer>
                </FullScreenOverlay>,
                document.body
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

export const FullScreenOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: #fff;
  z-index: 9999;
`;