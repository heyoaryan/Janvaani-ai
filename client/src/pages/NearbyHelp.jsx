import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Phone, Clock, Navigation, Filter } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

const nearbyOffices = [
  {
    id: 1,
    name: 'District Collectorate Office',
    type: 'Government Office',
    address: 'Rajpath Road, New Delhi',
    distance: '2.3 km',
    hours: 'Mon-Fri, 10:00 AM - 5:00 PM',
    phone: '+91 11 2345 6789',
    services: ['Certificate Issuance', 'Scheme Enrollment', 'Grievance Redressal'],
  },
  {
    id: 2,
    name: 'Common Service Centre (CSC)',
    type: 'CSC Center',
    address: 'Main Market, Connaught Place',
    distance: '1.8 km',
    hours: 'Mon-Sat, 9:00 AM - 6:00 PM',
    phone: '+91 11 9876 5432',
    services: ['Aadhaar Services', 'PAN Card', 'Document Upload'],
  },
  {
    id: 3,
    name: 'Jan Aadhaar Kendra',
    type: 'Aadhaar Center',
    address: 'Karol Bagh, New Delhi',
    distance: '3.5 km',
    hours: 'Mon-Sat, 10:00 AM - 5:00 PM',
    phone: '+91 11 8765 4321',
    services: ['Aadhaar Enrollment', 'Update', 'Download Aadhaar'],
  },
  {
    id: 4,
    name: 'Labour Department Office',
    type: 'Labour Office',
    address: 'Shastri Bhawan, New Delhi',
    distance: '4.1 km',
    hours: 'Mon-Fri, 11:00 AM - 4:00 PM',
    phone: '+91 11 7654 3210',
    services: ['Employment Schemes', 'Skill Training', 'Job Placement'],
  },
  {
    id: 5,
    name: 'Agriculture Extension Office',
    type: 'Agriculture Office',
    address: 'Krishi Bhawan, New Delhi',
    distance: '5.2 km',
    hours: 'Mon-Fri, 10:00 AM - 5:00 PM',
    phone: '+91 11 6543 2109',
    services: ['Farmer Schemes', 'Crop Insurance', 'Subsidy'],
  },
];

const serviceTypes = [
  { id: 'all', label: 'All Services' },
  { id: 'Government Office', label: 'Government Office' },
  { id: 'CSC Center', label: 'CSC Center' },
  { id: 'Aadhaar Center', label: 'Aadhaar Center' },
  { id: 'Labour Office', label: 'Labour Office' },
  { id: 'Agriculture Office', label: 'Agriculture Office' },
];

const NearbyHelp = () => {
  const [location, setLocation] = useState('New Delhi, India');
  const [serviceFilter, setServiceFilter] = useState('all');

  const filteredOffices = serviceFilter === 'all'
    ? nearbyOffices
    : nearbyOffices.filter(o => o.type === serviceFilter);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Nearby Help</h1>
        <p className="text-gray-600">Find government offices and service centers near you</p>
      </div>

      <Card>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Enter your location..."
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <Button variant="primary">Find Nearby</Button>
        </div>
      </Card>

      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
        {serviceTypes.map(type => (
          <button
            key={type.id}
            onClick={() => setServiceFilter(type.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
              serviceFilter === type.id
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {type.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-gray-100 rounded-2xl h-64 sm:h-72 lg:h-full min-h-[250px] sm:min-h-[300px] flex items-center justify-center order-1 lg:order-none">
          <div className="text-center p-4">
            <MapPin className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500 text-sm sm:text-base">Map view would appear here</p>
            <p className="text-xs sm:text-sm text-gray-400">Integrated with Google Maps or Mapbox</p>
          </div>
        </div>

        <div className="space-y-4 max-h-[500px] overflow-y-auto order-2 lg:order-none">
          {filteredOffices.map((office, i) => (
            <motion.div
              key={office.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card>
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900">{office.name}</h3>
                    <Badge variant="neutral" className="mt-1">{office.type}</Badge>
                  </div>
                  <span className="text-sm font-medium text-primary-600 flex-shrink-0">{office.distance}</span>
                </div>
                <div className="space-y-2 mb-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    {office.address}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    {office.hours}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    {office.phone}
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 mb-3">
                  {office.services.map(service => (
                    <Badge key={service} variant="info" className="text-xs">{service}</Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" icon={Navigation}>
                    Get Directions
                  </Button>
                  <Button variant="primary" size="sm" className="flex-1" icon={Phone}>
                    Call
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NearbyHelp;
