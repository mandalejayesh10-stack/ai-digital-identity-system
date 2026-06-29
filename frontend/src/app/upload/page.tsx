'use client';

import { useEffect, useState } from 'react';
import { 
  fetchDocuments, 
  uploadDocument, 
  deleteDocument, 
  Document 
} from '@/lib/api';
import { 
  UploadCloud, 
  FileText, 
  Trash2, 
  Clock, 
  CheckCircle, 
  XCircle,
  Sparkles,
  AlertCircle
} from 'lucide-react';

export default function UploadPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState('resume');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadDocuments();
    // Poll for status updates every 4 seconds
    const interval = setInterval(loadDocuments, 4000);
    return () => clearInterval(interval);
  }, []);

  const loadDocuments = () => {
    fetchDocuments()
      .then(setDocuments)
      .catch(console.error);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file to upload.');
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(false);

    try {
      await uploadDocument(file, fileType);
      setFile(null);
      setSuccess(true);
      loadDocuments();
    } catch (err: any) {
      setError(err.message || 'Failed to upload document.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docId: number) => {
    if (!confirm('Are you sure you want to delete this record?')) return;
    try {
      await deleteDocument(docId);
      loadDocuments();
    } catch (err) {
      console.error(err);
      alert('Failed to delete document.');
    }
  };

  return (
    <div className="p-8 max-w-7xl w-full mx-auto space-y-8">
      {/* Header */}
      <div>
        <span className="text-xs font-mono tracking-widest text-emerald-400 uppercase">
          Ingestion Center
        </span>
        <h1 className="text-3xl font-bold tracking-tight text-slate-100 mt-1">
          Upload Career Records
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Upload your resume, certificates, or projects. Our multi-agent pipeline will parse, index, and map them.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upload Form */}
        <div className="glass-card p-6 rounded-3xl h-fit lg:col-span-1 space-y-6">
          <h3 className="font-semibold text-slate-100 border-b border-slate-800 pb-3">
            Add New Document
          </h3>

          <form onSubmit={handleUpload} className="space-y-4">
            {/* Document Type */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-slate-400 uppercase">Document Type</label>
              <select
                value={fileType}
                onChange={(e) => setFileType(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 text-xs font-mono focus:border-emerald-500/30 focus:outline-none"
              >
                <option value="resume">Resume</option>
                <option value="certificate">Certificate</option>
                <option value="internship">Internship Letter</option>
                <option value="project">Project Report</option>
                <option value="portfolio">Portfolio PDF</option>
                <option value="github">GitHub Profile PDF</option>
              </select>
            </div>

            {/* File Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-slate-400 uppercase">Select File</label>
              <div className="border border-dashed border-slate-800 hover:border-slate-700/80 rounded-2xl p-6 text-center transition-all cursor-pointer relative bg-slate-900/30">
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.docx,.txt,.md"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <UploadCloud className="h-8 w-8 text-slate-500 mx-auto mb-2" />
                <span className="text-xs text-slate-400 block font-medium">
                  {file ? file.name : 'Drag & drop or click to upload'}
                </span>
                <span className="text-[10px] text-slate-600 font-mono mt-1 block">
                  PDF, DOCX, TXT, or MD (MAX 10MB)
                </span>
              </div>
            </div>

            {error && (
              <div className="flex gap-2 items-center p-3 bg-red-500/10 border border-red-500/25 rounded-xl text-xs text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {success && (
              <div className="flex gap-2 items-center p-3 bg-emerald-500/10 border border-emerald-500/25 rounded-xl text-xs text-emerald-400 animate-pulse">
                <CheckCircle className="h-4 w-4 shrink-0" />
                <p>Ingestion triggered successfully!</p>
              </div>
            )}

            <button
              type="submit"
              disabled={uploading || !file}
              className={`w-full py-3 px-4 rounded-xl text-xs font-mono font-semibold transition-all flex items-center justify-center gap-2 ${
                uploading || !file
                  ? 'bg-slate-800 text-slate-600 border border-slate-800 cursor-not-allowed'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shadow-lg shadow-emerald-500/10'
              }`}
            >
              {uploading ? (
                <>
                  <div className="h-3.5 w-3.5 border-2 border-slate-950/20 border-t-slate-950 rounded-full animate-spin"></div>
                  PARSING DOCUMENT...
                </>
              ) : (
                'TRIGGER PIPELINE'
              )}
            </button>
          </form>
        </div>

        {/* Ingested Documents List */}
        <div className="glass-card p-6 rounded-3xl lg:col-span-2 space-y-4">
          <h3 className="font-semibold text-slate-100 border-b border-slate-800 pb-3">
            Active Digital Identity Records
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 text-[10px] font-mono uppercase tracking-wider">
                  <th className="py-3 px-4">Record Name</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">AI Score</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {documents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500 font-mono text-xs">
                      NO RECORDS INGESTED
                    </td>
                  </tr>
                ) : (
                  documents.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-900/30 transition-all">
                      {/* Name */}
                      <td className="py-3.5 px-4 font-medium text-slate-200">
                        <div className="flex items-center gap-2.5">
                          <FileText className="h-4 w-4 text-slate-400" />
                          <span className="truncate max-w-[180px] sm:max-w-xs">{doc.name}</span>
                        </div>
                      </td>
                      {/* Type */}
                      <td className="py-3.5 px-4 text-xs font-mono text-slate-400 uppercase">
                        {doc.file_type}
                      </td>
                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          {doc.status === 'pending' && (
                            <>
                              <Clock className="h-3.5 w-3.5 text-yellow-500 animate-pulse" />
                              <span className="text-xs text-yellow-500 font-mono">PENDING</span>
                            </>
                          )}
                          {doc.status === 'processing' && (
                            <>
                              <div className="h-3 w-3 border-2 border-emerald-500/25 border-t-emerald-500 rounded-full animate-spin"></div>
                              <span className="text-xs text-emerald-400 font-mono">PARSING...</span>
                            </>
                          )}
                          {doc.status === 'completed' && (
                            <>
                              <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                              <span className="text-xs text-emerald-400 font-mono">INDEXED</span>
                            </>
                          )}
                          {doc.status === 'failed' && (
                            <>
                              <XCircle className="h-3.5 w-3.5 text-red-500" />
                              <span className="text-xs text-red-500 font-mono">FAILED</span>
                            </>
                          )}
                        </div>
                      </td>
                      {/* AI Score */}
                      <td className="py-3.5 px-4 text-center font-mono text-slate-200">
                        {doc.status === 'completed' ? (
                          <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                            <Sparkles className="h-3 w-3" />
                            {doc.overall_score}%
                          </span>
                        ) : (
                          <span className="text-slate-600">--</span>
                        )}
                      </td>
                      {/* Delete */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleDelete(doc.id)}
                          className="p-1.5 rounded-lg bg-slate-900 hover:bg-red-500/10 hover:text-red-400 border border-slate-800 transition-all text-slate-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
