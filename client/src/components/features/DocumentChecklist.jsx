import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, FileText, ExternalLink } from 'lucide-react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

const DocumentChecklist = ({
  uploadedDocs = [],
  missingDocs = [],
  onUpload,
  onCheckScheme,
  selectedScheme,
}) => {
  const allDocs = [...uploadedDocs, ...missingDocs];

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Document Status</h3>
            <p className="text-sm text-gray-600">
              {uploadedDocs.length} of {allDocs.length} documents uploaded
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onUpload}>
              Upload Documents
            </Button>
            {selectedScheme && (
              <Button variant="primary" size="sm" onClick={onCheckScheme}>
                Check Against Scheme
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-3">
          {allDocs.map((doc, i) => {
            const isUploaded = uploadedDocs.some(d => d.id === doc.id);
            return (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                  isUploaded
                    ? 'bg-green-50/50 border-green-200'
                    : 'bg-red-50/50 border-red-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    isUploaded ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    <FileText className={`w-5 h-5 ${isUploaded ? 'text-green-600' : 'text-red-600'}`} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{doc.name}</p>
                    {doc.nameHi && <p className="text-xs text-gray-500">{doc.nameHi}</p>}
                    {isUploaded && doc.uploadedAt && (
                      <p className="text-xs text-green-600 mt-0.5">Uploaded {doc.uploadedAt}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isUploaded ? (
                    <Badge variant="success">
                      <CheckCircle2 className="w-3 h-3" />
                      Uploaded
                    </Badge>
                  ) : (
                    <Badge variant="error">
                      <XCircle className="w-3 h-3" />
                      Missing
                    </Badge>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </Card>

      {missingDocs.length > 0 && (
        <Card>
          <h3 className="font-semibold text-gray-900 mb-4">How to get missing documents</h3>
          <div className="space-y-4">
            {missingDocs.map((doc, i) => (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="p-4 rounded-xl bg-amber-50 border border-amber-200"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <ExternalLink className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{doc.name}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      Visit your local Tehsil office, CSC center, or use the state government portal to obtain this document.
                      You'll need your Aadhaar and other identification documents.
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default DocumentChecklist;
