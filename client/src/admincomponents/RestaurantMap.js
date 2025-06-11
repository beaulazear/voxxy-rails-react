import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import ReactDOM from "react-dom";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import styled, { keyframes } from "styled-components";
import SmallTriangle from '../assets/SmallTriangle.png';
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { Map, X } from 'lucide-react';

// Custom dark marker icon
const triangleIcon = new L.Icon({
    iconUrl: SmallTriangle,
    shadowUrl: markerShadow,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
    className: 'custom-marker-icon'
});

const FitBoundsToMarkers = ({ locations }) => {
    const map = useMap();

    useEffect(() => {
        if (locations.length === 0) return;

        const bounds = L.latLngBounds(locations.map(loc => [loc.lat, loc.lon]));
        map.fitBounds(bounds, {
            padding: [60, 60],
            maxZoom: 15
        });
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
                <StyledButton $loading>
                    <LoadingSpinner />
                    <Map size={20} /> Loading Map...
                </StyledButton>
            </ChatButton>
        )
    }

    return (
        <div>
            {!showMap ? (
                <ChatButton>
                    <StyledButton onClick={() => setShowMap(true)}>
                        <Map size={20} /> View Recommendations On Map
                    </StyledButton>
                </ChatButton>
            ) : ReactDOM.createPortal(
                <FullScreenOverlay $show={showMap}>
                    <MapHeader>
                        <MapTitle>Restaurant Locations</MapTitle>
                        <CloseButton onClick={() => setShowMap(false)}>
                            <X size={24} />
                        </CloseButton>
                    </MapHeader>

                    <MapWrapper>
                        <MapContainer
                            center={[40.7128, -74.006]}
                            zoom={12}
                            style={{ height: "100%", width: "100%" }}
                            zoomControl={false}
                        >
                            {/* Dark theme tile layer */}
                            <TileLayer
                                url="https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png"
                                attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
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
                                    <Popup className="dark-popup">
                                        <PopupContent>
                                            <RestaurantName>{loc.name}</RestaurantName>
                                            <RestaurantAddress>📍 {loc.address}</RestaurantAddress>
                                        </PopupContent>
                                    </Popup>
                                </Marker>
                            ))}
                        </MapContainer>
                    </MapWrapper>
                </FullScreenOverlay>,
                document.body
            )}
        </div>
    );
};

export default RestaurantMap;

// Animations
const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const slideIn = keyframes`
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
`;

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
`;

// Styled Components
export const ChatButton = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  animation: ${fadeIn} 0.3s ease-out;
`;

const StyledButton = styled.button`
  width: 100%;
  background: ${({ $loading }) => $loading ? '#2a2a2a' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'};
  color: #ffffff;
  border: none;
  padding: 1rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  border-radius: 12px;
  cursor: ${({ $loading }) => $loading ? 'not-allowed' : 'pointer'};
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
  position: relative;
  overflow: hidden;

  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
    transition: left 0.5s;
  }

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
    
    &:before {
      left: 100%;
    }
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.7;
    animation: ${pulse} 2s infinite;
  }
`;

const LoadingSpinner = styled.div`
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top: 2px solid #ffffff;
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
`;

export const FullScreenOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: #1a1a1a;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  animation: ${slideIn} 0.4s cubic-bezier(0.4, 0, 0.2, 1);
`;

const MapHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  background: rgba(26, 26, 26, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  z-index: 10001;
`;

const MapTitle = styled.h2`
  color: #ffffff;
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
  background: #fff;
  font-family: 'Montserrat', sans-serif;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const CloseButton = styled.button`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #ffffff;
  padding: 0.75rem;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: rotate(90deg);
  }
`;

const MapWrapper = styled.div`
  flex: 1;
  position: relative;
  
  .leaflet-container {
    background: #1a1a1a;
  }
  
  .leaflet-popup-content-wrapper {
    background: rgba(42, 42, 42, 0.95);
    backdrop-filter: blur(10px);
    color: #ffffff;
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  }
  
  .leaflet-popup-tip {
    background: rgba(42, 42, 42, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .leaflet-popup-close-button {
    color: #ffffff;
    font-size: 18px;
    padding: 4px 8px;
  }
  
  .leaflet-popup-close-button:hover {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
  }
  
  .custom-marker-icon {
    filter: drop-shadow(0 4px 8px rgba(102, 126, 234, 0.4));
    transition: all 0.3s ease;
  }
  
  .leaflet-marker-icon:hover {
    transform: scale(1.1);
  }
  
  .leaflet-control-zoom {
    border: none;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  }
  
  .leaflet-control-zoom a {
    background: rgba(42, 42, 42, 0.95);
    color: #ffffff;
    border: 1px solid rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
  }
  
  .leaflet-control-zoom a:hover {
    background: rgba(102, 126, 234, 0.8);
  }
`;

const PopupContent = styled.div`
  padding: 0.5rem;
  min-width: 200px;
`;

const RestaurantName = styled.div`
  font-weight: 700;
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const RestaurantAddress = styled.div`
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.9rem;
  line-height: 1.4;
`;