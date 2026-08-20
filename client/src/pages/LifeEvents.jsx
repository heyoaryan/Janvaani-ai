import React, { useState } from 'react';
import { motion } from 'framer-motion';
import LifeEventCard from '@/components/features/LifeEventCard';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { lifeEvents } from '@/data/schemes';
import { schemes } from '@/data/schemes';

const LifeEvents = () => {
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('all');

  const filteredEvents = categoryFilter === 'all'
    ? lifeEvents
    : lifeEvents.filter(e => {
        const schemeIds = e.schemes;
        return schemeIds.some(id => {
          const scheme = schemes.find(s => s.id === id);
          return scheme?.category === categoryFilter;
        });
      });

  const relatedSchemes = selectedEvent
    ? schemes.filter(s => selectedEvent.schemes.includes(s.id))
    : [];

  const categories = [
    { id: 'all', label: 'All Events' },
    { id: 'education', label: 'Education' },
    { id: 'employment', label: 'Employment' },
    { id: 'healthcare', label: 'Healthcare' },
    { id: 'housing', label: 'Housing' },
    { id: 'agriculture', label: 'Agriculture' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Life Events</h1>
        <p className="text-gray-600">Find schemes based on life milestones</p>
      </div>

      <Card>
        <div className="flex flex-wrap gap-2">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                categoryFilter === cat.id
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredEvents.map((event, i) => (
          <LifeEventCard
            key={event.id}
            event={event}
            onClick={setSelectedEvent}
          />
        ))}
      </div>

      {selectedEvent && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">{selectedEvent.name}</h3>
                <p className="text-gray-600">{selectedEvent.description}</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setSelectedEvent(null)}>
                Close
              </Button>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              These government schemes can help you during this life event:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {relatedSchemes.length > 0 ? (
                relatedSchemes.map(scheme => (
                  <Card key={scheme.id} className="!p-4">
                    <Badge variant="neutral" className="mb-2 capitalize">
                      {scheme.category.replace('-', ' ')}
                    </Badge>
                    <h4 className="font-semibold text-gray-900 mb-1">{scheme.name}</h4>
                    <p className="text-sm text-gray-600 line-clamp-2">{scheme.description}</p>
                    <div className="mt-3">
                      <Badge variant="success" className="text-xs">
                        Available
                      </Badge>
                    </div>
                  </Card>
                ))
              ) : (
                <div className="col-span-full text-center py-8">
                  <p className="text-gray-500">No specific schemes linked to this event yet</p>
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default LifeEvents;
