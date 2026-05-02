// Uložení nastavení
document.getElementById('saveBtn').addEventListener('click', () => {
    const apiKey = document.getElementById('apiKey').value.trim();
    const goals = document.getElementById('goals').value.trim();

    chrome.storage.sync.set({
        geminiApiKey: apiKey,
        userGoals: goals
    }, () => {
        // Zobrazí potvrzení
        const status = document.getElementById('status');
        status.style.display = 'block';
        setTimeout(() => {
            status.style.display = 'none';
        }, 3000);
    });
});

// Načtení stávajícího nastavení při otevření stránky
document.addEventListener('DOMContentLoaded', () => {
    chrome.storage.sync.get(['geminiApiKey', 'userGoals'], (items) => {
        if (items.geminiApiKey) {
            document.getElementById('apiKey').value = items.geminiApiKey;
        }
        if (items.userGoals) {
            document.getElementById('goals').value = items.userGoals;
        }
    });
});
