@echo off
echo Generating gRPC code from proto files...

cd grpc_service
python -m grpc_tools.protoc -I. --python_out=. --grpc_python_out=. whisper.proto
cd ..

cd api_gateway
python -m grpc_tools.protoc -I. --python_out=. --grpc_python_out=. whisper.proto
cd ..

echo Done!
