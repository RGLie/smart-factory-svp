# 스마트 팩토리를 이겨라

Samsung CSR Fair의 스마트 팩토리 체험 부스를 위한 실시간 운영 웹앱입니다.

- `/` — 빔프로젝터용 리더보드와 공용 타이머
- `/checkin` — 별도 노트북용 팀 이름 및 항공사 선택 화면
- `/admin` — 모바일용 팀 등록, 점수 및 타이머 운영 화면
- Neon Postgres — 팀·점수·타이머·현재 팀 상태 영구 저장

## Neon 연결

1. Vercel 프로젝트의 **Storage → Neon**에서 데이터베이스를 연결합니다.
2. Vercel이 생성한 `DATABASE_URL`을 로컬의 `.env.local`에도 복사합니다.
3. 최초 한 번 스키마를 적용합니다.

```bash
cp .env.example .env.local
npm install
npm run db:migrate
```

`.env.local`은 저장소에 커밋하지 않습니다.

## 로컬 실행

```bash
npm run dev
```

브라우저에서 다음 화면을 엽니다.

- 전광판: `http://localhost:3000`
- 항공사 선택: `http://localhost:3000/checkin`
- 운영 화면: `http://localhost:3000/admin`

## 배포

Vercel에 저장소를 연결한 뒤 Neon Integration과 `DATABASE_URL`이 연결된 상태에서 배포합니다. 운영 화면과 전광판은 같은 Vercel 배포 URL을 사용해야 같은 상태를 봅니다.

## 검증

```bash
npm test
```
