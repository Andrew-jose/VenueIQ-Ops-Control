FROM python:3.12-slim

WORKDIR /app

# Copy the pyproject.toml
COPY pyproject.toml ./

# Install dependencies using pip
RUN pip install .

# Copy the application code
COPY app/ ./app/

# Expose port 8000
EXPOSE 8000

# Start Uvicorn
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
