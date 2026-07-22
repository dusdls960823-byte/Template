# 🤖 Discord Community Event & Utility Bot

디스코드 서버의 커뮤니티 활성화와 멤버들의 참여를 높이기 위해 제작된 **모듈형 디스코드 봇**입니다. 출석체크, 포인트 시스템, 주사위 베팅 및 PVP 대결, 그리고 랭킹 시스템 등 다양한 기능을 제공합니다.

---

## 📂 파일 구조 (File Structure)

```text
your-project-folder/
│
├── index.js              # 봇 메인 진입점 및 슬래시 명령어 등록
├── points.json           # 유저 포인트 및 출석 데이터 저장소 (자동 생성)
└── handlers/
    ├── commands.js       # 일반 명령어 (출석, 포인트, 랭킹, 서버정보, 공지, 추첨)
    └── dice.js           # 주사위 굴리기 및 1:1 PVP 대결 모듈
