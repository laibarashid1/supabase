import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, File, CheckCircle, AlertCircle, Loader2, Database, Zap, ArrowRight, Trash2, Eye } from 'lucide-react';
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

    // Client-side size check (4.5MB Vercel limit)
    if (file.size > 4.5 * 1024 * 1024) {
      setUploadStatus('error');
      alert('File too large. Maximum size is 4.5MB for serverless processing.');
      return;
    }

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
        const errorMessage = result.error || 'Upload failed';
        const details = result.details ? ` (${result.details})` : '';
        alert(`${errorMessage}${details}`);
        console.error('Upload failed:', result);
      }
    } catch (error: any) {
      setUploadStatus('error');
      alert(`System Error: ${error.message}. Ensure you are running with 'vercel dev'.`);
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
    <div className="gradient-bg" style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '6rem 2rem',
      gap: '4rem'
    }}>
      <div style={{ textAlign: 'center', maxWidth: '600px' }}>
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ fontSize: '3rem', fontWeight: 700, marginBottom: '1rem' }}
        >
          Document Hub
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{ color: 'hsl(var(--muted-foreground))', fontSize: '1.1rem' }}
        >
          Securely manage, compress, and store your digital assets with neural-grade optimization.
        </motion.p>
      </div>

      <div style={{
        width: '100%',
        maxWidth: '1200px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
        gap: '2rem'
      }}>
        {/* Upload Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card"
          style={{
            padding: '2.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '2rem',
            height: 'fit-content'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '3rem',
              height: '3rem',
              borderRadius: '0.75rem',
              background: 'rgba(255, 255, 255, 0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white'
            }}>
              <Upload size={24} />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>New Upload</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ position: 'relative' }}>
              <input
                type="file"
                id="file-upload"
                onChange={handleFileChange}
                disabled={isUploading}
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  opacity: 0,
                  cursor: 'pointer',
                  zIndex: 10
                }}
              />
              <div style={{
                border: '2px border-dashed rgba(255,255,255,0.1)',
                borderRadius: 'var(--radius)',
                padding: '3rem 2rem',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '1rem',
                background: file ? 'rgba(255,255,255,0.05)' : 'transparent',
                transition: 'all 0.2s ease'
              }}>
                <File size={40} style={{ color: file ? 'white' : 'hsl(var(--muted-foreground))' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <span style={{ fontSize: '0.95rem', fontWeight: 500, color: 'white' }}>
                    {file ? file.name : 'Select Document'}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'hsl(var(--muted-foreground))' }}>
                    {file ? formatSize(file.size) : 'PDF, Image, or Doc'}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                if (!file) {
                  document.getElementById('file-upload')?.click();
                } else {
                  handleUpload();
                }
              }}
              disabled={isUploading}
              style={{
                padding: '1rem',
                background: 'white',
                color: 'black',
                border: 'none',
                borderRadius: 'var(--radius)',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                opacity: isUploading ? 0.7 : 1,
                cursor: isUploading ? 'not-allowed' : 'pointer'
              }}
            >
              {isUploading ? <Loader2 className="animate-spin" size={20} /> : (!file ? <Upload size={20} /> : <Zap size={20} />)}
              {isUploading ? 'Compressing...' : (!file ? 'Select & Upload' : 'Compress & Upload')}
            </button>
          </div>

          <AnimatePresence>
            {uploadStatus === 'success' && uploadStats && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{
                  padding: '1rem',
                  background: 'rgba(34, 197, 94, 0.1)',
                  border: '1px solid rgba(34, 197, 94, 0.2)',
                  borderRadius: 'var(--radius)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  color: '#4ade80'
                }}
              >
                <CheckCircle size={20} />
                <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>
                  Optimized by {Math.round((1 - uploadStats.compressed / uploadStats.original) * 100)}%
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* List Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card"
          style={{
            padding: '2.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '2rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                width: '3rem',
                height: '3rem',
                borderRadius: '0.75rem',
                background: 'rgba(255, 255, 255, 0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white'
              }}>
                <Database size={24} />
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Your Vault</h2>
            </div>
            <span style={{
              fontSize: '0.8rem',
              fontWeight: 600,
              padding: '0.4rem 0.8rem',
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '100px',
              color: 'hsl(var(--muted-foreground))'
            }}>
              {documents.length} ASSETS
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '500px', overflowY: 'auto', paddingRight: '0.5rem' }}>
            {isLoadingDocs ? (
              <div style={{ padding: '4rem', textAlign: 'center', opacity: 0.5 }}>
                <Loader2 className="animate-spin mx-auto" size={32} />
              </div>
            ) : documents.length === 0 ? (
              <div style={{ padding: '4rem', textAlign: 'center', color: 'hsl(var(--muted-foreground))', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 'var(--radius)' }}>
                No assets in vault
              </div>
            ) : (
              documents.map((doc) => (
                <div key={doc.id} style={{
                  padding: '1.25rem',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  borderRadius: 'var(--radius)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'background 0.2s ease',
                  cursor: 'default'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ color: 'hsl(var(--muted-foreground))' }}>
                      <File size={20} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1rem', fontWeight: 500, marginBottom: '0.25rem' }}>{doc.name}</h3>
                      <div style={{ display: 'flex', itemsCenter: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>
                        <span style={{ color: '#4ade80' }}>{formatSize(doc.size_compressed)}</span>
                        <span>•</span>
                        <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: '0.5rem',
                        borderRadius: '0.5rem',
                        background: 'rgba(255,255,255,0.05)',
                        color: 'white',
                        transition: 'all 0.2s'
                      }}
                    >
                      <Eye size={18} />
                    </a>
                    <button
                      onClick={() => handleDelete(doc.id)}
                      style={{
                        padding: '0.5rem',
                        borderRadius: '0.5rem',
                        background: 'rgba(239, 68, 68, 0.05)',
                        color: '#ef4444',
                        border: 'none',
                        transition: 'all 0.2s'
                      }}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
