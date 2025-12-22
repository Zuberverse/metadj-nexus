# AI Provider Migration Guide — MetaDJ All Access

> **Comprehensive guide for migrating from Anthropic Claude to OpenAI GPT-5.2 Instant with optional Claude Haiku 4.5 provider**

**Last Modified**: 2025-11-18
**Migration Date**: November 2025
**Version**: v1.0 (Post-Migration)

## Overview

MetaDJ All Access has migrated from a single-provider AI system (Anthropic Claude) to a dual-provider architecture using **Vercel AI SDK** with:
- **Default Model**: OpenAI GPT-5.2 Instant (`gpt-5.2-chat-latest`)
- **Optional Provider Model**: Anthropic Claude Haiku 4.5 (`claude-4-5-haiku-20251001`) via `AI_PROVIDER=anthropic`
- **Web Search**: OpenAI native `web_search` tool (available only when using OpenAI provider)

This migration provides improved performance and cost efficiency, while keeping Anthropic wired in for intentional provider switching in the future.

## What Changed

### Before Migration

**AI Stack**:
```yaml
Provider: Anthropic (single provider)
Model: Claude Haiku 4.5
Web Search: Experimental Anthropic web search
SDK: Direct Anthropic SDK
Streaming: Anthropic native streaming
```

**Environment Variables**:
```bash
ANTHROPIC_API_KEY=sk-ant-...
META_DJ_AI_MODEL=claude-4-5-haiku-20251001  # Optional override
```

**Dependencies**:
```json
{
  "@anthropic-ai/sdk": "^0.32.1"
}
```

### After Migration

**AI Stack**:
```yaml
Default Provider: OpenAI
Default Model: GPT-5.2 Instant (gpt-5.2-chat-latest)
Optional Provider: Anthropic
Optional Model: Claude Haiku 4.5 (claude-4-5-haiku-20251001)
Web Search: OpenAI native web_search (OpenAI provider only)
SDK: Vercel AI SDK (@ai-sdk/openai, @ai-sdk/anthropic)
Streaming: Unified streaming via Vercel AI SDK
```

**Environment Variables**:
```bash
# Required
OPENAI_API_KEY=sk-proj-...

# Optional Anthropic provider
ANTHROPIC_API_KEY=sk-ant-...

# Optional (model configuration)
PRIMARY_AI_MODEL=gpt-5.2-chat-latest
ANTHROPIC_AI_MODEL=claude-4-5-haiku-20251001
AI_PROVIDER=openai  # or 'anthropic'
```

**Dependencies**:
```json
{
  "ai": "^4.0.38",
  "@ai-sdk/openai": "^1.0.19",
  "@ai-sdk/anthropic": "^1.0.5"
}
```

## Breaking Changes

### 1. Environment Variables

**Action Required**: Update all environment variable names and add new required keys.

**Old Configuration**:
```bash
ANTHROPIC_API_KEY=sk-ant-...
META_DJ_AI_MODEL=claude-4-5-haiku-20251001  # Optional
```

**New Configuration**:
```bash
# OpenAI Provider (Required for default)
OPENAI_API_KEY=sk-proj-...

# Optional Anthropic Provider
ANTHROPIC_API_KEY=sk-ant-...

# Model Configuration (Optional)
PRIMARY_AI_MODEL=gpt-5.2-chat-latest
ANTHROPIC_AI_MODEL=claude-4-5-haiku-20251001
AI_PROVIDER=openai
```

**Migration Steps**:
1. **Get OpenAI API Key**: https://platform.openai.com/
2. **Update Replit Secrets**:
   - Add `OPENAI_API_KEY`
   - Keep `ANTHROPIC_API_KEY` for optional Anthropic provider (optional)
   - Remove `META_DJ_AI_MODEL` (replaced by `PRIMARY_AI_MODEL`)
3. **Update local `.env`** if testing locally

**Note**: Web search is only available with the OpenAI provider via the `web_search` tool. When using Claude, MetaDJai relies on local tools and the knowledge base.

### 2. Web Search & Tool Implementation

**What Changed**: Migrated from experimental Anthropic web search to native provider-executed web search tools, and added a custom catalog search tool.

**Old Implementation** (Anthropic experimental):
```typescript
// Used experimental Anthropic web search
// Limited documentation, beta feature
// Tied to Anthropic provider only
```

**New Implementation** (Native Provider Tools + Custom Tools):
```typescript
// OpenAI provides web_search tool (built-in)
// Custom 'searchCatalog' tool for local music data
// Vercel AI SDK 5 automatically handles provider-executed tools
// No external API keys needed beyond OpenAI/Anthropic credentials
```

**Benefits**:
- Native integration with both OpenAI and Anthropic
- No external search service required
- Simplified architecture (fewer dependencies)
- Included with AI provider subscription
- Vercel AI SDK handles provider-executed tools automatically
- **New**: AI can now search your local music catalog (`tracks.json`, `collections.json`) for precise answers

### 3. Provider Selection (No Automatic Fallback)

**What Changed**: MetaDJai now uses OpenAI GPT-5.2 Instant by default, with Anthropic Claude Haiku 4.5 available as an optional provider. The system does **not** automatically fall back — the active provider is an explicit choice.

**New Behavior**:
```typescript
// Uses AI_PROVIDER to select OpenAI or Anthropic
const model = getModel()
```

**How to use Claude intentionally**:
- Set `AI_PROVIDER=anthropic`
- Optionally set `ANTHROPIC_AI_MODEL` to try other Claude models in the future.

### 4. Streaming Implementation

**What Changed**: Unified streaming via Vercel AI SDK.

**Old Implementation**:
```typescript
// Direct Anthropic SDK streaming
import Anthropic from "@anthropic-ai/sdk";
const stream = await anthropic.messages.stream({...});
```

**New Implementation**:
```typescript
// Vercel AI SDK streaming (works for both providers)
import { streamText } from "ai";
const result = streamText({
  model,  // openai or anthropic model
  messages,
  tools,  // Includes searchCatalog and native web search
  maxSteps: 5, // Enables multi-step reasoning (search -> answer)
  onChunk: (chunk) => {
    // Unified chunk format regardless of provider
  }
});
```

**Benefits**:
- Same streaming API for both providers
- Consistent message format
- Automatic error handling
- Built-in retry logic

## Migration Checklist

### Pre-Migration Preparation

- [ ] **Backup current configuration**
  - Export Replit Secrets
  - Document current model settings
  - Save `.env.example` state

- [ ] **Obtain API Keys**
  - [ ] OpenAI API key from https://platform.openai.com/
  - [ ] Keep existing Anthropic key for optional provider (optional)

- [ ] **Review documentation**
  - [ ] Read this migration guide completely
  - [ ] Review updated README.md
  - [ ] Check `.env.example` for new variables

### Environment Setup

- [ ] **Update Replit Secrets** (Production)
  - [ ] Add `OPENAI_API_KEY`
  - [ ] Keep `ANTHROPIC_API_KEY` (optional Anthropic provider)
  - [ ] Remove deprecated `META_DJ_AI_MODEL`

- [ ] **Update Local Environment** (Development)
  - [ ] Create/update `.env` file
  - [ ] Add required keys
  - [ ] Test local development server

- [ ] **Verify Configuration**
  - [ ] Test OpenAI connection and native web search
  - [ ] Test Anthropic provider selection (optional)
  - [ ] Verify web search works with OpenAI provider

### Code Migration

✅ **Already Complete** - Code has been migrated in the repository:

- [x] Update dependencies (`package.json`)
- [x] Install Vercel AI SDK packages
- [x] Migrate streaming endpoint (`/api/metadjai/stream`)
- [x] Implement native web search (provider-executed tools)
- [x] Add optional Anthropic provider selection (no automatic fallback)
- [x] Update error handling

### Testing

- [ ] **Functional Testing**
  - [ ] Test MetaDJai chat with OpenAI
  - [ ] Test web search queries
  - [ ] Test streaming responses
  - [ ] Test conversation continuity

- [ ] **Optional Provider Testing**
  - [ ] Set `AI_PROVIDER=anthropic` with `ANTHROPIC_API_KEY`
  - [ ] Verify MetaDJai chat works on Claude
  - [ ] Switch back to OpenAI (`AI_PROVIDER=openai`)
  - [ ] Confirm web search works on OpenAI

- [ ] **Error Handling**
  - [ ] Test missing API keys
  - [ ] Test invalid API keys
  - [ ] Test rate limit scenarios
  - [ ] Verify error messages

### Documentation Updates

✅ **Already Complete** - Documentation updated:

- [x] Update README.md environment variables section
- [x] Create MIGRATION-GUIDE.md (this file)
- [x] Update CLAUDE.md with AI configuration
- [x] Update `.env.example` with new variables
- [x] Update operations/BUILD-DEPLOYMENT-GUIDE.md if needed

### Deployment

- [ ] **Pre-Deployment**
  - [ ] Run full test suite (`npm test`)
  - [ ] Run linting (`npm run lint`)
  - [ ] Build production bundle (`npm run build`)
  - [ ] Verify no TypeScript errors

- [ ] **Deployment Steps**
  - [ ] Commit migration changes
  - [ ] Deploy to Replit
  - [ ] Monitor initial requests
  - [ ] Check error logs

- [ ] **Post-Deployment Validation**
  - [ ] Test MetaDJai chat in production
  - [ ] Verify web search works
  - [ ] Monitor API usage
  - [ ] Check performance metrics

## Switching Between Providers

### Using OpenAI (Default)

```bash
# Set in Replit Secrets or .env
OPENAI_API_KEY=sk-proj-...
AI_PROVIDER=openai  # Optional, this is default
PRIMARY_AI_MODEL=gpt-5.2-chat-latest  # Optional, this is default
```

### Using Anthropic Exclusively

```bash
# Set in Replit Secrets or .env
ANTHROPIC_API_KEY=sk-ant-...
AI_PROVIDER=anthropic
ANTHROPIC_AI_MODEL=claude-4-5-haiku-20251001
```

**Note**: Web search is only available with the OpenAI provider in the current MetaDJai stack.

### Keeping Both Providers Available (Optional)

```bash
# OpenAI (default)
OPENAI_API_KEY=sk-proj-...
PRIMARY_AI_MODEL=gpt-5.2-chat-latest

# Anthropic (optional)
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_AI_MODEL=claude-4-5-haiku-20251001

# Provider selection (explicit, no automatic fallback)
AI_PROVIDER=openai
```

**Note**: Web search is available only when using OpenAI via the `web_search` tool.

## Web Search Changes

### Migration from Experimental to Native Web Search

**Old Pattern** (Experimental Anthropic):
```typescript
// Limited, experimental Anthropic web search
// Tied to Anthropic provider only
// Beta feature with limited documentation
```

**New Pattern** (Native Provider Tools):
```typescript
// Web search is handled automatically by Vercel AI SDK 5
// OpenAI: Uses web_search tool (provider-executed)
// Claude: no web_search tool enabled in MetaDJai today
// No manual configuration needed - works out of the box
```

**Benefits**:
- **Native Integration**: Built into OpenAI provider
- **Simplified Architecture**: No external search dependencies
- **Included with Subscription**: No additional costs or API keys
- **Automatic Handling**: Vercel AI SDK manages provider-executed tools

### How Provider-Executed Tools Work

**Vercel AI SDK 5 Behavior**:
1. AI model decides when web search is needed
2. Provider executes search using native tools
3. Results returned to model context automatically
4. Model generates response using search results

**No Configuration Required**: OpenAI handles web search as a provider-executed tool (`web_search`). Vercel AI SDK automatically manages execution—no manual search implementation needed.

## Backward Compatibility

### What Still Works

✅ **UI/UX**: No changes to user-facing interface
✅ **Chat Interface**: Same UI, same experience
✅ **Conversation History**: Local-only, no persistence changes
✅ **System Prompt**: MetaDJ AI prompt unchanged
✅ **Streaming**: Same real-time streaming experience
✅ **Keyboard Shortcuts**: Same shortcuts (Enter, Shift+Enter)

### What Changed Under the Hood

⚠️ **Model**: GPT-5.2 Instant instead of Claude Haiku 4.5 (primary)
⚠️ **Web Search**: Native provider-executed tools instead of experimental Anthropic search
⚠️ **Provider**: Dual-provider support with explicit selection (no automatic fallback)
⚠️ **Dependencies**: Vercel AI SDK instead of direct Anthropic SDK

### Breaking Changes for Developers

If you're building on this codebase:

1. **Environment Variables**: Must update all keys
2. **Import Statements**: Use Vercel AI SDK imports
3. **Streaming API**: Use `streamText()` not Anthropic SDK
4. **Web Search**: Native provider-executed tools (automatic)
5. **Error Handling**: Handle both OpenAI and Anthropic errors

## Cost Comparison

### Pricing (as of November 2025)

**OpenAI GPT-5.2 Instant**:
- Input: ~$0.10 per 1M tokens
- Output: ~$0.30 per 1M tokens
- Web Search: Included (no additional cost)
- Speed: Very fast (~2x faster than Haiku)

**Anthropic Claude 4.5 Haiku**:
- Input: $0.25 per 1M tokens
- Output: $1.25 per 1M tokens
- Web Search: Not enabled in MetaDJai today (OpenAI only)
- Speed: Fast

### Expected Impact

For typical MetaDJai usage (companion chat):
- **Primary (GPT-5.2 Instant)**: Similar cost reduction vs. Claude (verify pricing if OpenAI updates rates)
- **Web Search**: No additional cost (included with AI provider)
- **Optional Provider (Claude)**: Use intentionally via `AI_PROVIDER=anthropic` (no auto fallback)
- **Overall**: Simplified billing (only AI provider costs)

## Troubleshooting

### MetaDJai Chat Not Working

**Symptom**: Chat returns 503 error or "Service unavailable"

**Solutions**:
1. Check `OPENAI_API_KEY` is set correctly
2. Verify Replit Secrets are active
3. Check OpenAI account has credits
4. Try Claude provider: Set `AI_PROVIDER=anthropic`

### Web Search Failing

**Symptom**: Web search queries not working

**Solutions**:
1. Verify AI provider API keys are valid (web search requires valid provider credentials)
2. Check provider account is active and has credits
3. Ensure Vercel AI SDK 5 is installed correctly
4. Verify network connectivity to AI provider

### Anthropic Provider Not Working

**Symptom**: Chat fails when using `AI_PROVIDER=anthropic`

**Solutions**:
1. Ensure `ANTHROPIC_API_KEY` is set
2. Check Anthropic account is active
3. Verify error handling in logs
4. Check both providers are accessible

### Streaming Issues

**Symptom**: Responses don't stream, arrive all at once

**Solutions**:
1. Check browser supports SSE (Server-Sent Events)
2. Verify no proxy blocking streaming
3. Check network isn't buffering
4. Review streaming implementation

## Performance Comparison

### Response Times (Approximate)

**GPT-5.2 Instant**:
- Time to First Token: ~150-250ms
- Streaming Speed: ~50-80 tokens/sec
- Total Response: 2-4s for typical query

**Claude Haiku 4.5**:
- Time to First Token: ~200-350ms
- Streaming Speed: ~40-60 tokens/sec
- Total Response: 3-5s for typical query

### Quality Comparison

**GPT-5.2 Instant**:
- Strengths: Speed, reasoning, code generation
- Use Cases: Quick responses, technical queries, music recommendations

**Claude 4.5 Haiku**:
- Strengths: Nuance, context retention, creative writing
- Use Cases: Conversational depth, brand voice consistency

Both models provide excellent quality for MetaDJai companion use.

## Rollback Procedure

If migration issues occur, rollback is straightforward:

### Quick Rollback (Switch to Anthropic)

```bash
# Update Replit Secrets or .env
AI_PROVIDER=anthropic
ANTHROPIC_AI_MODEL=claude-4-5-haiku-20251001
```

This switches to Anthropic without code changes.

### Full Rollback (Previous Architecture)

1. Revert to previous commit:
   ```bash
   git revert <migration-commit-hash>
   ```

2. Restore old environment variables:
   ```bash
   ANTHROPIC_API_KEY=sk-ant-...
   META_DJ_AI_MODEL=claude-4-5-haiku-20251001
   ```

3. Reinstall old dependencies:
   ```bash
   npm install @anthropic-ai/sdk@0.32.1
   ```

4. Redeploy application

## Support & Resources

### Documentation

- **This Guide**: Complete migration reference
- **README.md**: Updated environment variables
- **CLAUDE.md**: Development standards with AI config
- **.env.example**: Template with new variables
- **operations/BUILD-DEPLOYMENT-GUIDE.md**: Production deployment guide

### API Documentation

- **OpenAI Platform**: https://platform.openai.com/docs
- **Anthropic Claude**: https://docs.anthropic.com/
- **Tavily Search**: https://docs.tavily.com/
- **Vercel AI SDK**: https://sdk.vercel.ai/docs

### Support Channels

- **Issues**: Open GitHub issue in `metadj-all-access` repository
- **Email**: contact@metadj.com
- **Technical**: MetaDJ via Zuberant channels

## Conclusion

This migration provides:
- ✅ **Better Performance**: GPT-5.2 Instant is faster and more reliable for tools and long‑context
- ✅ **Lower Costs**: ~60-70% cost reduction
- ✅ **Improved Reliability**: Explicit provider selection (no automatic fallback)
- ✅ **Native Web Search**: OpenAI provider tool, no external dependencies
- ✅ **Simplified Architecture**: Fewer dependencies, easier maintenance
- ✅ **Future-Proof**: Dual-provider architecture with provider-executed tools

The migration is backward compatible from a user perspective—listeners experience the same MetaDJai companion with improved performance and reliability under the hood.

---

**Migration completed**: November 2025
**Next review**: Quarterly performance analysis
