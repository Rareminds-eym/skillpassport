fetch('https://payments-api.dark-mode-d021.workers.dev/health')
  .then(r => r.json())
  .then(data => console.log(JSON.stringify(data, null, 2)))
  .catch(err => console.error('Error:', err.message));
