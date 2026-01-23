# Context Summary

## Current Status
- **Project**: taxi-vision-studio (Next.js taxi aggregator)
- **Phase**: P0 Security Fixes - COMPLETED
- **Task**: Testing & Verification - DONE

## Completed Work

### P0 Security Fixes (všetky dokončené)
1. **P0.1 IDOR in Stripe Portal** - Opravené: `stripe_customer_id` sa berie z DB podľa session user ID
2. **P0.2 Missing Auth in log-login** - Opravené: Validuje session cez `supabase.auth.getUser()`
3. **P0.3 Telegram Webhook** - Opravené: Verifikuje `x-telegram-bot-api-secret-token` header
4. **P0.4 Revalidate Endpoint** - Opravené: Rate limiting cez Upstash Redis + secret token

### Upstash Redis Setup
- Vytvorená databáza "taxi-rate-limit" cez browser automation
- Credentials pridané do Vercel (Production, Preview, Development)
- Rate limit: 10 requests/minute per IP (sliding window)

### Testovanie (všetko prešlo)
- **Unit testy**: 31/31 passed
- **API Auth testy**: Všetky endpointy vracajú 401 bez autentifikácie
- **Rate limiting**: Funguje - po 13 requestoch vracia HTTP 429
- **Redis PING**: PONG ✅

## Technical Context

### Kľúčové súbory
- `lib/rate-limiter.ts` - Upstash rate limiter config
- `app/api/revalidate/route.ts` - Rate limiting + secret token
- `app/api/stripe/portal/route.ts` - IDOR fix
- `app/api/audit/log-login/route.ts` - Session auth fix
- `app/api/telegram-webhook/route.ts` - Webhook secret verification

### Environment Variables (Vercel)
Všetky nakonfigurované pre Production, Preview, Development:
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `REVALIDATE_SECRET`
- `TELEGRAM_WEBHOOK_SECRET`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`

### Rate Limiting vysvetlenie
- Chráni pred DDoS z jednej IP (blokuje po 10 req/min)
- Spomaľuje brute force útoky
- Limituje API abuse
- Pre distribuované DDoS (tisíce IP) potrebná dodatočná ochrana (Cloudflare)

## Recent User Questions
- User sa pýtal čo rate limiting znamená prakticky
- Vysvetlené: AI bot s veľa požiadavkami bude blokovaný po 10 req/min

## Next Steps
- P0 security fixes sú kompletné
- Projekt je pripravený na ďalší vývoj
- Možné vylepšenia:
  - Pridať rate limiting na ďalšie citlivé endpointy
  - Nastaviť Cloudflare WAF pravidlá pre distribuované útoky
  - Monitoring rate limit metrík v Upstash dashboard

## Dev Server
- Beží na `localhost:3001` (port 3000 bol obsadený)
- Log: `/tmp/next-dev.log`
