document.addEventListener('DOMContentLoaded', () => {
    // Načte dnešní datum jako klíč (např. "2023-10-25")
    const today = new Date().toISOString().split('T')[0];
    
    chrome.storage.local.get([`stats_${today}`], (result) => {
        const stats = result[`stats_${today}`] || { approved: 0, rejected: 0 };
        document.getElementById('count-approved').textContent = stats.approved;
        document.getElementById('count-rejected').textContent = stats.rejected;
    });

    document.getElementById('open-settings').addEventListener('click', () => {
        chrome.runtime.openOptionsPage();
    });
});
