// Stavové proměnné
let state = {
    overlayActive: false,
    approvedVideoIds: new Set(),
    currentVideoId: null,
    pendingChecks: new Set()
};

// Funkce na získání YouTube video ID z URL
function getVideoId() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('v');
}

// Agresivní pozastavení videa a potlačení hlasitosti, aby nehrálo na pozadí
function forcePauseVideo() {
    if (!state.overlayActive && state.pendingChecks.size === 0) return;
    const videos = document.querySelectorAll('video');
    videos.forEach(video => {
        if (!video.paused) {
            video.pause();
        }
        // Přetoč na začátek + potichu (pro jistotu) jen pokud jsme v overlay
        if (state.overlayActive && video.currentTime > 0.5) video.currentTime = 0;
    });
}

// Ochrana proti obcházení klávesovými zkratkami (mezerník, k apod.) na YouTube
function preventBypassing() {
    const eventsToBlock = ['keydown', 'keyup', 'keypress'];
    eventsToBlock.forEach(eventType => {
        window.addEventListener(eventType, (e) => {
            if (state.overlayActive) {
                // Povolíme psaní do textarea (ignorovat pro překrytí)
                const inOverlay = e.composedPath().find(el => el.id === 'yt-goal-blocker-overlay');
                if (!inOverlay) {
                    e.stopImmediatePropagation();
                    e.preventDefault();
                }
            }
        }, true); // Capture fáze - zablokujeme to než se to dostane k YouTube
    });

    // Také klikání myší mimo overlay (např. klik na tlačítko play na videu)
    window.addEventListener('click', (e) => {
        if (state.overlayActive) {
            const inOverlay = e.composedPath().find(el => el.id === 'yt-goal-blocker-overlay');
            if (!inOverlay) {
                e.stopImmediatePropagation();
                e.preventDefault();
                // Pokud klikli naprázno na zablokovaný pařež, ujistíme se, že video je pauznuté
                forcePauseVideo();
            }
        }
    }, true);
}

// Funkce na získání názvu kanálu
function getChannelName() {
    const channelElement = document.querySelector('#upload-info #channel-name a, .ytd-video-owner-renderer #channel-name a, #owner-name a');
    return channelElement ? channelElement.textContent.trim() : "";
}

// Funkce pro robustní získání názvu videa (čeká na načtení)
async function getRobustVideoTitle() {
    for (let i = 0; i < 15; i++) {
        const title = document.title.replace(" - YouTube", "").trim();
        if (title && title !== "YouTube" && title !== "YouTube ") {
            return title;
        }
        await new Promise(r => setTimeout(r, 200));
    }
    return document.title.replace(" - YouTube", "").trim();
}

async function askJudgeAI(prompt, settings) {
    const modelsToTry = [
        "gemini-2.0-flash",
        "gemini-2.5-flash",
        "gemini-flash-latest",
        "gemini-flash-lite-latest",
        "gemini-2.5-flash-lite"
    ];
    
    let lastError = null;
    const apiKey = settings.geminiApiKey || 'AIzaSyBJMEEDtTkLC2Nr-tjlqquFdDqpZZRw6ME';
    for (const modelName of modelsToTry) {
        try {
            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: prompt }]
                    }]
                })
            });

            if (res.ok) {
                const data = await res.json();
                const aiText = data.candidates[0].content.parts[0].text;
                const cleanJsonText = aiText.replace(/```json/g, "").replace(/```/g, "").trim();
                return JSON.parse(cleanJsonText);
            } else {
                lastError = new Error(`HTTP error ${res.status}`);
            }
        } catch (e) {
            lastError = e;
        }
    }
    throw lastError || new Error("Nepodařilo se spojit se SOUDCEM.");
}

async function autoCheckVideo(videoId) {
    if (state.approvedVideoIds.has(videoId) || state.pendingChecks.has(videoId) || state.overlayActive) return;

    state.pendingChecks.add(videoId);
    forcePauseVideo();

    try {
        const settings = await new Promise((resolve) => {
            chrome.storage.sync.get(['geminiApiKey', 'userGoals'], resolve);
        });



        const videoTitle = await getRobustVideoTitle();
        const channelName = getChannelName();
        const userGoals = settings.userGoals || "Žádné specifické cíle nebyly zadány.";
        
        // Rozšířená detekce hudby
        const isMusic = !!document.querySelector('meta[itemprop="genre"][content="Music"]') || 
                        videoTitle.toLowerCase().includes("music") || 
                        videoTitle.toLowerCase().includes("hudba") ||
                        channelName.toLowerCase().includes("vevo") ||
                        channelName.toLowerCase().includes("records") ||
                        channelName.toLowerCase().includes("topic");

        const prompt = `Jsi AI Soudce Produktivity.
Uživatel se chystá sledovat toto YouTube video: "${videoTitle}"
Kanál: "${channelName}"
${isMusic ? "INFO: Systém detekoval, že jde pravděpodobně o HUDBU." : ""}

Tvůj úkol:
PROVEĎ RYCHLÉ PŘEDBĚŽNÉ ROZHODNUTÍ.
- Pokud se jedná o HUDBU (písničky, soundtracky, lo-fi, hudební mixy k práci), odpověz "APPROVE".
- Pro VŠECHNO OSTATNÍ (vzdělávání, tutoriály, dokumenty, zábava, gaming, podcasty, zprávy atd.), pokud to není primárně hudební video, MUSÍŠ odpovědět "NEED_REASON". Uživatel mě výslovně požádal: 'jen pokud to není hudba, tak ho musím přesvědčit'.

Odpověz POUZE jako JSON:
{
  "verdict": "APPROVE" nebo "NEED_REASON",
  "comment": "Krátký (1 věta) komentář k tvému rozhodnutí v češtině"
}`;

        const decision = await askJudgeAI(prompt, settings);

        if (decision.verdict === "APPROVE") {
            state.approvedVideoIds.add(videoId);
            state.pendingChecks.delete(videoId);
            console.log(`[SOUDCE] Automaticky schváleno: ${decision.comment}`);
            
            // Obnovit přehrávání
            const videos = document.querySelectorAll('video');
            videos.forEach(video => {
                video.play().catch(e => console.log('Autoplay prevented', e));
            });
        } else {
            state.pendingChecks.delete(videoId);
            createOverlay(videoId);
        }
    } catch (e) {
        console.error("[SOUDCE] Chyba při autochecku (pravděpodobně AI selhala nebo vrátila špatný formát):", e);
        state.pendingChecks.delete(videoId);
        // Pokud AI selže, raději se zeptáme ručně
        createOverlay(videoId);
    }
}

// Inicializace blokování pro konkrétní video
function createOverlay(videoId) {
    if (document.getElementById('yt-goal-blocker-overlay')) return;

    state.overlayActive = true;
    state.currentVideoId = videoId;
    document.body.classList.add('yt-blocker-no-scroll');

    const overlay = document.createElement('div');
    overlay.id = 'yt-goal-blocker-overlay';
    overlay.innerHTML = `
    <div id="yt-goal-blocker-container">
      <h2>Před spuštěním <span class="yt-blocker-accent">videa</span> 🛑</h2>
      <p style="color: #ccc; font-size: 0.9em; margin-bottom: 15px;">SOUDCE si není jistý, musíš to zdůvodnit.</p>
      
      <div class="yt-blocker-question">
        <label>Posune tě toto video k tvým cílům?</label>
        <div class="yt-blocker-radio-group">
          <label class="yt-blocker-radio-label">
            <input type="radio" name="yt-goal-radio" value="yes">
            <span class="yt-blocker-radio-custom"></span> Ano
          </label>
          <label class="yt-blocker-radio-label">
            <input type="radio" name="yt-goal-radio" value="no">
            <span class="yt-blocker-radio-custom"></span> Ne
          </label>
        </div>
      </div>

      <div class="yt-blocker-question">
        <label>Proč se na toto video potřebuješ podívat?</label>
        <textarea id="yt-goal-reason" class="yt-blocker-textarea" placeholder="Napiš zdůvodnění zde..."></textarea>
        <div id="yt-goal-error" class="yt-blocker-error"></div>
      </div>

      <button id="yt-blocker-submit">Předložit SOUDCI</button>
      <div id="yt-blocker-loader" class="yt-blocker-loader"></div>
      <div id="yt-blocker-verdict" class="yt-blocker-verdict"></div>
    </div>
  `;
    document.body.appendChild(overlay);
    forcePauseVideo();

    const submitBtn = document.getElementById('yt-blocker-submit');
    const errorMsg = document.getElementById('yt-goal-error');

    submitBtn.addEventListener('click', async () => {
        const radioVal = document.querySelector('input[name="yt-goal-radio"]:checked')?.value;
        const reason = document.getElementById('yt-goal-reason').value.trim();
        const loader = document.getElementById('yt-blocker-loader');
        const verdictBox = document.getElementById('yt-blocker-verdict');

        if (!radioVal) {
            showError(errorMsg, "Musíš vybrat jednu z možností (Ano/Ne)!");
            return;
        }
        
        if (reason.length < 5) {
            showError(errorMsg, "Napiš SOUDCI alespoň něco smysluplného!");
            return;
        }

        errorMsg.style.display = 'none';
        submitBtn.style.display = 'none';
        loader.style.display = 'block';
        verdictBox.style.display = 'none';

        try {
            const settings = await new Promise((resolve) => {
                chrome.storage.sync.get(['geminiApiKey', 'userGoals'], resolve);
            });

            const videoTitle = document.title.replace(" - YouTube", "");
            const isGoalRelated = radioVal === "yes" ? "Ano" : "Ne";
            const userGoals = settings.userGoals || "Žádné specifické cíle nebyly zadány.";

            const prompt = `Jsi AI Soudce Produktivity.
Uživatelův Dlouhodobý cíl: ${userGoals}

Uživatel se chystá sledovat toto YouTube video: "${videoTitle}"
Uživatel tvrdí, že ho toto video posune k cílům? ${isGoalRelated}
Uživatelovo osobní zdůvodnění: "${reason}"

Tvůj úkol: 
Zhodnoť, zda video souvisí s cíli. BUĎ ROZUMNÝ A TOLERANTNÍ.
POKUD JE CÍLEM "Maturita z programování" nebo IT, automaticky SCHVAL (APPROVE) prakticky jakékoliv IT/tech video.
Pokud jde o jasnou prokrastinaci, zamítni (REJECT).

Odpověz POUZE jako JSON:
{
  "verdict": "APPROVE" nebo "REJECT",
  "comment": "Tvůj krátký vtipný nebo povzbuzující komentář (max 2 věty)"
}`;

            const aiDecision = await askJudgeAI(prompt, settings);

            loader.style.display = 'none';
            verdictBox.style.display = 'block';
            verdictBox.textContent = aiDecision.comment || "SOUDCE PROMLUVIL.";

            const today = new Date().toISOString().split('T')[0];
            const statsKey = `stats_${today}`;

            if (aiDecision.verdict === "APPROVE") {
                verdictBox.className = "yt-blocker-verdict approved";
                
                chrome.storage.local.get([statsKey], (res) => {
                    const stats = res[statsKey] || { approved: 0, rejected: 0 };
                    stats.approved++;
                    chrome.storage.local.set({ [statsKey]: stats });
                });

                setTimeout(() => {
                    state.overlayActive = false;
                    state.approvedVideoIds.add(videoId);
                    document.body.classList.remove('yt-blocker-no-scroll');
                    overlay.remove();
                    
                    const videos = document.querySelectorAll('video');
                    videos.forEach(video => {
                        video.play().catch(e => console.log('Autoplay prevented', e));
                    });
                }, 3000);

            } else {
                verdictBox.className = "yt-blocker-verdict rejected";
                
                chrome.storage.local.get([statsKey], (res) => {
                    const stats = res[statsKey] || { approved: 0, rejected: 0 };
                    stats.rejected++;
                    chrome.storage.local.set({ [statsKey]: stats });
                });

                setTimeout(() => {
                    submitBtn.style.display = 'block';
                    submitBtn.textContent = "Zkusit se prosit znovu";
                }, 4000);
            }

        } catch (err) {
            loader.style.display = 'none';
            submitBtn.style.display = 'block';
            
            let errMsg = err.message || "Nepodařilo se spojit se SOUDCEM.";
            if (errMsg.includes("Extension context invalidated")) {
                errMsg = "Rozšíření bylo zrovna aktualizováno. Prosím obnov (F5) tuto stránku a zkus to znovu.";
            }
            
            showError(errorMsg, errMsg);
            console.error(err);
        }
    });
}

function showError(el, msg) {
    el.textContent = msg;
    el.style.display = "block";
    // Restartujeme animaci chvění
    el.style.animation = 'none';
    el.offsetHeight; // trigger reflow
    el.style.animation = null;
}

// Hlavní ověřovací smyčka
function checkVideoPlayback() {
    const isWatchPage = window.location.pathname === '/watch';

    // Pokud nejsme na stránce s videem (např. jsme se vrátili na hlavní stránku), schováme overlay
    if (!isWatchPage) {
        if (state.overlayActive) {
            if (document.body) document.body.classList.remove('yt-blocker-no-scroll');
            const overlay = document.getElementById('yt-goal-blocker-overlay');
            if (overlay) overlay.remove();
            state.overlayActive = false;
        }
        return;
    }

    const videoId = getVideoId();
    if (!videoId) return;

    // Schválená videa už se ptát nebudeme
    if (state.approvedVideoIds.has(videoId)) {
        return;
    }

    // Spustit automatickou kontrolu (ta buď povolí, nebo ukáže overlay)
    autoCheckVideo(videoId);
}

// Sledování změn v DOM (např. když se načte / přidá prvek video)
function createDomObserver() {
    return new MutationObserver((mutations) => {
        if (window.location.pathname === '/watch') {
            const videos = document.querySelectorAll('video');

            // Agresivně přidáváme event listenery na všechna videa (i dynamická)
            if (state.overlayActive) {
                videos.forEach(video => {
                    // Nasadit odposlech proti "play" události
                    if (!video.dataset.hasBlockerGuard) {
                        video.addEventListener('play', (e) => {
                            if (state.overlayActive) {
                                e.preventDefault();
                                video.pause();
                                video.currentTime = 0;
                            }
                        });
                        video.dataset.hasBlockerGuard = "true";
                    }
                    forcePauseVideo();
                });
            }

            // Pro kontrolu celkového stavu
            checkVideoPlayback();
        }
    });
}

const domObserver = createDomObserver();

// Inicializace pozorovatele s robustním čekáním na DOM
function initObserver() {
    const targetNode = document.documentElement || document.body;
    
    if (targetNode) {
        domObserver.observe(targetNode, { childList: true, subtree: true, attributes: false });
    } else {
        // Občas může být i documentElement na úplném začátku nahrávání stránek YouTube null.
        setTimeout(initObserver, 50);
    }
}
initObserver();

// Inicializace
preventBypassing();

// YouTube SPA Navigace - odposlech z background scriptu nebo pomocí vlastního odposlechu yt-navigate
window.addEventListener('yt-navigate-finish', () => {
    setTimeout(checkVideoPlayback, 200);
});

// Zpráva z background workeru (záloha)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "yt-navigate") {
        setTimeout(checkVideoPlayback, 300);
    }
});

// Úvodní spuštění na první čisté načtení URL
document.addEventListener("DOMContentLoaded", checkVideoPlayback);
setTimeout(checkVideoPlayback, 500);
