# STT Standalone Test Program

This is a standalone test program that isolates the STT (Speech-to-Text) functionality for testing.

## Purpose

This program allows you to test the STT transcription functionality independently without running the full NestJS application.

## Prerequisites

1. **Node.js** 18+ installed
2. **OpenAI API Key** set in `.env` file:
   ```env
   OPENAI_API_KEY=sk-your-api-key-here
   ```
3. **Audio file** to test (WAV, WebM, MP3, M4A, OGG, or FLAC format)
   - Minimum size: 10KB (approximately 1-2 seconds of audio)

## Usage

### Basic Usage

```bash
ts-node test-stt-standalone.ts <audio-file-path>
```

### Examples

```bash
# Test with WAV file
ts-node test-stt-standalone.ts recording.wav

# Test with WebM file
ts-node test-stt-standalone.ts audio.webm

# Test with MP3 file
ts-node test-stt-standalone.ts audio.mp3

# Test with full path
ts-node test-stt-standalone.ts "C:\Users\YourName\recordings\test.wav"
```

## Output

The program will:
1. ✅ Validate the audio file
2. ✅ Check file size (minimum 10KB)
3. ✅ Create File object for OpenAI API
4. ✅ Send to OpenAI Whisper API
5. ✅ Validate transcription result
6. ✅ Display the transcription

### Example Output

```
🎤 STT Standalone Test Program
==================================================
📁 Reading audio file: recording.wav

📊 Audio file: recording.wav
📊 Size: 47.46 KB (48596 bytes)
✅ Using native File API
🔄 Sending to OpenAI Whisper API...

==================================================
✅ Transcription successful!
==================================================

📝 Transcription:

"Hello, I want to book an appointment for KYC onboarding"

📊 Length: 55 characters
```

## Error Handling

The program handles various error scenarios:

- ❌ **File not found**: If the audio file doesn't exist
- ❌ **Empty file**: If the audio buffer is empty
- ❌ **File too small**: If audio is less than 10KB
- ❌ **Invalid audio**: If audio appears corrupted
- ❌ **API errors**: 401 (unauthorized), 429 (rate limit), 502 (bad gateway), etc.
- ❌ **Invalid transcription**: If OpenAI returns garbage characters

## Features

- ✅ **Isolated STT logic**: No NestJS dependencies
- ✅ **File validation**: Checks size and validity
- ✅ **Multiple format support**: WAV, WebM, MP3, M4A, OGG, FLAC
- ✅ **Error handling**: Comprehensive error messages
- ✅ **Clean output**: Formatted results
- ✅ **Temp file cleanup**: Automatically cleans up temporary files

## Testing Tips

1. **Record a test audio file**:
   - Use your phone or computer to record
   - Speak clearly for 2-3 seconds
   - Save as WAV format for best compatibility

2. **Test different formats**:
   - Try WAV (most compatible)
   - Try WebM (browser recording format)
   - Try MP3 (common format)

3. **Test error cases**:
   - Very short audio (< 1 second)
   - Silent audio
   - Corrupted file

## Troubleshooting

### "OPENAI_API_KEY not found"
- Make sure you have a `.env` file in the project root
- Add `OPENAI_API_KEY=sk-your-key-here` to the `.env` file
- Or set it as an environment variable: `export OPENAI_API_KEY=sk-your-key-here`

### "Audio too short"
- Record at least 1-2 seconds of audio
- Minimum file size is 10KB

### "Invalid transcription"
- This usually means the audio format is incompatible
- Try converting to WAV format
- Check that the audio actually contains speech

### "OpenAI API error"
- Check your API key is valid
- Check your internet connection
- Check OpenAI API status: https://status.openai.com/

## Files

- `test-stt-standalone.ts` - Main test program
- `TEST_STT_STANDALONE.md` - This documentation

## Related Files

The core STT logic is based on:
- `src/voice/services/stt.service.ts` - Main STT service (NestJS version)


