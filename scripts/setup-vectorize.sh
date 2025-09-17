#!/bin/bash

# CarrierLLM Vectorize Setup Script
# This script creates the Vectorize index and uploads initial carrier documents

set -e

echo "🔍 Setting up Cloudflare Vectorize for CarrierLLM..."

# Check if environment variables are set
if [ -z "$CLOUDFLARE_VECTORIZE_INDEX" ]; then
    echo "❌ CLOUDFLARE_VECTORIZE_INDEX environment variable not set"
    exit 1
fi

INDEX_NAME="$CLOUDFLARE_VECTORIZE_INDEX"

# Create Vectorize index
echo "📊 Creating Vectorize index: $INDEX_NAME"
if wrangler vectorize create "$INDEX_NAME" --dimensions=384 --metric=cosine 2>/dev/null; then
    echo "✅ Vectorize index created successfully"
else
    echo "ℹ️  Vectorize index already exists"
fi

# List index info
echo "📋 Index information:"
wrangler vectorize info "$INDEX_NAME"

echo ""
echo "🎉 Vectorize setup completed!"
echo ""
echo "📝 Next steps:"
echo "   1. Deploy your worker: cd apps/worker && pnpm deploy"
echo "   2. Upload carrier documents via the API"
echo "   3. Test the RAG pipeline with sample queries"