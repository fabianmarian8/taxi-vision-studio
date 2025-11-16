# Testovanie

## Inštalácia dependencies

```bash
npm install
```

**Dôležité**: Pri prvej inštalácii sa automaticky nakonfigurujú Git Hooks pomocou Husky.

## Spustenie testov

```bash
# Spustenie všetkých testov
npm test

# Spustenie testov vo watch móde
npm run test:watch

# Spustenie testov s UI
npm run test:ui
```

## Linting

```bash
# Spustenie ESLint
npm run lint
```

## Git Hooks (Husky)

Projekt používa Husky pre automatické kontroly pred commitom a pushom:

### Pre-commit Hook
- **Spúšťa sa**: Pri každom `git commit`
- **Vykonáva**: Automatický linting a oprava zmenených súborov (lint-staged)
- **Správanie**: Automaticky opraví čo sa dá (--fix), ale neblokovať commit
- **Účel**: Udržiavať kód čistý a formátovaný

### Pre-push Hook
- **Spúšťa sa**: Pri každom `git push`
- **Vykonáva**: Všetky unit testy
- **Správanie**: **Blokuje push** ak testy zlyhajú
- **Účel**: Zabezpečiť, že nepushnete kód s nefunkčnými testami

**Poznámka**: Pre-commit hook opravuje linting, ale neblokovať commit. Pre-push hook **blokuje push** ak testy zlyhajú. GitHub Actions CI kontroluje všetko pred deployom.

## Build

```bash
# Production build
npm run build

# Development build
npm run build:dev
```

## CI/CD

Projekt používa GitHub Actions pre CI/CD:

- **CI Pipeline** (`.github/workflows/ci.yml`): Spúšťa sa pri každom pushu a PR
  - Linting (ESLint)
  - Unit testy (Vitest)
  - Build

- **Deploy Pipeline** (`.github/workflows/deploy.yml`): Spúšťa sa len pri pushu do main vetvy
  - Najprv beží celý CI pipeline
  - Po úspešnom CI sa vykoná deploy na GitHub Pages

## Štruktúra testov

- `src/lib/utils.test.ts` - Testy pre utility funkcie
- `src/components/ui/button.test.tsx` - Testy pre Button komponent
- `src/test/setup.ts` - Konfigurácia testovania
