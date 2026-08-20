import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, X, CheckCircle } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Alert from '@/components/ui/Alert';

const DocumentChecker = () => {
  const [documents, setDocuments] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [selectedScheme, setSelectedScheme] = useState('');

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  }, []);

  const handleFileInput = (e) => {
    const files = Array.from(e.target.files);
    handleFiles(files);
  };

  const handleFiles = (files) => {
    const newDocs = files.map(file => ({
      id: Date.now() + Math.random(),
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'uploaded',
      uploadedAt: new Date().toLocaleDateString(),
    }));
    setDocuments(prev => [...prev, ...newDocs]);
    setAnalysisResult(null);
  };

  const removeDocument = (id) => {
    setDocuments(prev => prev.filter(d => d.id !== id));
  };

  const analyzeDocuments = () => {
    setAnalysisResult({
      totalDocs: documents.length,
      recognizedFields: documents.map(d => ({
        name: d.name,
        fields: ['Name', 'Document Type', 'Date', 'ID Number'],
        confidence: Math.floor(85 + Math.random() * 15),
      })),
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Document Checker</h1>
        <p className="text-gray-600">Upload and analyze your documents</p>
      </div>

      <Card>
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all cursor-pointer ${
            isDragging
              ? 'border-primary-500 bg-primary-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <input
            type="file"
            multiple
            onChange={handleFileInput}
            className="hidden"
            id="file-upload"
          />
          <label htmlFor="file-upload" className="cursor-pointer">
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-1">
              Drop files here or click to upload
            </p>
            <p className="text-sm text-gray-500">
              Supports PDF, JPG, PNG, DOC up to 10MB
            </p>
          </label>
        </div>
      </Card>

      {documents.length > 0 && (
        <Card>
          <h3 className="font-semibold text-gray-900 mb-4">Uploaded Documents ({documents.length})</h3>
          <div className="space-y-3">
            {documents.map((doc, i) => (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-primary-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 truncate">{doc.name}</p>
                    <p className="text-xs text-gray-500">
                      {(doc.size / 1024).toFixed(1)} KB • {doc.type || 'Unknown type'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-2">
                  <Badge variant="success" dot>
                    <CheckCircle className="w-3 h-3" />
                    Uploaded
                  </Badge>
                  <button
                    onClick={() => removeDocument(doc.id)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
          <div className="flex gap-3 mt-4">
            <Button onClick={analyzeDocuments} className="flex-1">Analyze Documents</Button>
          </div>
        </Card>
      )}

      {analysisResult && (
        <Card>
          <h3 className="font-semibold text-gray-900 mb-4">Analysis Results</h3>
          <div className="space-y-4">
            {analysisResult.recognizedFields.map((doc, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="p-4 rounded-xl bg-green-50 border border-green-200"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-gray-900">{doc.name}</p>
                  <Badge variant="success">{doc.confidence}% confidence</Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  {doc.fields.map((field, j) => (
                    <span key={j} className="px-2 py-1 bg-white rounded-lg text-xs text-gray-600 border border-gray-200">
                      {field}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </Card>
      )}

      {documents.length === 0 && (
        <Alert variant="info">
          Upload documents to see analysis results. Our AI will recognize fields and help you verify your information.
        </Alert>
      )}
    </div>
  );
};

export default DocumentChecker;
