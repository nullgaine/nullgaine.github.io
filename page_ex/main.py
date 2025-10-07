import webbrowser
import os

# HTML 파일 경로
path = os.path.abspath("index.html")

# 기본 브라우저로 열기
webbrowser.open(f"file://{path}")
