'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { UploadCloud, FileJson, CheckCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface FileUploadProps {
  onFileUpload: (fileContent: any[]) => void;
  isLoading: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload, isLoading }) => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setError(null);
    setUploadedFile(null);
    if (acceptedFiles && acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      if (file.type !== 'application/json') {
        setError('Invalid file type. Please upload a JSON file.');
        return;
      }
      setUploadedFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const json = JSON.parse(event.target?.result as string);
          if (!Array.isArray(json)) {
            setError('Invalid JSON format. Expected an array of objects.');
            setUploadedFile(null); // Clear file if format is wrong
            return;
          }
          // Add basic validation for expected keys (id, prompt)
          const isValidFormat = json.every(item => typeof item.id !== 'undefined' && typeof item.prompt === 'string');
          if (!isValidFormat) {
            setError('Invalid JSON structure. Each item must have an "id" and "prompt" (string).');
            setUploadedFile(null);
            return;
          }

          onFileUpload(json);

        } catch (e) {
          setError('Failed to parse JSON file. Please ensure it is valid JSON.');
          setUploadedFile(null);
        }
      };
      reader.readAsText(file);
    }
  }, [onFileUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/json': ['.json'] },
    multiple: false,
    disabled: isLoading,
  });

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center">
          <UploadCloud className="mr-2 h-6 w-6 text-primary" />
          Upload Batch File
        </CardTitle>
        <CardDescription>
          Upload a JSON file containing an array of prompts to evaluate. Each object in the array should have an "id" and a "prompt" field.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          {...getRootProps()}
          className={`p-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors
            ${isDragActive ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}
            ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center justify-center text-center">
            <UploadCloud className={`h-12 w-12 mb-4 ${isDragActive ? 'text-primary' : 'text-muted-foreground'}`} />
            {isDragActive ? (
              <p className="text-primary font-semibold">Drop the JSON file here...</p>
            ) : (
              <p className="text-muted-foreground">Drag 'n' drop a JSON file here, or click to select file</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">Max file size: 5MB. Format: JSON Array.</p>
          </div>
        </div>
        {uploadedFile && !error && (
          <div className="mt-4 p-3 bg-green-100 dark:bg-green-900 border border-green-300 dark:border-green-700 rounded-md text-green-700 dark:text-green-300 flex items-center">
            <CheckCircle className="h-5 w-5 mr-2" />
            <span>File ready: <strong>{uploadedFile.name}</strong></span>
          </div>
        )}
        {error && (
          <div className="mt-4 p-3 bg-destructive/10 border border-destructive/30 rounded-md text-destructive flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>{error}</span>
          </div>
        )}
        {/* The actual processing will be triggered by a button in BatchMode.tsx after file is staged */}
      </CardContent>
    </Card>
  );
};

export default FileUpload;
