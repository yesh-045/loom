"use client";
import React, { useState, ChangeEvent } from 'react';
import saveImage from '@/utils/saveImage';
import { ChatMessage } from '@/lib/types';
import { Button } from "@/components/ui/button";
import fetchGenerateAIResponse from '@/utils/fetchGenerateAIResponse';

interface ImageUploaderProps {
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ messages, setMessages }) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<string | null>(null);
  const [isSuccessful, setIsSuccessful] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  const handleFileChange = (_e: ChangeEvent<HTMLInputElement>) => {
    if (_e.target.files) {
      console.log(_e.target.files[0]);
      setFile(_e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setUploadResult(null);

    const formData = new FormData();
    formData.append('image', file);

    try {
      const imageUrl = await saveImage(formData);

      const message: ChatMessage = {
        role: "user",
        content: [
          {
            type: "image",
            imageUrl: imageUrl
          }
        ]
      };

      // Append image and a lightweight instruction so AI knows to interpret
      const instruction: ChatMessage = {
        role: 'user',
        content: 'Please describe and interpret the uploaded image in detail.'
      };

      const newConversation = [...messages, message, instruction];
      setIsSuccessful(true);
      setMessages(newConversation);
      setUploadResult('Image uploaded successfully! URL: ' + imageUrl);

      // Auto-call AI to interpret
      setAnalyzing(true);
      try {
        const ai = await fetchGenerateAIResponse(newConversation);
        const aiMessage: ChatMessage = ai.contentType
          ? { role: 'assistant', content: ai.content, componentMessageType: ai.contentType as ChatMessage['componentMessageType'] }
          : { role: 'assistant', content: ai.content };
        setMessages(prev => [...prev, aiMessage]);
      } catch {
        // Surface a simple assistant error message in the chat
        setMessages(prev => [...prev, { role: 'assistant', content: 'I could not analyze the image right now. Please try again.' }]);
      } finally {
        setAnalyzing(false);
      }
    } catch {
      // Swallow error and show generic message
      setUploadResult('An error occurred during upload.');
    } finally {
      setUploading(false);
    }
  };

  return (
  <div className="flex flex-col flex-grow items-center w-[250px] sm:w-[450px] md:w-[550px] bg-card text-foreground border border-border rounded-2xl shadow-md p-6">
      <h2 className="text-2xl font-bold text-card-foreground mb-4">Image Upload</h2>
      <form onSubmit={handleSubmit} className="flex flex-col space-y-4 w-full">
        <div>
          <input
            type="file"
            id="image"
            accept="image/*"
            onChange={handleFileChange}
            className="mt-1 block w-full text-sm text-muted-foreground
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-full file:border-0
                      file:text-sm file:font-semibold
                      file:bg-blue-50 file:text-blue-700
                      hover:file:bg-blue-100 transition-colors duration-200"
          />
        </div>
        {!isSuccessful && (
          <Button
            type="submit"
            disabled={!file || uploading}
            className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-lg hover:bg-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-melon-500 disabled:opacity-50 transition-colors duration-200"
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>
        )}
        {isSuccessful && (
          <div className="text-sm text-muted-foreground text-center">
            {analyzing ? 'Analyzing image with AI…' : 'Image uploaded.'}
          </div>
        )}
      </form>
      {uploadResult && (
        <p className={`mt-4 text-sm ${uploadResult.includes('error') ? 'text-red-600' : 'text-green-600'}`}>
          {uploadResult}
        </p>
      )}
    </div>
  );
};

export default ImageUploader;