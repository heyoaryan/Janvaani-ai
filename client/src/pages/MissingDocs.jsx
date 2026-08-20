import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Download, Printer, CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import { schemes, documents } from '@/data/schemes';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import DocumentChecklist from '@/components/features/DocumentChecklist';
import { Link } from 'react-router-dom';

const MissingDocs = () => {
  const [selectedSchemeId, setSelectedSchemeId] = useState('');
  const [uploadedDocs, setUploadedDocs] = useState([
    { id: 'aadhaar', name: 'Aadhaar Card', uploadedAt: '2024-08-15' },
  ]);

  const selectedScheme = schemes.find(s => s.id === parseInt(selectedSchemeId));
  const requiredDocs = selectedScheme?.requiredDocuments || [];

  const missingDocs = useMemo(() => {
    if (!selectedScheme) return [];
    const uploadedIds = uploadedDocs.map(d => d.id);
    return documents.filter(d => requiredDocs.includes(d.name) && !uploadedIds.includes(d.id));
  }, [selectedScheme, uploadedDocs, requiredDocs]);

  const uploadedDocsList = useMemo(() => {
    if (!selectedScheme) return [];
    const requiredNames = requiredDocs;
    return documents.filter(d => requiredNames.includes(d.name) && uploadedDocs.some(u => u.id === d.id));
  }, [selectedScheme, uploadedDocs, requiredDocs]);

  const handleUpload = () => {
    const randomDoc = documents[Math.floor(Math.random() * documents.length)];
    setUploadedDocs(prev => [...prev, { id: randomDoc.id, name: randomDoc.name, uploadedAt: new Date().toLocaleDateString() }]);
  };

  const handleExport = () => {
    const content = `Missing Documents for ${selectedScheme?.name || 'Selected Scheme'}\n\n` +
      missingDocs.map(d => `- ${d.name} (${d.nameHi})`).join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'missing-documents.txt';
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <Link to="/documents" className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 mb-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Documents
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">What Am I Missing?</h1>
          <p className="text-sm sm:text-base text-gray-600">Check what documents you need for a specific scheme</p>
        </div>
        {missingDocs.length > 0 && (
          <Button variant="outline" onClick={handleExport} icon={Download} className="w-full sm:w-auto">
            Export List
          </Button>
        )}
      </div>

      <Card>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Select Scheme</label>
        <select
          value={selectedSchemeId}
          onChange={(e) => setSelectedSchemeId(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">Choose a scheme to check</option>
          {schemes.map(scheme => (
            <option key={scheme.id} value={scheme.id}>{scheme.name}</option>
          ))}
        </select>
      </Card>

      {selectedScheme && (
        <DocumentChecklist
          uploadedDocs={uploadedDocsList.map(d => ({ id: d.id, name: d.name, uploadedAt: uploadedDocs.find(u => u.id === d.id)?.uploadedAt }))}
          missingDocs={missingDocs}
          onUpload={handleUpload}
          onCheckScheme={() => {}}
          selectedScheme={selectedScheme}
        />
      )}

      {!selectedScheme && (
        <Card>
          <div className="text-center py-12">
            <p className="text-gray-500">Select a scheme above to see what documents you need</p>
          </div>
        </Card>
      )}
    </div>
  );
};

export default MissingDocs;
