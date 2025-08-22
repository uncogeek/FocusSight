const activateBtn = document.getElementById('activateBtn');
const undoBtn = document.getElementById('undoBtn');
const resetBtn = document.getElementById('resetBtn');
const status = document.getElementById('status');
const autoActivateToggle = document.getElementById('autoActivateToggle');
const domainDisplay = document.getElementById('domainDisplay');

let currentDomain = '';

// Get current domain
async function getCurrentDomain() {
 try {
 const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
 const url = new URL(tab.url);
 currentDomain = url.hostname;
 domainDisplay.textContent = currentDomain;
 return currentDomain;
 } catch (error) {
 console.error('Error getting domain:', error);
 return '';
 }
}

// Load auto-activate setting
async function loadAutoActivateSetting() {
 const domain = await getCurrentDomain();
 if (!domain) return;
 
 try {
 const result = await chrome.storage.sync.get([`auto_${domain}`]);
 autoActivateToggle.checked = result[`auto_${domain}`] || false;
 } catch (error) {
 console.error('Error loading setting:', error);
 }
}

// Save auto-activate setting
async function saveAutoActivateSetting() {
 if (!currentDomain) return;
 
 try {
 const key = `auto_${currentDomain}`;
 await chrome.storage.sync.set({ [key]: autoActivateToggle.checked });
 
 if (autoActivateToggle.checked) {
 setStatus('✅ Auto-activation enabled for this website', 'success');
 } else {
 setStatus('❌ Auto-activation disabled for this website', 'warning');
 }
 } catch (error) {
 console.error('Error saving setting:', error);
 setStatus('❌ Error saving setting', 'error');
 }
}

// Set status message
function setStatus(message, type = '') {
 status.textContent = message;
 status.className = `status ${type}`;
 
 if (type === 'success' || type === 'warning') {
 setTimeout(() => {
 status.textContent = '';
 status.className = 'status';
 }, 3000);
 }
}

// Send message to content script
async function sendMessage(action) {
 try {
 const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
 
 return new Promise((resolve) => {
 chrome.tabs.sendMessage(tab.id, { action }, (response) => {
 if (chrome.runtime.lastError) {
 console.error('Error:', chrome.runtime.lastError.message);
 resolve({ success: false, error: chrome.runtime.lastError.message });
 } else {
 resolve(response || { success: false });
 }
 });
 });
 } catch (error) {
 console.error('Send message error:', error);
 return { success: false, error: error.message };
 }
}

// Activate button click
activateBtn.addEventListener('click', async () => {
 const response = await sendMessage('activate');
 
 if (response.success) {
 setStatus('✅ Active! Click on any element on the page.', 'success');
 activateBtn.style.display = 'none';
 undoBtn.style.display = 'inline-block';
 resetBtn.style.display = 'inline-block';
 } else {
 setStatus('❌ Failed to activate. Try refreshing the page.', 'error');
 }
});

// Undo button click
undoBtn.addEventListener('click', async () => {
 const response = await sendMessage('undo');
 
 if (response.success) {
 setStatus('↩️ Changes undone!', 'success');
 activateBtn.style.display = 'inline-block';
 undoBtn.style.display = 'none';
 resetBtn.style.display = 'none';
 } else {
 setStatus('❌ Failed to undo. Try reset instead.', 'error');
 }
});

// Reset button click
resetBtn.addEventListener('click', async () => {
 const response = await sendMessage('reset');
 
 if (response.success) {
 setStatus('🔄 Page reset!', 'success');
 activateBtn.style.display = 'inline-block';
 undoBtn.style.display = 'none';
 resetBtn.style.display = 'none';
 } else {
 setStatus('❌ Failed to reset. Try refreshing the page.', 'error');
 }
});

// Auto-activate toggle change
autoActivateToggle.addEventListener('change', saveAutoActivateSetting);

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
 await loadAutoActivateSetting();
 setStatus('Ready to activate');
 activateBtn.style.display = 'inline-block';
 undoBtn.style.display = 'none';
 resetBtn.style.display = 'none';
});
