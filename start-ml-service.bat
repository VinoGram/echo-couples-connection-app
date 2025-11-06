@echo off
echo Starting Echo ML Service...
cd ml-service
pip install -r requirements.txt
python main.py