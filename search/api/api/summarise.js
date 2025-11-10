import axios from 'axios';

export default async function handler(req, res) {
  const { sources } = req.body;
  const response = await axios.post('https://cwdsllm.vercel.app/api/summarize', { sources });
  res.status(200).json({ summary: response.data.summary });
}
