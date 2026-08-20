import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, Mic, SlidersHorizontal, X } from 'lucide-react';
import { schemes, categories } from '@/data/schemes';
import SchemeCard from '@/components/features/SchemeCard';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { useVoice } from '@/contexts/VoiceContext';

const SchemeFinder = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const { isListening, transcript, interimTranscript, startListening, stopListening } = useVoice();

  const filteredSchemes = useMemo(() => {
    return schemes.filter(scheme => {
      const matchesSearch = !searchQuery ||
        scheme.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        scheme.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        scheme.keywords.some(k => k.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = selectedCategory === 'all' || scheme.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  React.useEffect(() => {
    if (transcript) setSearchQuery(transcript);
  }, [transcript]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Find Schemes</h1>
        <p className="text-sm sm:text-base text-gray-600">Discover government schemes tailored for you</p>
      </div>

      <Card>
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, category, or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant={isListening ? 'danger' : 'outline'}
              onClick={isListening ? stopListening : startListening}
              icon={Mic}
              className="flex-1 sm:flex-none"
            >
              {isListening ? 'Stop' : 'Voice'}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              icon={SlidersHorizontal}
              className="flex-1 sm:flex-none"
            >
              Filters
            </Button>
          </div>
        </div>

        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="mt-4 pt-4 border-t border-gray-100"
          >
            <p className="text-sm font-medium text-gray-700 mb-2">Categories</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  selectedCategory === 'all'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all capitalize ${
                    selectedCategory === cat.id
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </Card>

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Showing <span className="font-semibold text-gray-900">{filteredSchemes.length}</span> scheme{filteredSchemes.length !== 1 ? 's' : ''}
        </p>
      </div>

      {isListening && (
        <Card>
          <div className="flex items-center gap-2 mb-2">
            <Mic className="w-4 h-4 text-red-500" />
            <span className="text-sm font-medium text-gray-700">Listening...</span>
          </div>
          <div className="flex items-center gap-1 h-6">
            {[0, 1, 2, 3, 4].map((i) => (
              <motion.div
                key={i}
                className="w-1 bg-primary-600 rounded-full"
                animate={{ height: ['20%', '80%', '20%'] }}
                transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.1 }}
              />
            ))}
          </div>
          <p className="text-sm text-gray-600 mt-2 min-h-[24px]">
            {interimTranscript || 'Speak now...'}
          </p>
        </Card>
      )}

      {filteredSchemes.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSchemes.map((scheme, i) => (
            <SchemeCard
              key={scheme.id}
              scheme={scheme}
              matchPercentage={70 + Math.floor(Math.random() * 30)}
            />
          ))}
        </div>
      ) : (
        <Card>
          <div className="text-center py-12">
            <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No schemes found matching your criteria</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
            >
              Clear Filters
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default SchemeFinder;
