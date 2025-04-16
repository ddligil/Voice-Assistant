from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import whisper
import openai
import os

client = openai.OpenAI(api_key="your_api_key")      
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model = whisper.load_model("base")

@app.post("/transcribe")
async def transcribe(file: UploadFile = File(...)):
    temp_path = "temp_audio.wav"

    with open(temp_path, "wb") as buffer:
        buffer.write(await file.read())

    result = model.transcribe(temp_path, language="turkish")
    question = result["text"]

    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",  
            messages=[
                {"role": "system", "content": "Sen yardımsever bir Türkçe asistanısın. Sorulara anlamlı ve kısa cevaplar ver."},
                {"role": "user", "content": question}
            ]
        )
        answer = response.choices[0].message.content
    except Exception as e:
        answer = f"OpenAI API hatası: {str(e)}"

    os.remove(temp_path)

    return {"text": question, "answer": answer}
