'use client';

import React, { useState } from 'react';
import { NISTCatalog } from '@/types/nist';
import { NISTRevision } from '@/store/useSRMStore';
import { Download, Loader2 } from 'lucide-react';
import { pdf } from '@react-pdf/renderer';
import SRMReport from './SRMReport';

interface PDFGeneratorProps {
  catalog: NISTCatalog | null;
  revision: NISTRevision;
  includeImplementation: boolean;
  includeGraph: boolean;
}

export default function PDFGenerator({ catalog, revision, includeImplementation }: PDFGeneratorProps) {
  const [loading, setLoading] = useState(false);

  const fileName = revision === 'rev2' 
    ? 'NIST-800-171-Rev2-SRM.pdf' 
    : 'NIST-800-171-Rev3-SRM.pdf';

  const handleDownload = async () => {
    if (!catalog) return;
    
    setLoading(true);
    try {
      const blob = await pdf(<SRMReport catalog={catalog} revision={revision} includeImplementation={includeImplementation} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('PDF generation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!catalog) {
    return (
      <div className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 text-slate-400 rounded-lg cursor-not-allowed text-sm">
        <Loader2 className="w-4 h-4 animate-spin" />
        Initializing PDF...
      </div>
    );
  }

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-lg transition-colors font-medium text-sm"
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Preparing PDF...
        </>
      ) : (
        <>
          <Download className="w-4 h-4" />
          Export Detailed PDF
        </>
      )}
    </button>
  );
}
