FROM python:3.10-slim

# Prevents interactive prompts
ENV PYTHONUNBUFFERED=1

# Create working directory
WORKDIR /app

# Copy the runner script
COPY run_user_code.py .

CMD ["timeout", "5s", "python", "run_user_code.py"]