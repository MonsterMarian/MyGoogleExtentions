// PromoSkiper AI - Content Script

let currentVideoId = null;
let promoSegments = [];
let isProcessing = false;

// Helper: Get Video ID
function getVideoId() {
    const params = new URLSearchParams(window.location.search);
    return params.get('v');
}

// Helper: Format seconds to time
function formatTime(s) {
    const mins = Math.floor(s / 60);
    const secs = Math.floor(s % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// 1. Fetch Transcript Logic
async function fetchTranscript(videoId) {
    try {
        console.log('[PromoSkiper] Fetching transcript for', videoId);
        
        // Fetch the watch page to find caption tracks
        const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`);
        const html = await response.text();
        
        const regex = /"captionTracks":\s*(\[.*?\])/;
        const match = html.match(regex);
        
        if (!match) {
            console.warn('[PromoSkiper] No caption tracks found.');
            return null;
        }
        
        const captionTracks = JSON.parse(match[1]);
        // Find English or Czech track
        const track = captionTracks.find(t => t.languageCode === 'en' || t.languageCode === 'cs') || captionTracks[0];
        
        if (!track) return null;
        
        const transcriptRes = await fetch(track.baseUrl + '&fmt=json3');
        const transcriptData = await transcriptRes.json();
        
        // Convert to a simple string with timestamps for AI
        return transcriptData.events
            .filter(e => e.segs)
            .map(e => {
                const start = Math.floor(e.tStartMs / 1000);
                const text = e.segs.map(s => s.utf8).join(' ').replace(/\n/g, ' ').trim();
                return `[${start}s] ${text}`;
            })
            .join('\n');
    } catch (err) {
        console.error('[PromoSkiper] Transcript error:', err);
        return null;
    }
}

// 2. AI Analysis Logic
async function analyzeWithAI(transcript) {
    const settings = await chrome.storage.sync.get(['geminiApiKey']);
    const apiKey = settings.geminiApiKey || 'AIzaSyBJMEEDtTkLC2Nr-tjlqquFdDqpZZRw6ME';

    const prompt = `
Jsi expert na detekci sponzorovaných segmentů a promo částí ve videích. 
Zde je přepis YouTube videa s časovými značkami ve vteřinách:
---
${transcript}
---

Tvým úkolem je najít segmenty, které jsou:
1. Sponzor (např. "this video is sponsored by", "thanks to...")
2. Vlastní promo (např. "buy my merch", "join my Patreon", "follow me on Instagram")
3. Dlouhé intro/outro s reklamou.

PRAVIDLA:
- Maximální délka segmentu je 5 minut (300 sekund). Pokud je delší, ignoruj ho.
- Pokud nic nenajdeš, vrať prázdné pole [].
- Použij POUZE časové značky, které vidíš v přepisu. Nevymýšlej si je.
- Vrať čistý JSON (pole objektů) s atributy "start", "end", "type", "reason" a nic jiného.
Příklad:
[
  {"start": 120, "end": 180, "type": "sponsor", "reason": "Sponsorship for NordVPN"},
  {"start": 500, "end": 540, "type": "self-promo", "reason": "Merch store mention"}
]
`;

    try {
        const modelsToTry = [
            'gemini-1.5-flash',
            'gemini-1.5-flash-8b',
            'gemini-2.0-flash'
        ];
        
        let lastError = null;
        for (const model of modelsToTry) {
            try {
                const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                        generationConfig: {
                            response_mime_type: "application/json"
                        }
                    })
                });

                if (res.ok) {
                    const data = await res.json();
                    const aiResponse = data.candidates[0].content.parts[0].text;
                    const cleanJson = aiResponse.replace(/```json/g, "").replace(/```/g, "").trim();
                    return JSON.parse(cleanJson);
                } else {
                    lastError = new Error(`HTTP error ${res.status}`);
                }
            } catch (e) {
                lastError = e;
            }
        }
        throw lastError || new Error("All models failed");
    } catch (err) {
        console.error('[PromoSkiper] AI error:', err);
        return null;
    }
}

// 3. Application Logic
async function processVideo() {
    const videoId = getVideoId();
    if (!videoId || videoId === currentVideoId) return;
    
    currentVideoId = videoId;
    promoSegments = [];
    isProcessing = true;
    
    console.log('[PromoSkiper] New video detected:', videoId);
    
    // Check cache
    const cacheKey = `promo_${videoId}`;
    const cached = await chrome.storage.local.get([cacheKey]);
    if (cached[cacheKey]) {
        promoSegments = cached[cacheKey];
        console.log('[PromoSkiper] Loaded from cache:', promoSegments);
        isProcessing = false;
        return;
    }

    const transcript = await fetchTranscript(videoId);
    if (!transcript) {
        console.warn('[PromoSkiper] Could not get transcript.');
        isProcessing = false;
        return;
    }

    const segments = await analyzeWithAI(transcript);
    if (segments) {
        // Filter by guardrails
        promoSegments = segments.filter(s => (s.end - s.start) < 300);
        chrome.storage.local.set({ [cacheKey]: promoSegments });
        console.log('[PromoSkiper] Detected promo segments:', promoSegments);
        notifyUser(promoSegments);
    }
    
    isProcessing = false;
}

// 4. Skipping Logic
function startSkipper() {
    setInterval(() => {
        if (isProcessing) return;
        
        const video = document.querySelector('video');
        if (!video || promoSegments.length === 0) return;
        
        const currentTime = video.currentTime;
        
        for (const segment of promoSegments) {
            if (currentTime >= segment.start && currentTime < segment.end) {
                console.log(`[PromoSkiper] Skipping promo: ${segment.reason} (${formatTime(segment.start)} - ${formatTime(segment.end)})`);
                video.currentTime = segment.end;
                showSkipIndicator(segment.reason);
                break;
            }
        }
    }, 500);
}

// UI: Show skip indicator
function showSkipIndicator(reason) {
    let indicator = document.getElementById('promo-skip-indicator');
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'promo-skip-indicator';
        document.body.appendChild(indicator);
    }
    
    indicator.textContent = `⏩ Přeskočeno promo: ${reason}`;
    indicator.classList.add('visible');
    
    setTimeout(() => {
        indicator.classList.remove('visible');
    }, 3000);
}

function notifyUser(segments) {
    if (segments.length === 0) return;
    console.log(`[PromoSkiper] AI našlo ${segments.length} promo částí.`);
}

// Listeners
window.addEventListener('yt-navigate-finish', processVideo);
document.addEventListener('DOMContentLoaded', () => {
    processVideo();
    startSkipper();
});

// Initial check
setTimeout(processVideo, 1000);
