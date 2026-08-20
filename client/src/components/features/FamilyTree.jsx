import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, User, UserPlus, Sparkles, ChevronRight } from 'lucide-react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Progress from '@/components/ui/Progress';

const FamilyTree = ({ members = [], onAddMember, onAnalyze, totalBenefits = 0, isAnalyzing = false }) => {
  const [selectedMember, setSelectedMember] = useState(null);

  const getBenefitColor = (count) => {
    if (count === 0) return 'bg-gray-100 text-gray-600';
    if (count <= 2) return 'bg-green-100 text-green-700';
    if (count <= 4) return 'bg-blue-100 text-blue-700';
    return 'bg-primary-100 text-primary-700';
  };

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Family Members</h3>
            <p className="text-sm text-gray-600">
              {members.length} member{members.length !== 1 ? 's' : ''} in your family profile
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onAddMember} icon={UserPlus}>
              Add Member
            </Button>
            <Button variant="primary" size="sm" onClick={onAnalyze} icon={Sparkles} loading={isAnalyzing}>
              Analyze Benefits
            </Button>
          </div>
        </div>

        {members.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No family members added yet</p>
            <Button onClick={onAddMember} icon={UserPlus}>
              Add Your First Member
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {members.map((member, i) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                onClick={() => setSelectedMember(member)}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  selectedMember?.id === member.id
                    ? 'border-primary-500 bg-primary-50 shadow-md'
                    : 'border-gray-200 hover:border-primary-300 hover:shadow-sm'
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-lg">
                    {member.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{member.name}</p>
                    <p className="text-sm text-gray-500">{member.relation} • {member.age} yrs</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{member.occupation}</span>
                  <Badge variant={member.benefitsCount > 0 ? 'success' : 'neutral'} className="text-xs">
                    {member.benefitsCount} scheme{member.benefitsCount !== 1 ? 's' : ''}
                  </Badge>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </Card>

      {selectedMember && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <h4 className="font-semibold text-gray-900 mb-4">
              Benefits for {selectedMember.name}
            </h4>
            <div className="space-y-3">
              {selectedMember.benefits?.length > 0 ? (
                selectedMember.benefits.map((benefit, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center justify-between p-3 rounded-lg bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-700">{benefit.name}</span>
                    </div>
                    <Badge variant="success" className="text-xs">Available</Badge>
                  </motion.div>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                  Click "Analyze Benefits" to discover schemes for this member
                </p>
              )}
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default FamilyTree;
