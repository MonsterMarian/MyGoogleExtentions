# PromoSkiper AI ⏩

Chrome extension, která využívá Gemini AI k automatickému detekování a přeskakování otravných promo částí, sponzorů a dlouhých inter v YouTube videích.

## Funkce
- **AI Analýza:** Využívá Google Gemini k analýze titulků videa.
- **Automatické Přeskakování:** Jakmile video dosáhne začátku promo segmentu, automaticky ho přetočí na konec.
- **Guardrails:** Automaticky ignoruje segmenty delší než 5 minut (prevence chyb AI).
- **Caching:** Výsledky pro každé video se ukládají lokálně, takže se AI neptá dvakrát na stejné video.

## Instalace
1. Otevři `chrome://extensions/` v prohlížeči.
2. Zapni **Režim vývojáře** (Developer mode).
3. Klikni na **Načíst rozbalené** (Load unpacked).
4. Vyber složku `PromoSkiper_Ext`.

## Nastavení
1. Klikni na ikonu rozšíření (PromoSkiper AI).
2. Vlož svůj **Gemini API Key**.
3. Ulož nastavení.

## Jak to funguje
1. Po načtení videa rozšíření stáhne titulky (transkript).
2. Pošle úryvek titulků do Gemini AI s instrukcí najít reklamy.
3. AI vrátí seznam časových rozmezí.
4. Rozšíření sleduje čas videa a v pravý moment skočí.
