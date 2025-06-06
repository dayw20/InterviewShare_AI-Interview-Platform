FROM python:3.10-slim

# 安装系统依赖（包含 Docker CLI 用于 run_user_code）
RUN apt update && apt install -y docker.io

# 设置工作目录
WORKDIR /app

# ✅ 将 backend 的所有内容复制进容器
COPY ../../backend/ .  

# 安装 Python 依赖（路径已在容器内）
RUN pip install --no-cache-dir -r requirements.txt

# 设置环境变量
ENV PYTHONUNBUFFERED=1

# ✅ 启动 Django 项目（interview_plaza 应为容器内真实目录）
CMD ["gunicorn", "interview_plaza.wsgi:application", "--bind", "0.0.0.0:8000"]

