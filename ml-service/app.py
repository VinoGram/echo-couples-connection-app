import gradio as gr
from main import app as fastapi_app

# Minimal Gradio UI — satisfies HF free tier requirement
with gr.Blocks(title="Echo ML Service") as demo:
    gr.Markdown("## 💕 Echo ML Service\nAPI is live. Use the endpoints below from your app.")
    gr.Markdown("""
| Endpoint | Method | Description |
|---|---|---|
| `/api/health` | GET | Health check |
| `/api/questions/adaptive` | POST | Generate adaptive questions |
| `/api/questions/generate` | POST | Generate questions |
| `/api/analyze-communication` | POST | Analyze communication |
| `/api/games/create-session` | POST | Create game session |
""")

# Mount FastAPI under /api so all routes are accessible
app = gr.mount_gradio_app(fastapi_app, demo, path="/")
