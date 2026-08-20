import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, UserPlus, Sparkles } from 'lucide-react';
import FamilyTree from '@/components/features/FamilyTree';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

const FamilyBenefits = () => {
  const [members, setMembers] = useState([
    { id: 1, name: 'Aarav Sharma', relation: 'Self', age: 21, gender: 'male', occupation: 'student', income: 0, benefitsCount: 3 },
    { id: 2, name: 'Priya Sharma', relation: 'Mother', age: 45, gender: 'female', occupation: 'homemaker', income: 0, benefitsCount: 2 },
    { id: 3, name: 'Raj Sharma', relation: 'Father', age: 50, gender: 'male', occupation: 'farmer', income: 150000, benefitsCount: 4 },
  ]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  const [newMember, setNewMember] = useState({
    name: '', relation: '', age: '', gender: 'male', occupation: '', income: '',
  });

  const handleAddMember = () => {
    if (!newMember.name || !newMember.relation) return;
    setMembers(prev => [...prev, {
      id: Date.now(),
      ...newMember,
      age: parseInt(newMember.age) || 0,
      income: parseInt(newMember.income) || 0,
      benefitsCount: 0,
    }]);
    setNewMember({ name: '', relation: '', age: '', gender: 'male', occupation: '', income: '' });
    setShowAddForm(false);
  };

  const handleAnalyze = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setMembers(prev => prev.map(m => ({
        ...m,
        benefitsCount: Math.floor(Math.random() * 6) + 1,
        benefits: [
          { name: 'PM-Kisan', status: 'available' },
          { name: 'PM Awas Yojana', status: 'available' },
          { name: 'Health Insurance', status: 'available' },
        ].slice(0, Math.floor(Math.random() * 3) + 1),
      })));
      setIsAnalyzing(false);
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Family Benefits Finder</h1>
        <p className="text-gray-600">Discover schemes for your entire family</p>
      </div>

      <FamilyTree
        members={members}
        onAddMember={() => setShowAddForm(!showAddForm)}
        onAnalyze={handleAnalyze}
        isAnalyzing={isAnalyzing}
      />

      {showAddForm && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <h3 className="font-semibold text-gray-900 mb-4">Add Family Member</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Name</label>
                <input
                  type="text"
                  value={newMember.name}
                  onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Relation</label>
                <input
                  type="text"
                  value={newMember.relation}
                  onChange={(e) => setNewMember({ ...newMember, relation: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Age</label>
                <input
                  type="number"
                  value={newMember.age}
                  onChange={(e) => setNewMember({ ...newMember, age: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Gender</label>
                <select
                  value={newMember.gender}
                  onChange={(e) => setNewMember({ ...newMember, gender: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Occupation</label>
                <input
                  type="text"
                  value={newMember.occupation}
                  onChange={(e) => setNewMember({ ...newMember, occupation: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Income</label>
                <input
                  type="number"
                  value={newMember.income}
                  onChange={(e) => setNewMember({ ...newMember, income: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 mt-4">
              <Button onClick={handleAddMember} icon={UserPlus} className="w-full sm:w-auto">Add Member</Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)} className="w-full sm:w-auto">Cancel</Button>
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default FamilyBenefits;
