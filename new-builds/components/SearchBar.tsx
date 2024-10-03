'use client';

import { useState } from 'react';
import { Search, ChevronDown, ChevronUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface SearchBarProps {
  onSearch: (query: string) => void;
}

export default function SearchBar({ onSearch }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const samplePrompts = [
    'Benches Next To a Tree',
    'Rusty Bridge',
    'Pride Flag',
    'Violet Flowers',
    'Street Art',
    'Ghostbusters',
  ];

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    onSearch(query);
  };

  const handleSelect = (prompt: string) => {
    setQuery(prompt);
    onSearch(prompt);
    setIsDropdownOpen(false);
  };

  return (
    <div className='relative w-full px-4 md:px-6'>
      <form
        onSubmit={handleSearch}
        className='relative w-full max-w-2xl mx-auto'
      >
        <div className='flex items-center space-x-2'>
          <div className='relative flex-grow'>
            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500' />
            <Input
              type='text'
              placeholder='Search locations...'
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className='pl-10 pr-4 py-2 w-full text-sm md:text-lg bg-white text-gray-800 border-gray-300 rounded-lg'
            />
          </div>
          <Button
            type='submit'
            className='bg-[#4fd1c5] hover:bg-[#48a198] text-gray-700 font-semibold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#38a89d] focus:ring-opacity-50'
          >
            Search
          </Button>
          <Button
            type='button'
            variant='outline'
            size='icon'
            className='md:hidden'
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            {isDropdownOpen ? (
              <ChevronUp className='h-4 w-4' />
            ) : (
              <ChevronDown className='h-4 w-4' />
            )}
          </Button>
        </div>

        {/* Dropdown for small screens */}
        {isDropdownOpen && (
          <div className='md:hidden mt-2 bg-white border border-gray-300 rounded-lg shadow-lg'>
            {samplePrompts.map((prompt, index) => (
              <button
                key={index}
                onClick={() => handleSelect(prompt)}
                className='block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100'
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        {/* Sample prompts for larger screens */}
        <div className='hidden md:flex flex-row mt-4 justify-center space-x-2'>
          {samplePrompts.map((prompt, index) => (
            <Button
              key={index}
              type='button'
              onClick={() => handleSelect(prompt)}
              className='w-full bg-[#f7fafc] hover:bg-[#e2e8f0] text-gray-800 font-semibold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:bg-[#4fd1c5] focus:ring-2 focus:ring-[#38a89d] focus:ring-opacity-50'
            >
              {prompt}
            </Button>
          ))}
        </div>
      </form>
    </div>
  );
}
