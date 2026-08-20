import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Search, CheckSquare, FileText, ClipboardList, MessageSquare, Users, Calendar, MapPin, Shield, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import VoiceButton from '@/components/voice/VoiceButton';
import JourneyFlow from '@/components/features/JourneyFlow';
import SchemeCard from '@/components/features/SchemeCard';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { schemes } from '@/data/schemes';
import { useVoice } from '@/contexts/VoiceContext';
import { useAuth } from '@/contexts/AuthContext';

const quickActions = [
  { path: '/schemes', icon: Search, label: 'Find Schemes', labelHi: 'योजनाएं खोजें', color: 'bg-blue-100 text-blue-600', desc: 'Discover schemes by speaking or searching' },
  { path: '/eligibility', icon: CheckSquare, label: 'Check Eligibility', labelHi: 'पात्रता जांच', color: 'bg-green-100 text-green-600', desc: 'Know if you qualify for any scheme' },
  { path: '/documents', icon: FileText, label: 'Check Documents', labelHi: 'दस्तावेज जांचें', color: 'bg-purple-100 text-purple-600', desc: 'Upload and verify your documents' },
  { path: '/missing-docs', icon: ClipboardList, label: 'What Am I Missing?', labelHi: 'मैं क्या गुमां हूं?', color: 'bg-amber-100 text-amber-600', desc: 'Find out what documents you need' },
  { path: '/application-copilot', icon: MessageSquare, label: 'App Co-Pilot', labelHi: 'एप को-पायलट', color: 'bg-indigo-100 text-indigo-600', desc: 'Step-by-step application guidance' },
  { path: '/family-benefits', icon: Users, label: 'Family Benefits', labelHi: 'पारिवारिक लाभ', color: 'bg-pink-100 text-pink-600', desc: 'Benefits for your entire family' },
  { path: '/life-events', icon: Calendar, label: 'Life Events', labelHi: 'जीवन के कार्यक्रम', color: 'bg-orange-100 text-orange-600', desc: 'Schemes based on your life milestones' },
  { path: '/nearby-help', icon: MapPin, label: 'Nearby Help', labelHi: 'पास की मदद', color: 'bg-teal-100 text-teal-600', desc: 'Find government offices near you' },
  { path: '/scam-check', icon: Shield, label: 'Scam Check', labelHi: 'स्कैम जांच', color: 'bg-red-100 text-red-600', desc: 'Check if a message is a scam' },
];

const Dashboard = () => {
  const { user } = useAuth();
  const { lastResponse } = useVoice();
  const [searchQuery, setSearchQuery] = useState('');
  const recommendedSchemes = useMemo(() => {
    return schemes.slice(0, 3).map(s => ({ ...s, matchPercentage: 85 + Math.floor(Math.random() * 15) }));
  }, []);
  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];

    const directMatches = schemes.filter(scheme => {
      const searchableText = [
        scheme.name,
        scheme.description,
        scheme.category,
        ...(scheme.keywords || []),
      ].join(' ').toLowerCase();
      return searchableText.includes(query);
    });

    if (directMatches.length > 0) return directMatches;

    const suggestedIds = new Set(
      (lastResponse?.suggestedSchemes || []).map(scheme => String(scheme.id))
    );
    return schemes.filter(scheme => suggestedIds.has(String(scheme.id)));
  }, [lastResponse, searchQuery]);

  return (
    <div className="mx-auto max-w-6xl space-y-10 pb-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-saffron-50 text-saffron-700 text-sm font-medium mb-4"
        >
          <Sparkles className="w-4 h-4" />
          Your government services desk
        </motion.div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-3 tracking-tight text-balance">
          {user.name ? `Namaste ${user.name}!` : 'How can we help you'}
          {user.name ? '' : <span className="text-primary-600"> today?</span>}
        </h1>
        <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto text-balance">
          {user.occupation
            ? `As a ${user.occupation}, discover government schemes tailored for you. Speak in Hindi or English to get started.`
            : 'Speak in Hindi or English to discover government schemes, check eligibility, and get guided help — all in your voice.'}
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col items-center gap-6"
      >
        <VoiceButton size="lg" onTranscript={(text) => { setSearchQuery(text); }} />

        <div className="w-full max-w-xl relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search schemes, services... (e.g., 'scholarship for student')"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.currentTarget.blur();
            }}
            className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-base text-center"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
            >
              <Search className="w-4 h-4" />
            </button>
          )}
        </div>
      </motion.div>

      {searchQuery.trim() && (
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <Card className="border-primary-100 bg-primary-50/40">
            <h2 className="text-xl font-bold text-gray-900">Search Results</h2>
            <p className="text-sm text-gray-600 mt-1 mb-5">
              {searchResults.length
                ? `${searchResults.length} scheme${searchResults.length === 1 ? '' : 's'} found for “${searchQuery}”`
                : `No schemes found for “${searchQuery}”`}
            </p>
            {searchResults.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-left">
                {searchResults.slice(0, 6).map((scheme) => (
                  <SchemeCard key={scheme.id} scheme={scheme} matchPercentage={90} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Try saying or typing “student scholarship” or “farmer scheme”.</p>
            )}
          </Card>
        </motion.section>
      )}

      {lastResponse?.response && (
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <Card className="border-green-200 bg-green-50/60">
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-green-100 text-green-700 flex items-center justify-center">
                <MessageSquare className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">JanVaani ka jawab</h2>
              <p className="max-w-2xl text-gray-700 leading-relaxed">{lastResponse.response}</p>
              {lastResponse.category && (
                <p className="text-xs font-semibold uppercase tracking-wide text-green-700">
                  {lastResponse.category} · {lastResponse.suggestedSchemes?.length || 0} relevant schemes
                </p>
              )}
            </div>
          </Card>
        </motion.section>
      )}

      <Card className="bg-white border-gray-200 text-center shadow-sm">
        <div className="flex items-center justify-center mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900">What do you need today?</h3>
            <p className="text-sm text-gray-600 mt-1">Choose what you need help with</p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {quickActions.map((action, i) => (
            <motion.div
              key={action.path}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.05 }}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link
                to={action.path}
                className="flex flex-col items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-2xl bg-white hover:bg-gray-50 border border-gray-100 hover:border-primary-200 hover:shadow-md transition-all block group"
              >
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center ${action.color} group-hover:scale-110 transition-transform`}>
                  <action.icon className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div className="text-center">
                  <span className="text-xs sm:text-sm font-semibold text-gray-900 block">{action.label}</span>
                  <span className="text-[10px] sm:text-xs text-gray-500 hidden sm:block">{action.desc}</span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </Card>

      <section>
        <div className="flex flex-col items-center text-center mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Recommended For You</h3>
            <p className="text-sm text-gray-600 mt-1">Based on your profile and interests</p>
          </div>
          <Link to="/schemes">
            <Button variant="ghost" size="sm" icon={ArrowRight}>
              View All
            </Button>
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {recommendedSchemes.map((scheme, i) => (
            <motion.div
              key={scheme.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.1 }}
            >
              <SchemeCard scheme={scheme} matchPercentage={scheme.matchPercentage} />
            </motion.div>
          ))}
        </div>
      </section>

      <section>
        <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">Your Journey with JanVaani AI</h3>
        <Card>
          <JourneyFlow />
        </Card>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100 text-center">
          <div className="flex flex-col items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <h4 className="font-semibold text-gray-900">Family Benefits</h4>
          </div>
          <p className="text-sm text-gray-600 mb-3">Discover schemes for your entire household at once.</p>
          <Link to="/family-benefits">
            <Button variant="outline" size="sm" className="w-full">Explore</Button>
          </Link>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-white border-green-100 text-center">
          <div className="flex flex-col items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-green-100 text-green-600 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <h4 className="font-semibold text-gray-900">Stay Safe</h4>
          </div>
          <p className="text-sm text-gray-600 mb-3">Check messages and links for potential scams.</p>
          <Link to="/scam-check">
            <Button variant="outline" size="sm" className="w-full">Check Now</Button>
          </Link>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-100 text-center">
          <div className="flex flex-col items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
              <MapPin className="w-5 h-5" />
            </div>
            <h4 className="font-semibold text-gray-900">Nearby Help</h4>
          </div>
          <p className="text-sm text-gray-600 mb-3">Find government offices and help centers near you.</p>
          <Link to="/nearby-help">
            <Button variant="outline" size="sm" className="w-full">Find Offices</Button>
          </Link>
        </Card>
      </section>
    </div>
  );
};

export default Dashboard;
