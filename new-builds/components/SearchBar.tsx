import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

interface SearchBarProps {
  onSearch: (query: string) => void;
}

export default function SearchBar({ onSearch }: SearchBarProps) {
  const [query, setQuery] = useState('');

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    onSearch(query);
  };

  return (
    <form onSubmit={handleSearch} className='w-full max-w-2xl mx-auto'>
      <div className='flex items-center space-x-2'>
        <div className='relative flex-grow'>
          <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400' />
          <Input
            type='text'
            placeholder='Search locations...'
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className='pl-10 pr-4 py-3 w-full text-sm md:text-base bg-[#2d3748] text-white border-gray-400 rounded-lg'
          />
        </div>
        <Button
          type='submit'
          className='bg-[#f7fafc] hover:bg-[#e2e8f0] text-[#1a202c] font-semibold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#38a89d] focus:ring-opacity-50'
        >
          Search
        </Button>
      </div>
    </form>
  );
}
