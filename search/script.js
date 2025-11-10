window.onload = async () => {
  const params = new URLSearchParams(window.location.search);
  const query = params.get('q');
  if (!query) return;

  const searchRes = await fetch('/backend/api/search', {
    method: 'POST',
    body: JSON.stringify({ query }),
    headers: { 'Content-Type': 'application/json' }
  });
  const { sources } = await searchRes.json();

  const summaryRes = await fetch('/backend/api/summarize', {
    method: 'POST',
    body: JSON.stringify({ sources }),
    headers: { 'Content-Type': 'application/json' }
  });
  const { summary } = await summaryRes.json();

  document.getElementById('summary').innerText = summary;
  const list = document.getElementById('sources');
  sources.forEach(src => {
    const li = document.createElement('li');
    li.innerHTML = `<a href="${src.url}" target="_blank">${src.title}</a> (${src.credibilityScore}/10)`;
    list.appendChild(li);
  });
};
