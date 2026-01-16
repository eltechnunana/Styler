(() => {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(reg => {
          console.log('Service worker registered:', reg.scope);
        })
        .catch(err => {
          if (err && err.name === 'InvalidStateError') {
            console.warn('Service worker not registered in this environment:', err.message);
            return;
          }
          console.error('Service worker registration failed:', err);
        });
    });
  }
})();
