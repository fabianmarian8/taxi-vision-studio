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
- **Vykonáva**: Automatický linting zmenených súborov (lint-staged)
- **Účel**: Zabezpečiť, že do repozitára sa dostaví len kvalitný kód bez linting chýb

### Pre-push Hook
- **Spúšťa sa**: Pri každom `git push`
- **Vykonáva**: Všetky unit testy
- **Účel**: Zabezpečiť, že nepushnete kód s nefunkčnými testami

**Ak hook zlyháva**, commit alebo push sa neprevede. Opravte chyby a skúste znova.

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
