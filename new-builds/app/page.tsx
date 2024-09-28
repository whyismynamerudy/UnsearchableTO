'use client';
import React from 'react';
import Map from '@/components/Map';
import SearchBar from '@/components/SearchBar';
import { useState } from 'react';

export default function Home() {
  const [markers, setMarkers] = useState<{ lat: number; lng: number }[]>([]);

  const handleSearch = (query: string) => {
    console.log('Search query:', query);

    const results = query
      ? [
          { lat: 43.65107, lng: -79.347015 },
          { lat: 43.70011, lng: -79.4163 },
          { lat: 43.6419722, lng: -79.3870063 },
        ]
      : [];

    setMarkers(results);
  };
  return (
    <div>
      <SearchBar onSearch={handleSearch} />
      <Map markers={markers} />
    </div>
  );
}
