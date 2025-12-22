#!/bin/bash

# MetaDJ Nexus - Audio Encoding Script
# Helper that converts high-res source files (e.g., WAV exports) to 320 kbps MP3 for streaming.

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check arguments
if [ $# -lt 2 ]; then
    echo -e "${RED}Error: Missing arguments${NC}"
    echo "Usage: $0 <input.wav> <output.mp3>"
    echo ""
    echo "Example:"
    echo "  $0 ~/MusicArchive/track.wav ./audio-files/collection/01-track-name.mp3"
    exit 1
fi

INPUT="$1"
OUTPUT="$2"

# Check if FFmpeg is installed
if ! command -v ffmpeg &> /dev/null; then
    echo -e "${RED}Error: FFmpeg not found${NC}"
    echo "Install with: brew install ffmpeg"
    exit 1
fi

# Check if input file exists
if [ ! -f "$INPUT" ]; then
    echo -e "${RED}Error: Input file not found: $INPUT${NC}"
    exit 1
fi

# Create output directory if needed
OUTPUT_DIR=$(dirname "$OUTPUT")
mkdir -p "$OUTPUT_DIR"

echo -e "${YELLOW}Encoding audio...${NC}"
echo "Input:  $INPUT"
echo "Output: $OUTPUT"
echo ""

# Encode to 320 kbps MP3
ffmpeg -i "$INPUT" \
  -codec:a libmp3lame \
  -b:a 320k \
  -q:a 0 \
  -ar 44100 \
  -ac 2 \
  -y \
  "$OUTPUT"

# Check if successful
if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✓ Encoding complete!${NC}"
    echo "Output: $OUTPUT"

    # Show file size
    SIZE=$(du -h "$OUTPUT" | cut -f1)
    echo "Size: $SIZE"
else
    echo -e "${RED}✗ Encoding failed${NC}"
    exit 1
fi
