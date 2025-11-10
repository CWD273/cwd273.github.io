export default async function handler(req, res) {
  res.status(200).json({
    name: "AI Search Engine",
    endpoints: {
      search: "/search/api/api/search",
      summarize: "/search/api/api/summarize"
    },
    status: "online"
  });
}
