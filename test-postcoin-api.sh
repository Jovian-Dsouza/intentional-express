#!/bin/bash

# Test script for the new PostCoin minting API
echo "Testing PostCoin Minting API..."

# Test data matching the API specification
curl -X POST http://localhost:3000/api/collabs/mint-postcoin \
  -H "Content-Type: application/json" \
  -H "X-Zora-Wallet: 0x49773872fF6e6115CeADe91EEBAFAC0734A31Ae1" \
  -d '{
    "title": "Epic Sci-Fi Short Film",
    "description": "Looking for talented VFX artists and sound designers to collaborate on an ambitious sci-fi short film project.",
    "media": {
      "ipfsUrl": "ipfs://QmYourHashHere",
      "gatewayUrl": "https://gateway.pinata.cloud/ipfs/QmYourHashHere",
      "fileName": "project-concept.jpg",
      "fileType": "image/jpeg",
      "fileSize": 2048576
    },
    "collaboration": {
      "collaborators": [
        {
          "role": "VFX Artist",
          "creatorType": "indie",
          "credits": 30,
          "compensationType": "paid",
          "timeCommitment": "ongoing",
          "jobDescription": "Create stunning visual effects for space scenes"
        },
        {
          "role": "Sound Designer",
          "creatorType": "indie",
          "credits": 25,
          "compensationType": "barter",
          "timeCommitment": "one-time",
          "jobDescription": "Design immersive audio experience"
        },
        {
          "role": "Cinematographer",
          "creatorType": "org",
          "credits": 45,
          "compensationType": "both",
          "timeCommitment": "ongoing",
          "jobDescription": "Capture cinematic shots and lighting"
        }
      ],
      "expiresAt": "2024-12-31T23:59:59Z"
    },
    "creatorWallet": "0x49773872fF6e6115CeADe91EEBAFAC0734A31Ae1",
    "metadata": {
      "tags": ["film", "sci-fi", "vfx", "collaboration"],
      "category": "film-production",
      "estimatedDuration": "3-6 months",
      "budget": {
        "min": 5000,
        "max": 15000,
        "currency": "USD"
      }
    }
  }' | jq '.'

echo -e "\n\nTest completed!"
