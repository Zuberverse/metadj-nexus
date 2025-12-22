#!/bin/bash

# MetaDJ Nexus - Video Encoding Script
# Creates VP9 WebM (primary) and H.264 MP4 (fallback) for cinema video

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check arguments
if [ $# -lt 2 ]; then
    echo -e "${RED}Error: Missing arguments${NC}"
    echo "Usage: $0 <input.mp4> <output-basename>"
    echo ""
    echo "Example:"
    echo "  $0 source-loop.mp4 'MetaDJ Performance Loop - MetaDJ Nexus'"
    echo "  Creates: MetaDJ Performance Loop - MetaDJ Nexus.webm and MetaDJ Performance Loop - MetaDJ Nexus.mp4"
    exit 1
fi

INPUT="$1"
OUTPUT_BASE="$2"
OUTPUT_WEBM="${OUTPUT_BASE}.webm"
OUTPUT_MP4="${OUTPUT_BASE}.mp4"

# Check FFmpeg
if ! command -v ffmpeg &> /dev/null; then
    echo -e "${RED}Error: FFmpeg not found${NC}"
    echo "Install with: brew install ffmpeg"
    exit 1
fi

# Check input
if [ ! -f "$INPUT" ]; then
    echo -e "${RED}Error: Input file not found: $INPUT${NC}"
    exit 1
fi

echo -e "${YELLOW}Encoding video to VP9 WebM and H.264 MP4...${NC}"
echo "Input: $INPUT"
echo ""

# Encode VP9 WebM (primary)
echo -e "${YELLOW}[1/2] Encoding VP9 WebM...${NC}"
ffmpeg -i "$INPUT" \
  -vf scale=960:-2,fps=30 \
  -c:v libvpx-vp9 -crf 36 -b:v 0 -row-mt 1 -threads 8 -speed 2 \
  -c:a libopus -b:a 96k \
  -y \
  "$OUTPUT_WEBM"

echo -e "${GREEN}✓ WebM complete${NC}"
echo ""

# Encode H.264 MP4 (fallback)
echo -e "${YELLOW}[2/2] Encoding H.264 MP4...${NC}"
ffmpeg -i "$INPUT" \
  -c:v libx264 -preset slow -crf 18 -profile:v high -level 4.2 \
  -c:a aac -b:a 192k -movflags +faststart \
  -y \
  "$OUTPUT_MP4"

echo -e "${GREEN}✓ MP4 complete${NC}"
echo ""

# Show results
echo -e "${GREEN}✓ All encodings complete!${NC}"
echo ""
echo "VP9 WebM (primary):"
echo "  File: $OUTPUT_WEBM"
echo "  Size: $(du -h "$OUTPUT_WEBM" | cut -f1)"
echo ""
echo "H.264 MP4 (fallback):"
echo "  File: $OUTPUT_MP4"
echo "  Size: $(du -h "$OUTPUT_MP4" | cut -f1)"
