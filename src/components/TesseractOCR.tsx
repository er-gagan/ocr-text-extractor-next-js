"use client";
import React, { useState, DragEvent, ChangeEvent, ClipboardEvent, useEffect } from 'react';
import Tesseract from 'tesseract.js';
import { FaUpload, FaImage, FaCopy, FaSpinner } from 'react-icons/fa';
import { FaVolumeUp, FaPause, FaPlay } from 'react-icons/fa';

const TesseractOCR: React.FC = () => {
    const [image, setImage] = useState<string | null>(null);
    const [text, setText] = useState<string>('');
    const [progress, setProgress] = useState<number>(0);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
    const [utterance, setUtterance] = useState<SpeechSynthesisUtterance | null>(null);

    useEffect(() => {
        if (utterance) {
            utterance.onend = () => setIsSpeaking(false);
            utterance.onpause = () => setIsSpeaking(false);
            utterance.onresume = () => setIsSpeaking(true);
        }
    }, [utterance]);

    // Add these functions inside the component
    const handleCopyText = () => {
        if (text) {
            navigator.clipboard.writeText(text)
                .then(() => alert('Text copied to clipboard!'))
                .catch(() => alert('Failed to copy text.'));
        }
    };

    const handleSpeakText = () => {
        if (text) {
            const newUtterance = new SpeechSynthesisUtterance(text);
            newUtterance.rate = 0.9; // Slower speed (default is 1)
            newUtterance.pitch = 1; // Moderate pitch (default is 1)
            newUtterance.volume = 1; // Maximum volume

            // Set a better voice if available
            const voices = speechSynthesis.getVoices();
            const preferredVoice = voices.find((voice) =>
                voice.name.includes('Google') || voice.name.includes('Natural')
            );
            if (preferredVoice) {
                newUtterance.voice = preferredVoice;
            }

            setUtterance(newUtterance);
            speechSynthesis.speak(newUtterance);
            setIsSpeaking(true);
        }
    };

    const handlePauseResumeSpeech = () => {
        if (utterance) {
            if (isSpeaking) {
                speechSynthesis.pause();
            } else {
                speechSynthesis.resume();
            }
        }
    };


    const handleImageUpload = (file: File | null) => {
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                if (e.target?.result) {
                    setImage(e.target.result as string);
                }
            };
            reader.readAsDataURL(file);
            setText('');
            setProgress(0);
            setError(null);
        } else {
            setError('Please upload a valid image file.');
        }
    };

    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        handleImageUpload(file);
    };

    const handlePaste = (e: ClipboardEvent<HTMLDivElement>) => {
        const items = e.clipboardData.items;
        for (const item of items) {
            if (item.type.startsWith('image/')) {
                const file = item.getAsFile();
                if (file) {
                    handleImageUpload(file);
                }
                break;
            }
        }
    };

    const performOCR = () => {
        if (image) {
            setIsLoading(true);
            Tesseract.recognize(image, 'eng+hin', {
                logger: (m) => {
                    if (m.status === 'recognizing text') {
                        setProgress(Math.round(m.progress * 100));
                    }
                },
            })
                .then(({ data: { text } }) => {
                    setText(text);
                    setIsLoading(false);
                })
                .catch((error) => {
                    console.error('Error during OCR:', error);
                    setIsLoading(false);
                    setError('Failed to extract text. Please try again.');
                });
        } else {
            setError('No image selected.');
        }
    };

    return (
        <div className='min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4'>
            <div className='max-w-2xl w-full bg-white rounded-lg shadow-lg p-6 transition-all hover:shadow-xl'>
                <h1 className='text-3xl font-bold text-center mb-6 text-gray-800'>Tesseract.js OCR in React</h1>
                <div
                    className='w-full mb-6 p-8 border-2 border-dashed border-gray-300 rounded-lg text-center cursor-pointer hover:border-blue-500 transition-colors'
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onPaste={handlePaste}
                >
                    <FaImage className='text-4xl text-gray-400 mx-auto mb-4 transition-transform hover:scale-110' />
                    <p className='text-gray-600 mb-2'>Drag & drop an image, paste, or</p>
                    <label className='bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors cursor-pointer inline-block'>
                        <FaUpload className='inline-block mr-2' />
                        Upload Image
                        <input
                            type='file'
                            accept='image/*'
                            onChange={(e: ChangeEvent<HTMLInputElement>) => handleImageUpload(e.target.files?.[0] || null)}
                            className='hidden'
                        />
                    </label>
                </div>
                {error && (
                    <div className='w-full bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6 transition-opacity'>
                        {error}
                    </div>
                )}
                {image && (
                    <div className='flex flex-col items-center'>
                        <img
                            src={image}
                            alt='Uploaded'
                            className='max-w-full h-auto mb-6 rounded-lg shadow-md transition-transform hover:scale-105'
                            style={{ maxHeight: '400px' }}
                        />

                        <button
                            onClick={performOCR}
                            disabled={isLoading}
                            className={`w-full sm:w-auto ${isLoading ? 'bg-blue-300' : 'bg-blue-500'
                                } text-white py-3 px-6 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center`}
                        >
                            {isLoading ? (
                                <>
                                    <FaSpinner className='animate-spin mr-2' />
                                    Processing...
                                </>
                            ) : (
                                'Extract Text'
                            )}
                        </button>
                        {progress > 0 && (
                            <div className='w-full bg-gray-200 rounded-full h-2.5 mt-6 overflow-hidden'>
                                <div
                                    className='bg-blue-600 h-2.5 rounded-full transition-width duration-300'
                                    style={{ width: `${progress}%` }}
                                ></div>
                            </div>
                        )}

                        {text && (
                            <div className='mt-6 bg-gray-50 p-4 rounded-lg shadow-inner w-full transition-opacity'>
                                <h2 className='text-xl font-semibold mb-4 text-gray-800'>Extracted Text:</h2>
                                <pre className='whitespace-pre-wrap bg-white p-4 rounded-lg border border-gray-200'>{text}</pre>
                                <div className='flex gap-2 mt-4'>
                                    <button
                                        onClick={handleCopyText}
                                        className='bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center'
                                    >
                                        <FaCopy className='inline-block mr-2' />
                                        Copy Text
                                    </button>
                                    <button
                                        onClick={handleSpeakText}
                                        className='bg-purple-500 text-white py-2 px-4 rounded-lg hover:bg-purple-600 transition-colors flex items-center justify-center'
                                    >
                                        <FaVolumeUp className='inline-block mr-2' />
                                        Speak Text
                                    </button>
                                    {isSpeaking && (
                                        <button
                                            onClick={handlePauseResumeSpeech}
                                            className='bg-yellow-500 text-white py-2 px-4 rounded-lg hover:bg-yellow-600 transition-colors flex items-center justify-center'
                                        >
                                            {speechSynthesis.paused ? (
                                                <FaPlay className='inline-block mr-2' />
                                            ) : (
                                                <FaPause className='inline-block mr-2' />
                                            )}
                                            {speechSynthesis.paused ? 'Resume' : 'Pause'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TesseractOCR;