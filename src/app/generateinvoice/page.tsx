"use client";

import React, { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function InvoiceUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setStatus('idle');
    }
  };

  const uploadFile = async () => {
    if (!file) return;

    setStatus('uploading');
    setErrorMessage("");

    const formData = new FormData();
    formData.append('file', file);

    try {
      // Replace with your actual backend URL
      const response = await fetch('https://localhost:7253/api/Invoice/generate-from-excel', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to generate invoices");
      }

      // Process the ZIP file response
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = "Invoices.zip"; // Matches your backend filename
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setStatus('success');
    } catch (err: unknown) {
      console.error(err);
      setStatus('error');

      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("An unexpected error occurred.");
      }
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-10 p-8 bg-white rounded-xl shadow-lg border border-gray-100">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Invoice Generator</h1>
        <p className="text-gray-500 mt-2">Upload your Excel file to generate split invoices.</p>
      </div>

      <div
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-lg p-10 flex flex-col items-center cursor-pointer transition-colors
          ${file ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'}`}
      >
        <input
          type="file"
          className="hidden"
          ref={fileInputRef}
          accept=".xlsx, .xls"
          onChange={handleFileChange}
        />

        {file ? (
          <div className="flex flex-col items-center">
            <FileText className="w-12 h-12 text-blue-500 mb-3" />
            <span className="text-sm font-medium text-gray-700">{file.name}</span>
            <button
              onClick={(e) => { e.stopPropagation(); setFile(null); }}
              className="mt-2 text-xs text-red-500 hover:underline"
            >
              Remove
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <Upload className="w-12 h-12 text-gray-400 mb-3" />
            <span className="text-gray-600 font-medium">Click to upload or drag and drop</span>
            <span className="text-xs text-gray-400 mt-1">XLSX or XLS only</span>
          </div>
        )}
      </div>

      {/* Status Messages */}
      {status === 'error' && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md flex items-center text-red-700 text-sm">
          <AlertCircle className="w-5 h-5 mr-2" />
          {errorMessage}
        </div>
      )}

      {status === 'success' && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md flex items-center text-green-700 text-sm">
          <CheckCircle className="w-5 h-5 mr-2" />
          Invoices generated and downloaded successfully!
        </div>
      )}

      <button
        disabled={!file || status === 'uploading'}
        onClick={uploadFile}
        className={`w-full mt-6 py-3 px-4 rounded-lg font-semibold text-white transition-all flex justify-center items-center
          ${!file || status === 'uploading'
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 shadow-md active:transform active:scale-[0.98]'}`}
      >
        {status === 'uploading' ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Processing Invoices...
          </>
        ) : (
          "Generate & Download ZIP"
        )}
      </button>
    </div>
  );
}