import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

interface SearchBarProps {
  onSearch: (query: string) => void;
}

const samplePrompts = [
  'Bench next to tree',
  'Construction sites',
  'Homeless People',
  'Toilets',
  'Street Art',
];

export default function SearchBar({ onSearch }: SearchBarProps) {
  const [query, setQuery] = useState('');

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    onSearch(query);
  };

  const handleSelect = (prompt: string) => {
    setQuery(prompt);
    onSearch(prompt); // Trigger search immediately when a prompt is selected
  };

  return (
    <div className='absolute'>
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
              className='pl-10 pr-4 py-3 w-full text-sm md:text-base bg-white text-gray-800 border-gray-300 rounded-lg'
              style={{ fontSize: '16px' }}
            />
          </div>

          <Button
            type='submit'
            className='bg-[#4fd1c5] hover:bg-[#48a198] text-gray-700 font-semibold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#38a89d] focus:ring-opacity-50'
          >
            Search
          </Button>
        </div>
      </form>

      {/* Sample Prompts as Buttons in One Line */}
      <div className='flex flex-row mt-4 justify-center space-x-2'>
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
    </div>
  );
}
