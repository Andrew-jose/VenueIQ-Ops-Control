FROM python:3.12-slim
WORKDIR /app
COPY pyproject.toml .
RUN pip install fastapi uvicorn pydantic pytest httpx --quiet
COPY app/ ./app/
EXPOSE 8002
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", 
     "--port", "8002", "--reload"]
