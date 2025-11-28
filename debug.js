// Debug helper to render initialization errors into the login card.
function logInitializationError(error) {
  try {
    const authContainer = document.getElementById('auth-form-container');
    const msg = typeof error === 'string' ? error : (error && error.message ? error.message : String(error));
    if (authContainer) {
      const errNode = document.createElement('div');
      errNode.style.marginTop = '12px';
      errNode.style.padding = '12px';
      errNode.style.borderRadius = '8px';
      errNode.style.background = 'rgba(192,21,47,0.06)';
      errNode.style.color = '#c0152f';
      errNode.style.fontSize = '13px';
      errNode.textContent = 'Initialization error: ' + msg;
      // Insert at the top of the auth form container
      authContainer.insertBefore(errNode, authContainer.firstChild);
    } else {
      // Fallback to console.log if auth container is not present
      console.error('Initialization error (auth container not found):', error);
    }
  } catch (e) {
    console.error('logInitializationError failed:', e);
  }
}

// Also expose a global quick-overlay for immediate health and error info if needed
window.__showDebugOverlay = function() {
  (function(){ 
    function showDebug(msg, color='white', bg='rgba(0,0,0,0.85)') {
      let d = document.getElementById('dev-debug-overlay');
      if(!d) {
        d = document.createElement('div');
        d.id = 'dev-debug-overlay';
        d.style.position='fixed';
        d.style.left='12px';
        d.style.bottom='12px';
        d.style.zIndex='2147483647';
        d.style.maxWidth='calc(100% - 24px)';
        d.style.background=bg;
        d.style.color=color;
        d.style.padding='12px';
        d.style.borderRadius='8px';
        d.style.fontSize='13px';
        d.style.fontFamily='system-ui,Segoe UI,Roboto,Arial';
        document.body.appendChild(d);
      }
      const p = document.createElement('div'); p.style.marginBottom='6px'; p.style.color=color; p.textContent = msg; d.appendChild(p);
    }
    window.addEventListener('error', function(e){ showDebug('Error: '+(e.message||e),'#ff6666','rgba(30,30,30,0.92)'); console.error(e); });
    window.addEventListener('unhandledrejection', function(e){ showDebug('Promise rejection: '+(e.reason && (e.reason.message || JSON.stringify(e.reason)) || e.reason),'#ff6666','rgba(30,30,30,0.92)'); console.error(e);});
    fetch(window.location.origin + '/api/health').then(r=>r.text().then(t=>showDebug('health '+r.status+': '+t,'#7bd389'))).catch(err=>showDebug('health fetch failed: '+err,'#ffb86b'));
    showDebug('Debug overlay initialized','#cbd5e1','rgba(0,0,0,0.6)');
  })();
};