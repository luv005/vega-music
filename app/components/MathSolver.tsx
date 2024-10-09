'use client';

import React, { useState } from 'react';
import 'katex/dist/katex.min.css';
import Latex from 'react-latex-next';

export function MathSolver() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSolve = async () => {
    if (!image && !input) {
      alert('Please upload an image or enter a math problem.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/solve-math', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image, input }),
      });

      if (!response.ok) {
        throw new Error('Failed to solve math problem');
      }

      const data = await response.json();
      const cleanedSolution = data.solution.replace(/###/g, '').replace(/\*\*/g, ''); // Remove "###" and "**" from the solution
      setResult(cleanedSolution);
    } catch (error) {
      console.error('Error solving math problem:', error);
      setResult('An error occurred while solving the math problem.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col items-center p-4 w-full max-w-2xl">
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Enter your math problem"
        className="mb-4 p-4 text-lg border border-gray-300 rounded w-full h-32"
      />
      <label className="mb-4 p-4 bg-blue-500 text-white rounded hover:bg-blue-700 cursor-pointer w-full text-center">
        Upload
        <input
          type="file"
          onChange={handleUpload}
          className="hidden"
        />
      </label>
      <button
        onClick={handleSolve}
        disabled={isLoading}
        className="mb-4 p-4 bg-purple-500 text-white rounded hover:bg-purple-700 w-full"
      >
        {isLoading ? 'Solving...' : 'Solve'}
      </button>
      {image && (
        <div className="mb-4">
          <img src={image} alt="Uploaded" className="max-w-full h-auto" />
        </div>
      )}
      {result && (
        <div className="mt-4 p-4 border border-gray-300 rounded bg-white w-full">
          <h2 className="text-xl font-bold mb-2">Solution:</h2>
          <Latex>{result}</Latex>
        </div>
      )}
    </div>
  );
}