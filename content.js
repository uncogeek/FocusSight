// Global variables
let isActive = false;
let overlay = null;
let pageOverlay = null;
let originalStyles = new Map();
let isIsolated = false;

console.log('🎯 Element Isolator content script loaded');

// Auto-activate check
async function checkAutoActivate() {
 try {
 const domain = window.location.hostname;
 const result = await chrome.storage.sync.get([`auto_${domain}`]);
 
 if (result[`auto_${domain}`]) {
 console.log('🔄 Auto-activating for:', domain);
 // Wait for page to load completely
 setTimeout(() => {
 activate();
 }, 2000); // 2 second delay
 }
 } catch (error) {
 console.error('Error checking auto-activate:', error);
 }
}

// Check auto-activate when page loads
if (document.readyState === 'loading') {
 document.addEventListener('DOMContentLoaded', checkAutoActivate);
} else {
 checkAutoActivate();
}

// Store original styles before making changes
function storeOriginalStyles() {
 if (originalStyles.size > 0) return; // Already stored
 
 document.querySelectorAll('*').forEach(el => {
 const computed = getComputedStyle(el);
 originalStyles.set(el, {
 opacity: el.style.opacity || computed.opacity,
 outline: el.style.outline || 'none',
 outlineOffset: el.style.outlineOffset || '0px',
 boxShadow: el.style.boxShadow || computed.boxShadow,
 backgroundColor: el.style.backgroundColor || computed.backgroundColor
 });
 });
 
 console.log('💾 Stored original styles for', originalStyles.size, 'elements');
}

// Restore original styles
function restoreOriginalStyles() {
 console.log('↩️ Restoring original styles...');
 
 originalStyles.forEach((styles, el) => {
 try {
 if (styles.opacity !== '1' && styles.opacity !== '') {
 el.style.opacity = styles.opacity;
 } else {
 el.style.removeProperty('opacity');
 }
 
 if (styles.outline !== 'none') {
 el.style.outline = styles.outline;
 } else {
 el.style.removeProperty('outline');
 }
 
 el.style.removeProperty('outline-offset');
 el.style.removeProperty('box-shadow');
 el.style.removeProperty('background-color');
 el.classList.remove('temp-highlight');
 } catch (error) {
 // Element might have been removed from DOM
 }
 });
 
 originalStyles.clear();
 document.body.style.removeProperty('cursor');
 isIsolated = false;
 
 console.log('✅ Original styles restored');
}

// Create overlay with instructions
function createOverlay() {
 if (overlay) return;
 
 overlay = document.createElement('div');
 overlay.style.cssText = `
 position: fixed;
 top: 0;
 left: 0;
 width: 100vw;
 height: 100vh;
 background: rgba(0, 0, 0, 0.3);
 z-index: 999999;
 display: flex;
 justify-content: center;
 align-items: center;
 pointer-events: none;
 `;
 
 overlay.innerHTML = `
 <div style="
 background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
 color: white;
 padding: 30px;
 border-radius: 15px;
 text-align: center;
 box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
 border: 2px solid rgba(255, 255, 255, 0.3);
 animation: pulse 2s infinite;
 ">
 <div style="font-size: 24px; font-weight: bold; margin-bottom: 10px;">🎯 Element Isolator Active</div>
 <div style="font-size: 16px; margin-bottom: 5px;">Click on any element to isolate it</div>
 <div style="font-size: 14px; opacity: 0.8;">Press ESC to cancel</div>
 </div>
 `;
 
 document.body.appendChild(overlay);
 console.log('✅ Overlay created');
}

// Create page border overlay
function createPageOverlay() {
 if (pageOverlay) return;
 
 pageOverlay = document.createElement('div');
 pageOverlay.style.cssText = `
 position: fixed;
 top: 0;
 left: 0;
 width: 100vw;
 height: 100vh;
 border: 3px dashed #667eea;
 box-sizing: border-box;
 z-index: 999998;
 pointer-events: none;
 animation: borderPulse 2s infinite;
 `;
 
 document.body.appendChild(pageOverlay);
 console.log('✅ Page overlay created');
}

// Remove overlays
function removeOverlays() {
 if (overlay) {
 overlay.remove();
 overlay = null;
 console.log('✅ Overlay removed');
 }
 if (pageOverlay) {
 pageOverlay.remove();
 pageOverlay = null;
 console.log('✅ Page overlay removed');
 }
}

// Highlight element on hover
function highlightElement(e) {
 if (!isActive) return;
 
 // Remove previous highlights
 document.querySelectorAll('.temp-highlight').forEach(el => {
 el.classList.remove('temp-highlight');
 el.style.removeProperty('outline');
 el.style.removeProperty('outline-offset');
 el.style.removeProperty('background-color');
 });
 
 // Add highlight to current element
 e.target.classList.add('temp-highlight');
 e.target.style.setProperty('outline', '3px solid #667eea', 'important');
 e.target.style.setProperty('outline-offset', '2px', 'important');
 e.target.style.setProperty('background-color', 'rgba(102, 126, 234, 0.1)', 'important');
 
 console.log('🖱️ Hovering:', e.target.tagName, e.target.className || 'no-class');
}

// Handle element click
function handleElementClick(e) {
 if (!isActive) return;
 
 console.log('🖱️ Clicked:', e.target.tagName, e.target.className || 'no-class');
 
 e.preventDefault();
 e.stopPropagation();
 e.stopImmediatePropagation();
 
 // Store styles before isolating
 storeOriginalStyles();
 
 // Remove highlights
 document.querySelectorAll('.temp-highlight').forEach(el => {
 el.classList.remove('temp-highlight');
 el.style.removeProperty('outline');
 el.style.removeProperty('outline-offset');
 el.style.removeProperty('background-color');
 });
 
 // Remove overlays
 removeOverlays();
 
 // Isolate element
 isolateElement(e.target);
 
 // Deactivate
 deactivate();
}

// Isolate element
function isolateElement(element) {
 console.log('🎯 Isolating element:', element.tagName);
 
 // Fade out all other elements
 document.querySelectorAll('*').forEach(el => {
 if (el === element || element.contains(el) || el.contains(element)) {
 return; // Keep visible
 }
 el.style.setProperty('opacity', '0.1', 'important');
 });
 
 // Highlight the selected element
 element.style.setProperty('outline', '4px solid #667eea', 'important');
 element.style.setProperty('outline-offset', '4px', 'important');
 element.style.setProperty('box-shadow', '0 0 20px rgba(102, 126, 234, 0.8)', 'important');
 element.scrollIntoView({ block: 'center', behavior: 'smooth' });
 
 isIsolated = true;
 console.log('✅ Element isolated');
}

// Reset page completely
function resetPage() {
 console.log('🔄 Resetting page...');
 
 // Remove all custom styles
 document.querySelectorAll('*').forEach(el => {
 el.style.removeProperty('opacity');
 el.style.removeProperty('outline');
 el.style.removeProperty('outline-offset');
 el.style.removeProperty('box-shadow');
 el.style.removeProperty('background-color');
 el.classList.remove('temp-highlight');
 });
 
 document.body.style.removeProperty('cursor');
 removeOverlays();
 originalStyles.clear();
 isIsolated = false;
 
 console.log('✅ Page reset complete');
}

// Handle ESC key
function handleEscKey(e) {
 if (e.key === 'Escape' && isActive) {
 console.log('⌨️ ESC pressed - deactivating');
 deactivate();
 }
}

// Activate
function activate() {
 console.log('🚀 Activating...');
 
 if (isActive) {
 console.log('⚠️ Already active');
 return;
 }
 
 isActive = true;
 
 // Create visual feedback
 createOverlay();
 createPageOverlay();
 
 // Change cursor
 document.body.style.cursor = 'crosshair';
 
 // Add event listeners
 document.addEventListener('mouseover', highlightElement, true);
 document.addEventListener('click', handleElementClick, true);
 document.addEventListener('keydown', handleEscKey, true);
 
 console.log('✅ Activated successfully');
}

// Deactivate
function deactivate() {
 console.log('🛑 Deactivating...');
 
 if (!isActive) {
 console.log('⚠️ Already inactive');
 return;
 }
 
 isActive = false;
 
 // Remove visual feedback
 removeOverlays();
 document.body.style.removeProperty('cursor');
 
 // Remove event listeners
 document.removeEventListener('mouseover', highlightElement, true);
 document.removeEventListener('click', handleElementClick, true);
 document.removeEventListener('keydown', handleEscKey, true);
 
 // Clean up highlights
 document.querySelectorAll('.temp-highlight').forEach(el => {
 el.classList.remove('temp-highlight');
 el.style.removeProperty('outline');
 el.style.removeProperty('outline-offset');
 el.style.removeProperty('background-color');
 });
 
 console.log('✅ Deactivated successfully');
}

// Undo last isolation
function undoIsolation() {
 console.log('↩️ Undoing isolation...');
 
 if (!isIsolated) {
 console.log('⚠️ Nothing to undo');
 return { success: false, message: 'Nothing to undo' };
 }
 
 restoreOriginalStyles();
 return { success: true };
}

// Message listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
 console.log('📨 Message received:', request.action);
 
 try {
 if (request.action === 'activate') {
 activate();
 sendResponse({ success: true });
 } else if (request.action === 'undo') {
 const result = undoIsolation();
 sendResponse(result);
 } else if (request.action === 'reset') {
 deactivate();
 resetPage();
 sendResponse({ success: true });
 } else {
 console.log('❌ Unknown action:', request.action);
 sendResponse({ success: false, error: 'Unknown action' });
 }
 } catch (error) {
 console.error('❌ Error handling message:', error);
 sendResponse({ success: false, error: error.message });
 }
 
 return true;
});

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
@keyframes pulse {
 0% { transform: scale(1); }
 50% { transform: scale(1.05); }
 100% { transform: scale(1); }
}
@keyframes borderPulse {
 0% { border-color: #667eea; }
 50% { border-color: #764ba2; }
 100% { border-color: #667eea; }
}
`;
document.head.appendChild(style);
