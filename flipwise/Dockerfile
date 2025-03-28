# Use an official FastAPI base image
FROM tiangolo/uvicorn-gunicorn-fastapi:python3.9

# Set the working directory in the container to the backend folder inside flipwise
WORKDIR /app/flipwise/backend

# Copy requirements.txt first to install dependencies
COPY flipwise/backend/requirements.txt /app/flipwise/backend/requirements.txt

# Install dependencies
RUN pip install --no-cache-dir -r /app/flipwise/backend/requirements.txt

# Copy the entire backend folder into the container
COPY flipwise/backend /app/flipwise/backend

# Expose the port that the FastAPI app will run on
EXPOSE 8000

# Run the FastAPI app using Uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
