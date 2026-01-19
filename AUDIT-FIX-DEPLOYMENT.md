# Audit Logging Fix - Deployment Instructions

## Problém
1. Audit trigger používal `auth.uid()`, čo vracalo NULL pri service role operáciách
2. Login audit zlyhával kvôli timing problémom so session cookies

## Riešenie
Vytvorený systematic approach s session variables a priamym predávaním user info.

## Deployment kroky

### 1. Spustenie SQL scriptu
```bash
# Spustiť na Supabase databáze
psql -h your-db-host -d your-db -f scripts/audit-trigger-fixed.sql
```

Alebo v Supabase Dashboard > SQL Editor:
- Skopírovať obsah `scripts/audit-trigger-fixed.sql`
- Spustiť

### 2. Testovanie funkcionalít

#### Test 1: Partner login audit
```bash
# 1. Prihlásiť sa ako partner v /partner/login
# 2. Skontrolovať audit.activity_log:
SELECT * FROM audit.activity_log
WHERE table_name = 'sessions'
  AND operation = 'LOGIN'
ORDER BY created_at DESC
LIMIT 5;
```

#### Test 2: Service role operations
```sql
-- Simulovať service role operáciu s audit context
SELECT set_audit_context('550e8400-e29b-41d4-a716-446655440000', 'test@example.com', '192.168.1.1');

UPDATE public.partners SET name = 'Test Update' WHERE id = 'some-partner-id';

-- Skontrolovať audit log
SELECT user_id, user_email, ip_address, operation, changed_fields
FROM audit.activity_log
WHERE table_name = 'partners'
ORDER BY created_at DESC
LIMIT 1;
```

### 3. Príklady používania v kóde

#### V API endpointoch (service role)
```typescript
import { setAuditContext } from '@/lib/audit-context';

// Pred UPDATE/INSERT operáciou
await setAuditContext(serviceClient, userId, userEmail, ipAddress);
await serviceClient.from('partners').update(data);
```

#### V client-side operáciách (user session)
```typescript
import { setAuditContextFromAuth } from '@/lib/audit-context';

// Automaticky vezme user info z session
await setAuditContextFromAuth(supabase);
await supabase.from('partners').update(data);
```

## Nové RPC funkcie

### `set_audit_context`
Nastavuje session variables pre audit trigger.
```sql
SELECT set_audit_context('user-uuid', 'user@email.com', 'ip-address');
```

### `log_partner_login`
Príamo loguje partner prihlásenia.
```sql
SELECT log_partner_login('user-uuid', 'user@email.com', 'ip-address');
```

## Verifikácia úspešnosti

Po deployment by mali fungovať:
1. ✅ Audit logging pri service role operáciách
2. ✅ Partner login audit bez session timing problémov
3. ✅ Zachovanie existujúcej funkcionality pre RLS operácie
4. ✅ User info sa správne zachytáva vo všetkých scenároch

## Troubleshooting

### Ak audit.activity_log má NULL user_id
- Skontrolovať, či sa volá `set_audit_context` pred operáciou
- Overiť, že RPC funkcie sú správne vytvorené

### Ak login audit nefunguje
- Skontrolovať Network tab - API endpoint by mal vrátiť `{ success: true, logged: true }`
- Overiť, že `log_partner_login` RPC existuje

### Ak sa RPC funkcie nenájdu
```sql
-- Skontrolovať existenciu funkcií
SELECT proname FROM pg_proc WHERE proname IN ('set_audit_context', 'log_partner_login');
```