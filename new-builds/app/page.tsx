'use client';
import React, { useState } from 'react';
import Map from '@/components/Map';
import SearchBar from '@/components/SearchBar';
import CameraUpload from '@/components/CameraUpload';

export interface MarkerDetails {
  image_id: string;
  longitude: number;
  latitude: number;
  heading: number;
  pitch: number;
  captured_at: string;
  fov: number;
  image_url: string;
  description: string | null;
}

export default function Home() {
  const [markers, setMarkers] = useState<MarkerDetails[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (query: string) => {
    console.log('Search query:', query);

    if (!query) {
      setMarkers([]); // Clear markers if the query is empty
      return;
    }

    try {
      const response = await fetch(
        `https://new-builds-2024-818004117691.us-central1.run.app/search?q=${encodeURIComponent(
          query
        )}`
      );
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const results = await response.json();

      // Shuffle the results array and select the first 10 markers
      const shuffledResults = results.sort(() => 0.5 - Math.random());
      const randomMarkers = shuffledResults.slice(0, 10);

      setMarkers(randomMarkers);
      setError(null);
    } catch (error) {
      console.error('Error fetching markers:', error);
      setError('Failed to fetch markers. Please try again.');
      setMarkers([]);
    }
  };

  return (
    <div>
      <SearchBar onSearch={handleSearch} />
      {error && <p className='text-red-500'>{error}</p>}

      <Map markers={markers} />
      <div className='block sm:hidden'>
        <CameraUpload />
      </div>
    </div>
  );
}
