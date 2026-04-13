import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, File, CheckCircle, AlertCircle, Loader2, Database, Zap, ArrowRight, Trash2 } from 'lucide-react';
import { supabase } from '../supabase-client';
import { useAuth } from '../context/AuthContext';

interface Document {
  id: string;
  name: string;
  url: string;
  size_original: number;
  size_compressed: number;
  created_at: string;
  file_type: string;
}

export default function DocumentUpload() {
  const { session, user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(true);
  const [uploadStats, setUploadStats] = useState<{ original: number; compressed: number } | null>(null);

  useEffect(() => {
    if (user) {
      fetchDocuments();
    }
  }, [user]);

  const fetchDocuments = async () => {
    setIsLoadingDocs(true);
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setDocuments(data);
    }
    setIsLoadingDocs(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setUploadStatus('idle');
      setUploadStats(null);
    }
  };

  const handleUpload = async () => {
    if (!file || !session) return;

    setIsUploading(true);
    setUploadStatus('idle');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      const result = await response.json();

      if (response.ok) {
        setUploadStatus('success');
        setUploadStats({
          original: result.originalSize,
          compressed: result.compressedSize,
        });
        setFile(null);
        fetchDocuments();
      } else {
        setUploadStatus('error');
        console.error('Upload failed:', result.error);
      }
    } catch (error) {
      setUploadStatus('error');
      console.error('Upload system error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('documents').delete().eq('id', id);
    if (!error) {
      setDocuments(documents.filter(doc => doc.id !== id));
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-8 selection:bg-amber-500/30">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <header className="space-y-4">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl font-bold tracking-tight bg-gradient-to-r from-amber-200 via-amber-400 to-amber-600 bg-clip-text text-transparent"
          >
            Vercel Document Hub
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-gray-400 text-lg max-w-2xl"
          >
            Secure, compressed document storage powered by Vercel Serverless and Blob Storage. 
            Smart metadata tracking with Supabase Postgres.
          </motion.p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upload Section */}
          <motion.section 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1 space-y-6"
          >
            <div className="bg-[#111] border border-white/5 rounded-3xl p-8 space-y-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Database size={120} />
              </div>

              <div className="relative z-10 space-y-6">
                <h2 className="text-2xl font-semibold flex items-center gap-2">
                  <Upload className="text-amber-400" />
                  New Upload
                </h2>

                <div className="space-y-4">
                  <div className="relative">
                    <input 
                      type="file" 
                      id="file-upload" 
                      className="hidden" 
                      onChange={handleFileChange}
                      disabled={isUploading}
                    />
                    <label 
                      htmlFor="file-upload"
                      className="flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-2xl p-10 cursor-pointer hover:border-amber-400/50 hover:bg-amber-400/5 transition-all group"
                    >
                      <File className={`w-12 h-12 mb-4 ${file ? 'text-amber-400' : 'text-gray-500 group-hover:text-amber-400'}`} />
                      <span className="text-sm font-medium text-gray-400 group-hover:text-white transition-colors text-center">
                        {file ? file.name : "Select or drag document"}
                      </span>
                      {file && (
                        <span className="text-xs text-amber-400/70 mt-2">
                          {formatSize(file.size)}
                        </span>
                      )}
                    </label>
                  </div>

                  <button
                    onClick={handleUpload}
                    disabled={!file || isUploading}
                    className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                      !file || isUploading 
                      ? 'bg-white/5 text-gray-500 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-amber-400 to-amber-600 text-black hover:scale-[1.02] active:scale-[0.98]'
                    }`}
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Zap size={18} />
                        Compress & Upload
                      </>
                    )}
                  </button>
                </div>

                <AnimatePresence>
                  {uploadStatus === 'success' && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3 text-emerald-400"
                    >
                      <CheckCircle size={18} />
                      <div className="text-sm">
                        <p className="font-bold">Upload Complete!</p>
                        {uploadStats && (
                          <p className="opacity-80">Saved {Math.round((1 - uploadStats.compressed / uploadStats.original) * 100)}% space</p>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {uploadStatus === 'error' && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-3 text-rose-400"
                    >
                      <AlertCircle size={18} />
                      <span className="text-sm font-medium">Upload failed. Please try again.</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.section>

          {/* List Section */}
          <motion.section 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2 space-y-6"
          >
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-semibold">Your Documents</h2>
              <span className="text-xs font-mono text-gray-500 uppercase tracking-widest">
                {documents.length} Total Assets
              </span>
            </div>

            <div className="space-y-4">
              {isLoadingDocs ? (
                <div className="h-64 flex flex-col items-center justify-center text-gray-500 gap-4">
                  <Loader2 className="animate-spin w-8 h-8 text-amber-400" />
                  <p>Fetching storage data...</p>
                </div>
              ) : documents.length === 0 ? (
                <div className="h-64 border-2 border-dashed border-white/5 rounded-3xl flex flex-col items-center justify-center text-gray-500">
                  <File className="w-12 h-12 mb-4 opacity-20" />
                  <p>No documents uploaded yet</p>
                </div>
              ) : (
                documents.map((doc, index) => (
                  <motion.div
                    key={doc.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-[#111] hover:bg-[#151515] border border-white/5 p-5 rounded-2xl flex items-center justify-between group transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-amber-400/10 rounded-xl text-amber-400">
                        <File size={22} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-200 group-hover:text-white transition-colors max-w-[200px] truncate">
                          {doc.name}
                        </h3>
                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                          <span className="flex items-center gap-1">
                            <span className="line-through">{formatSize(doc.size_original)}</span>
                            <ArrowRight size={10} />
                            <span className="text-emerald-400 font-medium">{formatSize(doc.size_compressed)}</span>
                          </span>
                          <span>•</span>
                          <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <a 
                        href={doc.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm font-medium transition-colors"
                      >
                        View
                      </a>
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="p-2 text-gray-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.section>
        </div>
      </div>
    </div>
  );
}
