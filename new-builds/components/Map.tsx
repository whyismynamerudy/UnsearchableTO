import { MarkerDetails } from '@/app/page';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import React from 'react';
import MapSheet from './MapSheet';

interface UserLocation {
  lat: number;
  lng: number;
}

const libraries: 'visualization'[] = ['visualization'];

const containerStyle = {
  width: '100%',
  height: '95vh',
};

const center = {
  lat: 43.65107, // Central latitude of Toronto
  lng: -79.347015, // Central longitude of Toronto
};
const torontoBounds = {
  north: 43.71123, // No change
  south: 43.597099, // No change
  west: -79.501348, // Decreased west by ~4km (total ~8km)
  east: -79.276574, // Increased east by ~4km (total ~8km)
};
const options = {
  restriction: {
    latLngBounds: torontoBounds,
    strictBounds: true,
  },
  mapTypeId: 'satellite',
  zoomControl: false,
  streetViewControl: false,
  fullscreenControl: false,
  mapTypeControl: false,
  pitchControl: false,
  rotateControl: false,
};

interface MapProps {
  markers?: MarkerDetails[];
  heatmapData?: [number, number, number][];
  showHeatmap: boolean;
  showMarkers: boolean;
}

const Map: React.FC<MapProps> = ({
  markers,
  heatmapData,
  showHeatmap,
  showMarkers,
}) => {
  const [map, setMap] = React.useState<google.maps.Map | null>(null);
  const [heatmap, setHeatmap] =
    React.useState<google.maps.visualization.HeatmapLayer | null>(null);
  const [userLocation, setUserLocation] = React.useState<UserLocation | null>(
    null
  );
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const [selectedContent, setSelectedContent] =
    React.useState<MarkerDetails | null>(null);
  const [zoom, setZoom] = React.useState(10);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey:
      process.env.REACT_APP_GOOGLE_MAPS_API ||
      'AIzaSyBF_kCwkH7r0-45lFxzulNbbqNZGYeLWv8',
    libraries: libraries,
  });

  const processedHeatmapData = React.useMemo(() => {
    if (!heatmapData) return [];

    // Find the min and max weight
    const weights = heatmapData.map(([, , weight]) => weight);
    const minWeight = Math.min(...weights);
    const maxWeight = Math.max(...weights);

    // Rescale the weights in the original array
    return heatmapData.map(([lat, lng, weight]) => {
      // Rescale the weight
      const newWeight =
        maxWeight === minWeight
          ? 1 // Prevent division by zero if all weights are the same
          : (weight - minWeight) / (maxWeight - minWeight);

      // Return as a WeightedLocation object
      return {
        location: new google.maps.LatLng(lat, lng),
        weight: newWeight + 0.2,
      } as google.maps.visualization.WeightedLocation; // Type assertion
    });
  }, [heatmapData]);

  const success = (position: GeolocationPosition) => {
    setUserLocation({
      lat: position.coords.latitude,
      lng: position.coords.longitude,
    });
  };

  const error = (err: GeolocationPositionError) => {
    console.error('Geolocation error:', err);
  };

  const onLoad = React.useCallback(
    (map: google.maps.Map) => {
      map.fitBounds(torontoBounds);
      setMap(map);

      const heatmapLayer = new google.maps.visualization.HeatmapLayer({
        data: processedHeatmapData,
        map: showHeatmap ? map : null,
      });
      setHeatmap(heatmapLayer);
    },
    [processedHeatmapData, showHeatmap]
  );

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

  const updateHeatmap = React.useCallback(() => {
    if (map && heatmap) {
      const bounds = map.getBounds();
      const zoom = map.getZoom();
      setZoom(zoom || 10);

      if (bounds) {
        const ne = bounds.getNorthEast();
        const sw = bounds.getSouthWest();

        const visiblePoints = processedHeatmapData.filter((point) => {
          const lat = point.location?.lat();
          const lng = point.location?.lng();
          if (lat === undefined || lng === undefined) return false;
          return (
            lat <= ne.lat() &&
            lat >= sw.lat() &&
            lng <= ne.lng() &&
            lng >= sw.lng()
          );
        });

        heatmap.setData(visiblePoints);

        // Adjust radius and opacity based on zoom level
        const radius = Math.max(20, Math.min(100, (zoom ?? 10) * 4)); // Default zoom to 10 if undefined
        const opacity = Math.max(0.4, Math.min(0.8, (zoom ?? 10) / 22));

        heatmap.setOptions({
          radius: radius,
          opacity: opacity,
        });
      }
    }
  }, [map, heatmap, processedHeatmapData]);

  React.useEffect(() => {
    navigator.geolocation.getCurrentPosition(success, error);
  }, []);

  React.useEffect(() => {
    if (map && userLocation) {
      const { lat, lng } = userLocation;
      map.setZoom(10);
      map.panTo({ lat, lng });
    }
  }, [map, userLocation, markers]);

  React.useEffect(() => {
    if (heatmap) {
      heatmap.setMap(showHeatmap ? map : null);
    }
  }, [showHeatmap, heatmap, map]);

  React.useEffect(() => {
    if (map) {
      map.addListener('idle', updateHeatmap);
      return () => {
        google.maps.event.clearListeners(map, 'idle');
      };
    }
  }, [map, updateHeatmap]);

  return isLoaded && userLocation ? (
    <div>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={userLocation || center}
        zoom={zoom}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={options}
      >
        {showMarkers &&
          markers?.map((marker, index) => (
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
              url: 'http://maps.google.com/mapfiles/ms/icons/yellow-dot.png',
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
    <div className='absolute inset-0 flex justify-center items-center z-10'>
      <div className='animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#4fd1c5]'></div>
    </div>
  );
};

export default React.memo(Map);
