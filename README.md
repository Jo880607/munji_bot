# 🔥 겨울햇살팀 먼지 봇

텔레그램 기반 가상 팀 관리 봇 - 총괄 팀장 "먼지"

## 기능
- 텔레그램 메시지에 AI 기반 응답 (먼지 캐릭터)
- 1시간마다 자동 정기 보고 (09시~22시)
- 팀원 업무 상태 관리
- 아이디어 → 기획서 정리

## 배포 방법

### 1. GitHub 레포 생성
```bash
git init
git add .
git commit -m "🔥 먼지 봇 초기 세팅"
git remote add origin https://github.com/Jo880607/munji-bot.git
git push -u origin main
```

### 2. Vercel 배포
1. vercel.com → Import Git Repository → munji-bot 선택
2. Environment Variables 설정:
   - `TELEGRAM_BOT_TOKEN`
   - `TELEGRAM_CHAT_ID`
   - `ANTHROPIC_API_KEY`
   - `CRON_SECRET`

### 3. Webhook 연결
배포 완료 후 브라우저에서 방문:
```
https://[your-domain].vercel.app/api/webhook/setup
```

### 4. 테스트
텔레그램에서 봇에게 메시지 보내기!

## 명령어
- `/start` - 시작
- `/status` - 팀 현황
- `/report` - 즉시 보고 요청
- 자유 메시지 - 먼지가 AI로 응답
Commit changes
