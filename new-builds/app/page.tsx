'use client';

import React, { useState } from 'react';
import Map from '@/components/Map';
import SearchBar from '@/components/SearchBar';
import CameraUpload from '@/components/CameraUpload';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

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

export interface SearchResults {
  results: MarkerDetails[];
  heatmap_data: [number, number, number][];
}

export default function Home() {
  const [markers, setMarkers] = useState<MarkerDetails[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [heatmapData, setHeatmapData] = useState<[number, number, number][]>(
    []
  );

  const handleSearch = async (query: string) => {
    console.log('Search query:', query);

    if (!query) {
      setMarkers([]);
      setHeatmapData([]);
      return;
    }

    setIsLoading(true);
    setError(null);

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

      setMarkers(results.results);
      setHeatmapData(results.heatmap_data);
    } catch (error) {
      console.error('Error fetching markers:', error);
      setError('Failed to fetch markers. Please try again.');
      setMarkers([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='min-h-screen bg-[#1a202c] text-[#e2e8f0]'>
      <header className='bg-[#2d3748] shadow-lg'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6'>
          <h1 className='text-3xl font-bold text-white'>TorontoVision</h1>
        </div>
      </header>
      <main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12'>
        <div className='space-y-8'>
          <SearchBar onSearch={handleSearch} />

          {error && (
            <Alert
              variant='destructive'
              className='bg-red-900/50 border-red-700'
            >
              <AlertCircle className='h-5 w-5 text-red-400' />
              <AlertTitle className='text-red-400 font-semibold'>
                Error
              </AlertTitle>
              <AlertDescription className='text-red-200'>
                {error}
              </AlertDescription>
            </Alert>
          )}

          {isLoading ? (
            <div className='flex justify-center items-center h-64'>
              <div className='animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#4fd1c5]'></div>
            </div>
          ) : (
            <div className='bg-[#2d3748] shadow-xl rounded-xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-[#4fd1c5]/20'>
              <Map markers={markers} heatmapData={heatmapData} />
            </div>
          )}

          <div className='sm:hidden'>
            <CameraUpload />
          </div>
        </div>
      </main>
    </div>
  );
}
