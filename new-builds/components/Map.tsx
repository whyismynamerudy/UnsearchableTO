import { MarkerDetails } from '@/app/page';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import React from 'react';
import MapSheet from './MapSheet';

interface UserLocation {
  lat: number;
  lng: number;
}

const libraries: ("visualization")[] = ["visualization"];

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
  heatmapData?: [number, number, number][];
}

const Map: React.FC<MapProps> = ({ markers, heatmapData }) => {
  const [showMarkers, setShowMarkers] = React.useState(true);
  const [showHeatmap, setShowHeatmap] = React.useState(true);
  const [map, setMap] = React.useState<google.maps.Map | null>(null); // eslint-disable-line
  const [heatmap, setHeatmap] = React.useState<google.maps.visualization.HeatmapLayer | null>(null);
  const [userLocation, setUserLocation] = React.useState<UserLocation | null>(null);
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const [selectedContent, setSelectedContent] = React.useState<MarkerDetails | null>(null);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey:
      process.env.REACT_APP_GOOGLE_MAPS_API ||
      'AIzaSyBF_kCwkH7r0-45lFxzulNbbqNZGYeLWv8',
    libraries: libraries,
  });

  const processedHeatmapData = React.useMemo(() => 
    heatmapData?.map(([lat, lng, weight]) => ({
      location: new google.maps.LatLng(lat, lng),
      weight: weight
    })) || [],
  [heatmapData]);

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

    const heatmapLayer = new google.maps.visualization.HeatmapLayer({
      data: processedHeatmapData,
      map: showHeatmap ? map : null,
    });
    setHeatmap(heatmapLayer);
  }, [processedHeatmapData, showHeatmap]);

  const onUnmount = React.useCallback(() => {
    if (heatmap) {
      heatmap.setMap(null);
    }
    setMap(null);
    setHeatmap(null);
  }, [heatmap]);

  const handleMarkerClick = (content: MarkerDetails) => {
    setSelectedContent(content);
    setIsSheetOpen(true);
  };

  const handleClose = () => {
    setSelectedContent(null);
    setIsSheetOpen(false);
  };

  React.useEffect(() => {
    navigator.geolocation.getCurrentPosition(success, error);
  }, []);

  React.useEffect(() => {
    if (map && userLocation) {
      const { lat, lng } = userLocation;
      map.setZoom(17);
      map.panTo({ lat, lng });
    }
  }, [map, userLocation, markers]);

  React.useEffect(() => {
    if (heatmap) {
      heatmap.setMap(showHeatmap ? map : null);
    }
  }, [showHeatmap, heatmap, map]);

  return isLoaded && userLocation ? (
    <div>
      <div>
        <label>
          <input
            type="checkbox"
            checked={showMarkers}
            onChange={(e) => setShowMarkers(e.target.checked)}
          />
          Show Markers
        </label>
        <label>
          <input
            type="checkbox"
            checked={showHeatmap}
            onChange={(e) => setShowHeatmap(e.target.checked)}
          />
          Show Heatmap
        </label>
      </div>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={userLocation || center}
        zoom={14}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={options}
      >
        {showMarkers && markers?.map((marker, index) => (
          <Marker
            key={index}
            position={{ lat: marker.latitude, lng: marker.longitude }}
            onClick={() => handleMarkerClick(marker)}
          />
        ))}
        {userLocation && (
          <Marker
            position={userLocation}
            icon={{
              url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
            }}
          />
        )}
        {selectedContent && (
          <MapSheet
            isOpen={isSheetOpen}
            onClose={handleClose}
            content={selectedContent}
          />
        )}
      </GoogleMap>
    </div>
  ) : (
    <div>Loading...</div>
  );
};

export default React.memo(Map);
