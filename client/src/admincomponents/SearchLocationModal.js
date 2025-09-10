import React, { useState, useRef, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { MapPin, Search, X, Loader } from 'lucide-react';
import colors from '../styles/Colors';
import { logger } from '../utils/logger';

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

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1001;
  padding: 1rem;
`;

const ModalContainer = styled.div`
  background: linear-gradient(135deg, #2a1e30 0%, #342540 100%);
  padding: 0;
  border-radius: 1.5rem;
  width: 100%;
  max-width: 550px;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
  color: #fff;
  animation: ${fadeIn} 0.3s ease-out;
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  position: relative;
`;

const Header = styled.div`
  padding: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(0, 0, 0, 0.2);
`;

const Title = styled.h2`
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #fff;
  font-family: 'Montserrat', sans-serif;
`;

const CloseButton = styled.button`
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
  }
`;

const SearchContainer = styled.div`
  padding: 1.5rem;
  background: rgba(0, 0, 0, 0.1);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
`;

const SearchInputContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const SearchIcon = styled(Search)`
  position: absolute;
  left: 1rem;
  color: rgba(255, 255, 255, 0.5);
  pointer-events: none;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 0.875rem 1rem 0.875rem 3rem;
  font-size: 0.95rem;
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
  transition: all 0.2s ease;
  font-family: 'Montserrat', sans-serif;
  
  &:focus {
    outline: none;
    border-color: ${colors.primaryButton};
    background: rgba(255, 255, 255, 0.08);
  }
  
  &::placeholder { 
    color: rgba(255, 255, 255, 0.4);
  }
`;

const LoadingIcon = styled(Loader)`
  position: absolute;
  right: 1rem;
  color: ${colors.primaryButton};
  animation: ${spin} 1s linear infinite;
`;

const ResultsContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(204, 49, 232, 0.4);
    border-radius: 3px;
    
    &:hover {
      background: rgba(204, 49, 232, 0.6);
    }
  }
`;

const EmptyState = styled.div`
  padding: 3rem 1.5rem;
  text-align: center;
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.95rem;
  font-family: 'Montserrat', sans-serif;
`;

const ResultItem = styled.button`
  width: 100%;
  padding: 1rem;
  margin-bottom: 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.75rem;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
  
  &:hover {
    background: rgba(204, 49, 232, 0.1);
    border-color: rgba(204, 49, 232, 0.3);
    transform: translateX(4px);
  }
  
  &:active {
    transform: translateX(2px);
  }
`;

const ResultIcon = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(204, 49, 232, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 2px;
  
  svg {
    width: 18px;
    height: 18px;
    color: ${colors.primaryButton};
  }
`;

const ResultContent = styled.div`
  flex: 1;
  overflow: hidden;
`;

const ResultTitle = styled.div`
  font-size: 0.95rem;
  font-weight: 600;
  color: #fff;
  margin-bottom: 4px;
  font-family: 'Montserrat', sans-serif;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ResultSubtitle = styled.div`
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.6);
  font-family: 'Montserrat', sans-serif;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

// Google Places Service for web
class GooglePlacesService {
  static async searchPlaces(query, types = 'geocode') {
    logger.debug('GooglePlacesService.searchPlaces called with:', query);
    
    if (!query || query.length < 2) {
      return [];
    }

    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
      const url = `${API_URL}/api/places/search?query=${encodeURIComponent(query)}&types=${encodeURIComponent(types)}`;
      
      logger.debug('Calling places API:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include',
      });

      const data = await response.json();
      logger.debug('Places API response:', data);

      if (response.ok && data.results) {
        return data.results;
      } else {
        logger.error('Places API error:', data.error || 'Unknown error');
        return [];
      }
    } catch (error) {
      logger.error('Places API network error:', error);
      return [];
    }
  }

  static async getPlaceDetails(placeId) {
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
      const url = `${API_URL}/api/places/details?place_id=${encodeURIComponent(placeId)}`;
      
      logger.debug('Calling place details API:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include',
      });

      const data = await response.json();
      logger.debug('Place details API response:', data);

      if (response.ok && data.details) {
        return data.details;
      } else {
        logger.error('Place details API error:', data.error || 'Unknown error');
        return null;
      }
    } catch (error) {
      logger.error('Place details API network error:', error);
      return null;
    }
  }

  static parseLocationData(place, placeDetails = null) {
    const locationData = {
      address: place.description || '',
      placeId: place.place_id,
    };

    // Extract main text and secondary text if available
    if (place.structured_formatting) {
      locationData.mainText = place.structured_formatting.main_text;
      locationData.secondaryText = place.structured_formatting.secondary_text;
    }

    // Add coordinates if we have place details
    if (placeDetails && placeDetails.geometry && placeDetails.geometry.location) {
      locationData.coordinates = {
        lat: placeDetails.geometry.location.lat,
        lng: placeDetails.geometry.location.lng,
      };
      locationData.formattedAddress = placeDetails.formatted_address || place.description;
    }

    return locationData;
  }
}

export default function SearchLocationModal({ visible, onClose, onLocationSelect, currentLocation = '' }) {
  const [searchText, setSearchText] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const searchTimeout = useRef(null);
  const searchInputRef = useRef(null);

  // Focus input when modal opens
  useEffect(() => {
    if (visible) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
      // Set initial search text if there's a current location
      if (currentLocation && !currentLocation.match(/^-?\d+\.\d+,\s*-?\d+\.\d+$/)) {
        // Only set if it's not coordinates
        setSearchText(currentLocation);
      }
    } else {
      // Clear search when modal closes
      setSearchText('');
      setSuggestions([]);
    }
  }, [visible, currentLocation]);

  // Search places using Google Places API
  const searchPlaces = async (query) => {
    logger.debug('searchPlaces called with:', query);
    if (!query || query.length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      setIsLoading(true);
      const results = await GooglePlacesService.searchPlaces(query, 'geocode');
      logger.debug('Search results:', results);
      setSuggestions(results);
    } catch (error) {
      logger.error('Places search error:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle search input changes with debouncing
  const handleSearchChange = (text) => {
    logger.debug('Search text changed:', text);
    setSearchText(text);
    
    // Clear previous timeout
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    // Set new timeout for search debouncing
    searchTimeout.current = setTimeout(() => {
      logger.debug('Searching for:', text);
      searchPlaces(text);
    }, 300);
  };

  // Handle location selection from suggestions
  const handleLocationSelect = async (place) => {
    try {
      setIsLoading(true);
      
      // Get detailed place information including coordinates
      const placeDetails = await GooglePlacesService.getPlaceDetails(place.place_id);
      const locationData = GooglePlacesService.parseLocationData(place, placeDetails);
      
      logger.debug('Selected location:', locationData);
      
      // Format location string for the form
      let locationString = locationData.formattedAddress || locationData.address;
      
      // If we have coordinates, use them
      if (locationData.coordinates) {
        locationString = `${locationData.coordinates.lat.toFixed(6)}, ${locationData.coordinates.lng.toFixed(6)}`;
      }
      
      onLocationSelect(locationString, locationData.coordinates);
      onClose();
    } catch (error) {
      logger.error('Error getting place details:', error);
      // Fallback to just using the description
      onLocationSelect(place.description);
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
  };

  if (!visible) return null;

  return (
    <Overlay onClick={handleClose}>
      <ModalContainer onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <Header>
          <Title>Search Location</Title>
          <CloseButton onClick={handleClose}>
            <X size={20} />
          </CloseButton>
        </Header>

        {/* Search Input */}
        <SearchContainer>
          <SearchInputContainer>
            <SearchIcon size={20} />
            <SearchInput
              ref={searchInputRef}
              type="text"
              value={searchText}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search neighborhood, city (e.g. Bushwick, Brooklyn)"
              autoComplete="off"
            />
            {isLoading && <LoadingIcon size={20} />}
          </SearchInputContainer>
        </SearchContainer>

        {/* Search Results */}
        <ResultsContainer>
          {suggestions.length === 0 && searchText.length >= 2 && !isLoading ? (
            <EmptyState>
              No locations found for "{searchText}"
            </EmptyState>
          ) : suggestions.length === 0 && searchText.length < 2 ? (
            <EmptyState>
              Start typing to search for a location
            </EmptyState>
          ) : (
            suggestions.map((place) => {
              // Parse the structured formatting for better display
              const mainText = place.structured_formatting?.main_text || place.description.split(',')[0];
              const secondaryText = place.structured_formatting?.secondary_text || 
                                   place.description.substring(mainText.length + 2);
              
              return (
                <ResultItem
                  key={place.place_id}
                  onClick={() => handleLocationSelect(place)}
                >
                  <ResultIcon>
                    <MapPin />
                  </ResultIcon>
                  <ResultContent>
                    <ResultTitle>{mainText}</ResultTitle>
                    {secondaryText && (
                      <ResultSubtitle>{secondaryText}</ResultSubtitle>
                    )}
                  </ResultContent>
                </ResultItem>
              );
            })
          )}
        </ResultsContainer>
      </ModalContainer>
    </Overlay>
  );
}