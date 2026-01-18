# Quick Reference: Model Logging

**Version**: 71afecd3-0b26-4043-bdc1-b22c7956b65a

---

## 🎯 Your Fallback Models (4 Total)

```
1. anthropic/claude-3.5-sonnet       ← Primary (paid, 100% deterministic)
2. google/gemini-2.0-flash-exp:free  ← Fallback 1 (free)
3. google/gemini-flash-1.5-8b        ← Fallback 2 (free)
4. xiaomi/mimo-v2-flash:free         ← Fallback 3 (free)
```

---

## 📊 Log Emoji Guide

| Emoji | Meaning |
|-------|---------|
| 🔄 | Trying a model |
| ✅ | Success |
| ❌ | Failure |
| ℹ️ | Info/summary |
| 🎲 | Seed info |

---

## 🔍 Quick Diagnostic

### See This → Means This:
```
✅ SUCCESS with model: anthropic/claude-3.5-sonnet
```
**Perfect!** Claude working, 100% deterministic results.

```
❌ FAILED with status 402
✅ SUCCESS with model: google/gemini-2.0-flash-exp:free
```
**Warning!** Claude out of credits, using free fallback.

```
❌ ALL MODELS FAILED!
```
**Critical!** Check OpenRouter status and API key.

---

## 🧪 Test Now

1. Press **F12** (open console)
2. Go to results page
3. Click **"Regenerate"**
4. Watch for `[AI]` logs

---

## 📋 Common Errors

| Code | Fix |
|------|-----|
| 402 | Add OpenRouter credits |
| 429 | Wait or upgrade plan |
| 503 | Retry in a few minutes |
| 401 | Check API key |

---

## ✅ Status

- **Logging**: ✅ Active
- **Models**: ✅ 4 configured
- **Metadata**: ✅ Tracking failures
- **Ready**: ✅ Yes!

