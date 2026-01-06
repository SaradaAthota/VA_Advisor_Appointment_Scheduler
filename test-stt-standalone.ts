#!/usr/bin/env ts-node

/**
 * Standalone STT Test Program
 * 
 * This program isolates the STT functionality for testing.
 * It reads an audio file and returns the transcription.
 * 
 * Usage:
 *   ts-node test-stt-standalone.ts <audio-file-path>
 * 
 * Example:
 *   ts-node test-stt-standalone.ts recording.wav
 *   ts-node test-stt-standalone.ts audio.webm
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { Readable } from 'stream';
import OpenAI from 'openai';

// Load environment variables (if dotenv is available)
try {
    const dotenv = require('dotenv');
    dotenv.config();
} catch (e) {
    // dotenv not installed, use environment variables directly
    console.log('ℹ️  dotenv not found, using environment variables directly');
}

/**
 * Get MIME type from filename
 */
function getMimeType(filename: string): string {
    const ext = filename.toLowerCase().split('.').pop();
    const mimeTypes: { [key: string]: string } = {
        mp3: 'audio/mpeg',
        wav: 'audio/wav',
        m4a: 'audio/mp4',
        webm: 'audio/webm',
        ogg: 'audio/ogg',
        flac: 'audio/flac',
    };
    return mimeTypes[ext || ''] || 'audio/webm';
}

/**
 * Create a File-like object compatible with OpenAI SDK
 */
function createFileLikeObject(
    uint8Array: Uint8Array,
    filename: string,
    mimeType: string,
    audioBuffer: Buffer,
): any {
    return {
        name: filename,
        type: mimeType,
        size: audioBuffer.length,
        lastModified: Date.now(),

        arrayBuffer: async (): Promise<ArrayBuffer> => {
            const newBuffer = new ArrayBuffer(audioBuffer.length);
            const view = new Uint8Array(newBuffer);
            view.set(audioBuffer);
            return newBuffer;
        },

        stream: (): Readable => {
            return Readable.from(audioBuffer);
        },

        text: async (): Promise<string> => {
            return '';
        },

        slice: (start?: number, end?: number): any => {
            const sliced = audioBuffer.slice(start, end);
            const slicedUint8 = new Uint8Array(sliced);
            return createFileLikeObject(slicedUint8, filename, mimeType, sliced);
        },

        [Symbol.toStringTag]: 'File',
    };
}

/**
 * Transcribe audio using OpenAI Whisper API
 */
async function transcribeAudio(
    audioBuffer: Buffer,
    filename: string,
    openai: OpenAI,
): Promise<string> {
    const audioSizeKB = (audioBuffer.length / 1024).toFixed(2);
    console.log(`📊 Audio file: ${filename}`);
    console.log(`📊 Size: ${audioSizeKB} KB (${audioBuffer.length} bytes)`);

    // Validate audio buffer
    if (!audioBuffer || audioBuffer.length === 0) {
        throw new Error('Audio buffer is empty');
    }

    // Minimum size check (10KB)
    const MIN_AUDIO_SIZE = 10_000;
    if (audioBuffer.length < MIN_AUDIO_SIZE) {
        throw new Error(`Audio too short: ${audioBuffer.length} bytes (minimum: ${MIN_AUDIO_SIZE} bytes)`);
    }

    // Check if audio buffer looks valid
    const uniqueBytes = new Set(audioBuffer.slice(0, Math.min(100, audioBuffer.length)));
    if (uniqueBytes.size < 3) {
        throw new Error('Audio appears to be invalid (too few unique values)');
    }

    // Create File object
    const uint8Array = new Uint8Array(audioBuffer);
    const mimeType = getMimeType(filename);
    let file: File | any;
    let tempFilePath: string | null = null;

    try {
        // Try using Node.js 18+ native File API
        if (typeof File !== 'undefined' && File.prototype) {
            try {
                file = new File([uint8Array], filename, {
                    type: mimeType,
                });
                console.log('✅ Using native File API');
            } catch (e) {
                throw e;
            }
        } else {
            throw new Error('File API not available');
        }
    } catch (e) {
        // Fallback: Write to temp file
        console.log('⚠️  Using temp file method');
        try {
            tempFilePath = path.join(os.tmpdir(), `stt-${Date.now()}-${filename}`);
            fs.writeFileSync(tempFilePath, audioBuffer);

            if (typeof File !== 'undefined') {
                const fileBuffer = fs.readFileSync(tempFilePath);
                file = new File([fileBuffer], filename, {
                    type: mimeType,
                });
            } else {
                file = createFileLikeObject(uint8Array, filename, mimeType, audioBuffer);
            }
        } catch (tempFileError: any) {
            console.error(`❌ Temp file method failed: ${tempFileError.message}`);
            file = createFileLikeObject(uint8Array, filename, mimeType, audioBuffer);
        }
    }

    // Enhanced prompt for better transcription
    const enhancedPrompt = `This is a financial advisor appointment booking system. 
Common topics: KYC onboarding, KYC, onboarding, on boarding, key see, key C, K Y C, SIP mandates, SIP, mandates, statements, tax documents, tax docs, withdrawals, timelines, account changes, nominee.
Numbers: one, two, three, four, five, 1, 2, 3, 4, 5.
Common phrases: "I want to book", "book an appointment", "schedule", "appointment for", "topic is", "I need help with".
The user might say topic names, numbers, or full sentences.`;

    try {
        console.log('🔄 Sending to OpenAI Whisper API...');

        const transcription = await openai.audio.transcriptions.create({
            file: file,
            model: 'whisper-1',
            response_format: 'text',
            prompt: enhancedPrompt,
            temperature: 0.0,
        });

        // Handle response
        let text: string;
        if (typeof transcription === 'string') {
            text = transcription;
        } else if (transcription && typeof transcription === 'object' && 'text' in transcription) {
            text = (transcription as any).text;
        } else {
            text = String(transcription);
        }

        const trimmedText = text.trim();

        // Validate transcription
        const hasValidChars = /[\w\s.,!?;:'"()-]/.test(trimmedText);
        const hasOnlyInvalidChars = trimmedText.match(/^[^\w\s.,!?;:'"()-]+$/);
        const hasRepeatedInvalidChars = trimmedText.match(/^([^\w\s.,!?;:'"()-])\1{5,}$/);

        if (!trimmedText || trimmedText.length === 0) {
            throw new Error('No speech detected in the audio');
        }

        if (!hasValidChars || hasOnlyInvalidChars || hasRepeatedInvalidChars) {
            throw new Error(`Invalid transcription: "${trimmedText.substring(0, 50)}"`);
        }

        // Clean up temp file
        if (tempFilePath && fs.existsSync(tempFilePath)) {
            try {
                fs.unlinkSync(tempFilePath);
            } catch (e) {
                // Ignore cleanup errors
            }
        }

        return trimmedText;
    } catch (apiError: any) {
        // Clean up temp file on error
        if (tempFilePath && fs.existsSync(tempFilePath)) {
            try {
                fs.unlinkSync(tempFilePath);
            } catch (e) {
                // Ignore cleanup errors
            }
        }

        const statusCode = apiError.status || apiError.statusCode || apiError.response?.status;
        const errorMessage = apiError.message || '';

        if (errorMessage.includes('502') || errorMessage.includes('Bad Gateway') || statusCode === 502) {
            throw new Error('OpenAI API is temporarily unavailable (502 Bad Gateway)');
        } else if (statusCode === 401 || errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
            throw new Error('OpenAI API key is invalid or missing');
        } else if (statusCode === 429 || errorMessage.includes('429') || errorMessage.includes('rate limit')) {
            throw new Error('OpenAI API rate limit exceeded');
        } else {
            throw new Error(`OpenAI API error: ${errorMessage}`);
        }
    }
}

/**
 * Main function
 */
async function main() {
    // Get audio file path from command line
    const audioFilePath = process.argv[2];

    if (!audioFilePath) {
        console.error('❌ Error: Please provide an audio file path');
        console.log('\nUsage:');
        console.log('  ts-node test-stt-standalone.ts <audio-file-path>');
        console.log('\nExample:');
        console.log('  ts-node test-stt-standalone.ts recording.wav');
        console.log('  ts-node test-stt-standalone.ts audio.webm');
        process.exit(1);
    }

    // Check if file exists
    if (!fs.existsSync(audioFilePath)) {
        console.error(`❌ Error: File not found: ${audioFilePath}`);
        process.exit(1);
    }

    // Get OpenAI API key
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        console.error('❌ Error: OPENAI_API_KEY not found in environment variables');
        console.log('Please set OPENAI_API_KEY in your .env file or environment');
        process.exit(1);
    }

    // Initialize OpenAI client
    const openai = new OpenAI({ apiKey });

    try {
        console.log('🎤 STT Standalone Test Program');
        console.log('='.repeat(50));
        console.log(`📁 Reading audio file: ${audioFilePath}\n`);

        // Read audio file
        const audioBuffer = fs.readFileSync(audioFilePath);
        const filename = path.basename(audioFilePath);

        // Transcribe
        const transcription = await transcribeAudio(audioBuffer, filename, openai);

        // Output result
        console.log('\n' + '='.repeat(50));
        console.log('✅ Transcription successful!');
        console.log('='.repeat(50));
        console.log(`\n📝 Transcription:\n`);
        console.log(`"${transcription}"`);
        console.log(`\n📊 Length: ${transcription.length} characters\n`);

    } catch (error: any) {
        console.error('\n❌ Error:', error.message);
        if (error.stack) {
            console.error('\nStack trace:');
            console.error(error.stack);
        }
        process.exit(1);
    }
}

// Run the program
main();

