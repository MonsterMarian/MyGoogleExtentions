# Google Extensions Suite - Productivity Framework

Tento repozitář obsahuje sadu specializovaných prohlížečových rozšíření zaměřených na optimalizaci pracovního toku, eliminaci distrakcí a inteligentní analýzu obsahu na platformě YouTube. Systém využívá pokročilé modely umělé inteligence pro sémantickou filtraci a automatizaci procesů.

---

## Přehled modulů

### [YouTube Goal Blocker (The Judge)](./YOUTUBE_Blocker/)
Nástroj pro striktní vynucení hluboké práce a eliminaci prokrastinace.
- **Funkce**: Systém vyžaduje od uživatele zdůvodnění relevance sledovaného obsahu vzhledem k definovaným dlouhodobým cílům.
- **Implementace**: Využívá kaskádový systém modelů Gemini pro okamžitou analýzu záměru uživatele vs. metadat videa.
- **Vlastnosti**: Automatická detekce edukativního obsahu a hudby, blokování ovládacích prvků přehrávače do momentu schválení, logging statistik schvalovacího procesu.

### [PromoSkiper AI](./PromoSkiper/PromoSkiper_Ext/)
Inteligentní engine pro automatické přeskakování integrovaných marketingových sdělení.
- **Funkce**: Analýza transkriptů videa v reálném čase za účelem identifikace sponzorovaných segmentů.
- **Implementace**: Využívá LLM pro extrakci časových značek (start/end) s vysokou přesností.
- **Vlastnosti**: Detekce kategorií (Sponsor, Self-promotion, Intro/Outro), lokální cache pro minimalizaci API latence, guardrails pro eliminaci falešně pozitivních detekcí u dlouhých segmentů.

### [Focus Blocker (Merged)](./Merged_Blocker/)
Sjednocený bezpečnostní modul pro ochranu pozornosti.
- **Funkce**: Kombinuje nízkoúrovňové blokování specifických komponent prohlížeče.
- **Vlastnosti**:
  - **Extension Guard**: Automatické uzavírání systémových karet doplňků v definovaných časových oknech pro prevenci obcházení restrikcí.
  - **Shorts Terminator**: Eliminace přístupu k YouTube Shorts za účelem ochrany kognitivní kapacity uživatele.

---

## Technická specifikace: Gemini Fallback Cascade

Pro dosažení vysoké dostupnosti a odolnosti vůči limitům bezplatných API (Rate Limits) byla implementována architektura kaskádového fallbacku. V případě selhání primárního modelu (chyba 429 nebo 503) systém automaticky a transparentně iteruje skrze definované záložní instance.

**Prioritní pořadí modelů:**
1. gemini-2.0-flash
2. gemini-2.5-flash
3. gemini-flash-latest
4. gemini-flash-lite-latest
5. gemini-2.5-flash-lite

Tato hierarchie zajišťuje optimální poměr mezi rychlostí odezvy a dostupnou denní kvótou (až 1500 požadavků denně na jednu instanci).

---

## Instalace a konfigurace

1. **Klonování repozitáře**: 
   `git clone https://github.com/MonsterMarian/MyGoogleExtentions.git`

2. **Nasazení do prohlížeče**:
   - Navštivte `chrome://extensions/`.
   - Aktivujte vývojářský režim (Developer mode).
   - Použijte volbu "Načíst nerozbalené" (Load unpacked) a zvolte kořenový adresář vybraného rozšíření.

3. **Správa API klíčů**:
   - Rozšíření obsahují výchozí sdílený klíč pro okamžitou funkčnost.
   - Pro individuální nasazení a vyšší kvóty doporučujeme zadat vlastní API klíč v sekci Možnosti (Options) daného rozšíření. Klíč lze získat v [Google AI Studio](https://aistudio.google.com/).

