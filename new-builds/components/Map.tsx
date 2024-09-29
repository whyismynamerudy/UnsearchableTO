import { MarkerDetails } from '@/app/page';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import React from 'react';
import MapSheet from './MapSheet';

interface UserLocation {
  lat: number;
  lng: number;
}

const containerStyle = {
  width: '100%',
  height: '95vh',
};

const center = {
  lat: 43.65107, // Central latitude of Toronto
  lng: -79.347015, // Central longitude of Toronto
};

const torontoBounds = {
  north: 43.855401,
  south: 43.581024,
  west: -79.639219,
  east: -79.116897,
};

const options = {
  restriction: {
    latLngBounds: torontoBounds,
    strictBounds: true,
  },
};

interface MapProps {
  markers?: MarkerDetails[];
}

const Map: React.FC<MapProps> = ({ markers }) => {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey:
      process.env.REACT_APP_GOOGLE_MAPS_API ||
      'AIzaSyBF_kCwkH7r0-45lFxzulNbbqNZGYeLWv8',
  });

  const [map, setMap] = React.useState<google.maps.Map | null>(null);
  const [userLocation, setUserLocation] = React.useState<UserLocation | null>(
    null
  );
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const [selectedContent, setSelectedContent] =
    React.useState<MarkerDetails | null>(null);

  const success = (position: GeolocationPosition) => {
    setUserLocation({
      lat: position.coords.latitude,
      lng: position.coords.longitude,
    });
  };

  const error = (err: GeolocationPositionError) => {
    console.error('Geolocation error:', err);
  };

  const onLoad = React.useCallback((map: google.maps.Map) => {
    map.fitBounds(torontoBounds);
    setMap(map);
  }, []);

  const onUnmount = React.useCallback(() => {
    setMap(null);
  }, []);

  const handleMarkerClick = (content: MarkerDetails) => {
    setSelectedContent(content);
    setIsSheetOpen(true);
  };

  const handleClose = () => {
    setSelectedContent(null);
    setIsSheetOpen(false);
  };

  // Get user location on component mount
  React.useEffect(() => {
    navigator.geolocation.getCurrentPosition(success, error);
  }, []);

  // Panning to user location when userLocation is updated
  React.useEffect(() => {
    if (map && userLocation) {
      const { lat, lng } = userLocation;
      map.setZoom(17);
      map.panTo({ lat, lng });
    }
  }, [map, userLocation, markers]);

  return isLoaded && userLocation ? (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={userLocation || center}
      zoom={14}
      onLoad={onLoad}
      onUnmount={onUnmount}
      options={options}
    >
      {/* Render markers from the provided data */}
      {markers?.map((marker, index) => (
        <Marker
          key={index}
          position={{ lat: marker.latitude, lng: marker.longitude }}
          onClick={() => handleMarkerClick(marker)}
        />
      ))}

      {/* Render user location marker if userLocation is available */}
      {userLocation && (
        <Marker
          position={userLocation}
          icon={{
            url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
          }}
        />
      )}

      {/* Display a sheet for selected marker content */}
      {selectedContent && (
        <MapSheet
          isOpen={isSheetOpen}
          onClose={handleClose}
          content={selectedContent}
        />
      )}
    </GoogleMap>
  ) : (
    <div>Loading...</div>
  );
};

export default React.memo(Map);
