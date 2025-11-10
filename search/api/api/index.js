export default async function handler(req, res) {
  res.status(200).json({
    name: "AI Search Engine",
    endpoints: {
      search: "/api/search",
      summarize: "/api/summarize"
    },
    status: "online"
  });
}
