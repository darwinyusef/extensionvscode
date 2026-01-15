# prueba 1 funcional 

FROM python:3.10-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    ffmpeg \
    git \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app /app/app

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

docker build -t whisper-tiny-api .


docker run -d \
  --name whisper-api \
  -p 8000:8000 \
  whisper-tiny-api


docker ps


fastapi
uvicorn
torch
torchaudio
openai-whisper
python-multipart

import whisper

class WhisperService:
    def __init__(self):
        self.model = whisper.load_model("tiny")

    def transcribe(self, audio_path: str) -> str:
        result = self.model.transcribe(audio_path)
        return result["text"]



from fastapi import FastAPI, UploadFile, File, HTTPException
import shutil
import uuid
import os

from whisper_service import WhisperService

app = FastAPI(title="Whisper Tiny Service")

whisper_service = WhisperService()

TEMP_DIR = "temp"
os.makedirs(TEMP_DIR, exist_ok=True)

@app.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    if not file.filename.endswith((".mp3", ".wav", ".m4a", ".ogg", ".flac")):
        raise HTTPException(status_code=400, detail="Formato de audio no soportado")

    filename = f"{uuid.uuid4()}_{file.filename}"
    file_path = os.path.join(TEMP_DIR, filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        text = whisper_service.transcribe(file_path)
    finally:
        os.remove(file_path)

    return {
        "filename": file.filename,
        "text": text
    }


# prueba 2 no funcional pero en GRPC


mkdir whisper-grpc && cd whisper-grpc
mkdir models # Aquí se guardará el modelo 'tiny'


syntax = "proto3";

package whisper;

service WhisperService {
  rpc Transcribe (AudioRequest) returns (TextResponse) {}
}

message AudioRequest {
  bytes audio_data = 1; // El archivo mp3 en bytes
}

message TextResponse {
  string text = 1;
}

import grpc
from concurrent import futures
import whisper
import whisper_pb2
import whisper_pb2_grpc
import io

class WhisperServicer(whisper_pb2_grpc.WhisperServiceServicer):
    def __init__(self):
        # Cargamos el modelo 'tiny'. 
        # 'download_root' asegura que busque el modelo en la carpeta montada.
        self.model = whisper.load_model("tiny", download_root="/models")

    def Transcribe(self, request, context):
        # Convertir bytes a un archivo temporal o procesar directamente
        audio_bytes = request.audio_data
        
        # Whisper necesita un path o un array de numpy. 
        # Para simplificar, guardamos temporalmente:
        with open("temp.mp3", "wb") as f:
            f.write(audio_bytes)
        
        result = self.model.transcribe("temp.mp3")
        return whisper_pb2.TextResponse(text=result["text"])

def serve():
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    whisper_pb2_grpc.add_WhisperServiceServicer_to_server(WhisperServicer(), server)
    server.add_insecure_port('[::]:50051')
    print("Servidor Whisper gRPC iniciado en el puerto 50051...")
    server.start()
    server.wait_for_termination()

if __name__ == "__main__":
    serve()



FROM python:3.9-slim

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Instalar dependencias de Python
RUN pip install openai-whisper grpcio grpcio-tools

COPY . .

# Comando para generar las clases de gRPC antes de arrancar
RUN python -m grpc_tools.protoc -I. --python_out=. --grpc_python_out=. whisper.proto

EXPOSE 50051

CMD ["python", "server.py"]


docker build -t whisper-service .

# Corremos el contenedor mapeando la carpeta /models del server
docker run -d \
  -p 50051:50051 \
  -v $(pwd)/models:/models \
  --name whisper-app \
  whisper-service