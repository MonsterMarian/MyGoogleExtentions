# Google Extensions Suite

Repository obsahující kolekci specializovaných prohlížečových rozšíření pro automatizaci YouTube a zvýšení digitální produktivity.

---

## 📦 Obsažené Projekty

### [YouTube Goal Blocker (The Judge)](./YOUTUBE_Blocker/)
Pokročilý systém pro vynucení hluboké práce (Deep Work) na platformě YouTube.
- **Princip**: Blokuje přehrávání videí do momentu, kdy uživatel poskytne textové zdůvodnění relevance obsahu vůči jeho dlouhodobým cílům.
- **Technologie**: Využívá LLM **Gemini 1.5 Flash** pro sémantickou analýzu uživatelských cílů vs. obsahu videa.
- **Funkce**: Tracking schválených relací, automatická detekce vzdělávacího/pracovního obsahu a hudby.

### [PromoSkiper AI](./PromoSkiper/PromoSkiper_Ext/)
Inteligentní skip-engine pro eliminaci sponzorovaných segmentů.
- **Princip**: V reálném čase analyzuje transkript videa a identifikuje propagační pasáže.
- **Technologie**: Gemini 1.5 Flash API s vynuceným JSON výstupem pro přesné časování.
- **Funkce**: Automatické přeskakování (Sponsor, Self-promo, Intro), lokální caching výsledků pro minimalizaci API latence.

### [Focus Blocker (Merged)](./Merged_Blocker/)
Kombinovaný nástroj pro striktní blokování distraktorů.
- **Obsah**: Sjednocuje funkce modulů `Google_ET` a `yt-shorts-blocker`.
- **Funkce**:
  - **Extension Guard**: Automatické uzavírání karty doplňků v definovaných časových oknech (prevence obcházení blokace).
  - **Shorts Terminator**: Okamžitá terminace všech YouTube Shorts záložek.

### [Google_ET](./Google_ET/) & [yt-shorts-blocker](./yt-shorts-blocker/)
Jednoúčelové mikro-moduly pro uživatele, kteří preferují separátní instalaci specifických funkcí (Extension Tab closer / Shorts blocker).

---

## 🛠 Technické Podrobnosti

### AI Model & Fallbacks
Rozšíření jsou optimalizována pro řadu modelů **Google Gemini 1.5**. Implementován je inteligentní fallback systém:
1. `gemini-1.5-flash` (Primární – 1500 RPM limit)
2. `gemini-1.5-flash-8b` (Záloha)
3. `gemini-2.0-flash` (Záloha)

### API Konfigurace
- **Default Key**: Repozitář obsahuje integrovaný API klíč pro okamžitou funkčnost po instalaci.
- **Custom Key**: Uživatelé mohou v nastavení (Chrome Storage) definovat vlastní klíč pro vyšší limity.

---

## 🚀 Instalace
1. Naklonujte repozitář: `git clone https://github.com/MonsterMarian/MyGoogleExtentions.git`
2. Otevřete `chrome://extensions/`.
3. Aktivujte **Developer mode**.
4. Zvolte **Load unpacked** a vyberte složku konkrétního rozšíření.

---
© 2026 Focus Suite Development
