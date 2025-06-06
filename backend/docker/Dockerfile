# 基础镜像
FROM python:3.10-slim

# 安装系统依赖（包括 docker CLI 用于 run_user_code）
RUN apt update && apt install -y docker.io

# 设置工作目录
WORKDIR /app

# 复制项目代码（注意：Render 的构建上下文是 backend/docker）
COPY ../.. .

# 安装 Python 依赖
RUN pip install --no-cache-dir -r requirements.txt

# 确保我们有权限运行代码执行器（如使用 docker.sock）
ENV PYTHONUNBUFFERED=1

# 启动 Django 项目（改成你的实际 settings 模块名）
CMD ["gunicorn", "interview_plaza.wsgi:application", "--bind", "0.0.0.0:8000"]

