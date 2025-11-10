import axios from 'axios';

export default async function handler(req, res) {
  const { query } = req.body;

  // Replace with actual API calls
  const results = [
    { title: "Example Result", url: "https://example.com", snippet: "This is a sample result." }
  ];

  const sources = results.map(item => ({
    ...item,
    credibilityScore: scoreSource(item.url)
  }));

  res.status(200).json({ sources });
}

function scoreSource(url) {
  const domain = new URL(url).hostname;
  if (domain.endsWith('.gov') || domain.endsWith('.edu')) return 10;
  if (domain.includes('bbc') || domain.includes('nytimes')) return 9;
  return 5;
}
