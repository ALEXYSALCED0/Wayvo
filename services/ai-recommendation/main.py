import os
from fastapi import FastAPI
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="Wayvo AI Recommendation Service",
    description="LangGraph Multiagent Engine for Personality, Budget, Transport, and Activities profiling",
    version="1.0.0",
)

@app.get("/health")
def health_check():
    return {
        "success": True,
        "data": {
            "status": "healthy",
            "service": "ai-recommendation"
        }
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
