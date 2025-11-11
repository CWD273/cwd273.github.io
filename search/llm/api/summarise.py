from flask import Flask, request, jsonify
from transformers import pipeline

app = Flask(__name__)

# Load models once (you can swap these with Hugging Face Inference API calls if needed)
llama = pipeline("text-generation", model="meta-llama/Meta-Llama-3-8B", trust_remote_code=True)
mistral = pipeline("text-generation", model="mistralai/Mistral-7B-Instruct-v0.1", trust_remote_code=True)
falcon = pipeline("text-generation", model="tiiuae/falcon-7b-instruct", trust_remote_code=True)

@app.route("/api/summarize", methods=["POST"])
def summarize():
    data = request.get_json()
    sources = data.get("sources", [])
    if not sources:
        return jsonify({"error": "No sources provided"}), 400

    # Combine snippets
    text = "\n".join([s.get("snippet", "") for s in sources])
    prompt = f"Summarize the following information:\n{text}"

    # Generate summaries
    llama_summary = llama(prompt, max_new_tokens=200)[0]["generated_text"]
    mistral_summary = mistral(prompt, max_new_tokens=200)[0]["generated_text"]
    falcon_summary = falcon(prompt, max_new_tokens=200)[0]["generated_text"]

    # Combine results
    final_summary = (
        f"(LLaMA 3) {llama_summary.strip()}\n\n"
        f"(Mistral) {mistral_summary.strip()}\n\n"
        f"(Falcon) {falcon_summary.strip()}"
    )

    return jsonify({"summary": final_summary})
