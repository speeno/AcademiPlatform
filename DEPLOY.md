# AcademiQ 배포 가이드

## 아키텍처 개요

```
사용자
  │
  ├─► Cloudflare (DNS + CDN) ──► Vercel (Frontend / Next.js)
  │                                    │ API 요청
  │                                    ▼
  └─────────────────────────── Render (Backend / NestJS)
                                       │
                            ┌──────────┼──────────┐
                            ▼          ▼          ▼
                     Render DB     Render Disk  Render Redis
                   (PostgreSQL)  (PDF 교재 파일)  (Valkey/추후)
```

---

## 0. 사전 준비

1. **GitHub 리포지토리** 생성 후 코드 Push
2. **Render** 계정 (render.com)
3. **Vercel** 계정 (vercel.com)
4. **Cloudflare** 계정 (cloudflare.com) — 커스텀 도메인 사용 시

---

## 1. GitHub에 코드 Push

```bash
cd /Users/speeno/AcademiPlatform
git init
git add .
git commit -m "feat: initial deploy setup"
# GitHub에서 새 리포지토리 생성 후:
git remote add origin https://github.com/YOUR_USERNAME/academiq.git
git push -u origin main
```

> **주의**: `.gitignore`에 의해 `backend/static/textbooks/*.pdf`(총 ~86MB)는 제외됩니다.
> PDF 파일은 배포 후 Render Shell로 직접 업로드합니다.

---

## 2. Render — 백엔드 배포

### 2-1. PostgreSQL 데이터베이스 생성

1. Render 대시보드 → `New` → `PostgreSQL`
2. Name: 예) `academiq-db`, Region: **백엔드 Web Service와 동일 리전** (Singapore 등)
3. 생성 후 **Connections** 탭에서 URL 확인

**현재 프로덕션 DB (2026-05 신규):**

| 항목 | 값 |
|------|-----|
| Database | `academiqdb_09uu` |
| Username | `academiqdb_09uu_user` |
| Internal host | `dpg-d841p0eq1p3s738igfd0-a` |
| Port | `5432` |

> 구 DB(`dpg-d6sjnavdiees73ce3gpg-a` / `academiqdb`)는 만료·삭제될 수 있습니다. Web Service의 `DATABASE_URL`이 **반드시 신규 Internal URL**을 가리켜야 합니다.

**Web Service에 연결 (권장):**

1. PostgreSQL 인스턴스 → **Connect** → `academiq-backend` 선택  
2. 환경변수 `DATABASE_URL`이 Internal URL로 자동 설정됨  
3. 수동 입력 시 끝에 `?sslmode=require` 추가 (또는 `npm run start:render`가 자동 보정)

로컬에서 스키마·시드만 먼저 넣을 때:

```bash
cd backend
# External Database URL (비밀번호 포함) export
export DATABASE_URL='postgresql://academiqdb_09uu_user:...@dpg-....render.com:5432/academiqdb_09uu?sslmode=require'
./scripts/render-db-provision.sh
```

템플릿: `backend/.env.render.example`

### 2-2. Render Disk (PDF 교재 영구 저장)

- `render.yaml`에 이미 설정되어 있음 (`/data/textbooks`, 1GB, $0.25/월)
- 처음에는 비어 있으므로 배포 후 Shell에서 파일을 업로드해야 합니다 (2-5 참고)

### 2-3. Web Service 배포

방법 A — `render.yaml` 사용 (권장):
1. Render 대시보드 → `New` → `Blueprint`
2. GitHub 리포지토리 연결
3. `render.yaml` 파일이 감지됨 → `Apply`

방법 B — 수동 생성:
1. `New` → `Web Service`
2. 리포지토리 연결
3. 설정:
   - **Root Directory**: `backend`
   - **Build Command**: `npm ci && npm run db:generate && npm run build`
   - **Start Command**: `npm run start:render`
   - **Health Check Path**: `/api/health`

### 2-3b. Web Service 일시중지 해제

`https://academiq-backend.onrender.com` 이 **Service Suspended** 이면 배포·DB 연결과 무관하게 API가 응답하지 않습니다.  
Render 대시보드 → `academiq-backend` → **Resume** (또는 Suspend 해제).

### 2-4. 환경변수 설정

Render 대시보드 → Web Service → `Environment` 탭에서 입력:

| 키 | 값 |
|---|---|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | 신규 PostgreSQL **Internal Database URL** (`?sslmode=require` 권장) |
| `RUN_DB_SEED` | 신규 DB **최초 1회만** `true`, 이후 삭제 |
| `JWT_SECRET` | 랜덤 32자 이상 문자열 |
| `JWT_REFRESH_SECRET` | 랜덤 32자 이상 문자열 |
| `VIEWER_TOKEN_SECRET` | 랜덤 문자열 |
| `FRONTEND_URL` | `https://academiq.vercel.app` (Vercel 배포 후 확인) |
| `TEXTBOOK_STORAGE_PATH` | `/data/textbooks` |
| `S3_ENDPOINT` | `https://<accountid>.r2.cloudflarestorage.com` |
| `S3_REGION` | `auto` |
| `S3_BUCKET` | R2 버킷명 (`academiqstorage` 등) |
| `S3_ACCESS_KEY` | R2 Access Key ID |
| `S3_SECRET_KEY` | R2 Secret Access Key |

> JWT Secret 생성: `openssl rand -base64 48`
> 기존 `AWS_*` 키는 fallback으로 남겨둘 수 있으나, R2 표준 운영은 `S3_*`를 우선 사용합니다.

### 2-5. PDF 파일 Render Disk에 업로드

배포 완료 후, Render 대시보드 → Web Service → `Shell` 탭:

```bash
# Disk가 마운트되었는지 확인
ls /data/textbooks/

# 로컬에서 scp로 업로드 (Render Shell에서는 직접 불가 — 아래 방법 중 선택)
```

**방법 1: curl로 외부 스토리지에서 다운로드 (권장)**
```bash
# Render Shell에서 실행
curl -L "https://your-storage.com/ai-iso-creator.pdf" -o /data/textbooks/ai-iso-creator.pdf
curl -L "https://your-storage.com/ai-iso-prompt.pdf" -o /data/textbooks/ai-iso-prompt.pdf
curl -L "https://your-storage.com/ai-intro-vol1.pdf" -o /data/textbooks/ai-intro-vol1.pdf
curl -L "https://your-storage.com/ai-intro-vol2.pdf" -o /data/textbooks/ai-intro-vol2.pdf
```

**방법 2: Render에서 S3 복사**
```bash
# AWS CLI가 설치되어 있고 S3에 PDF를 업로드했다면:
aws s3 cp s3://academiq-private/textbooks/ /data/textbooks/ --recursive
```

**방법 3: Git LFS 사용** (repo에 포함 시)
```bash
# 로컬에서
brew install git-lfs
git lfs install
git lfs track "backend/static/textbooks/*.pdf"
git add .gitattributes
git add backend/static/textbooks/
git commit -m "chore: add pdf files via git lfs"
git push
```

### 2-6. DB 마이그레이션 및 시드 (최초 1회)

**방법 A — 배포 시 자동 (권장)**  
Web Service Environment에 `RUN_DB_SEED=true` 설정 후 **Manual Deploy** 1회 → 성공 후 `RUN_DB_SEED` 제거 또는 `false`.  
(`startCommand: npm run start:render` 가 migrate + seed 실행)

**방법 B — 로컬에서 External URL로 실행**

```bash
cd backend
export DATABASE_URL='<External Database URL>?sslmode=require'
./scripts/render-db-provision.sh
```

**방법 C — Render Shell**

```bash
npx prisma migrate deploy
npx prisma db seed
```

시드 후 관리자: `admin@academiq.kr` / `admin123` (`backend/prisma/seed.ts`)

---

## 3. Vercel — 프론트엔드 배포

### 3-1. 프로젝트 Import

1. [vercel.com](https://vercel.com) → `Add New` → `Project`
2. GitHub 리포지토리 선택
3. 설정:
   - **Framework Preset**: Next.js (자동 감지)
   - **Root Directory**: `frontend`
   - `vercel.json`에 설정되어 있으므로 대부분 자동 감지

### 3-2. 환경변수 설정

Vercel 대시보드 → Project → `Settings` → `Environment Variables`:

| 키 | 값 |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://academiq-backend.onrender.com/api` |
| `NEXT_PUBLIC_SITE_URL` | `https://academiq.vercel.app` |

> Render 백엔드 도메인은 배포 후 Render 대시보드에서 확인

### 3-3. 배포

`Deploy` 버튼 클릭 → 빌드 완료 후 URL 확인

---

## 4. Render 백엔드 CORS 업데이트

Vercel 배포 URL 확인 후 Render 환경변수 업데이트:

```
FRONTEND_URL=https://academiq.vercel.app
```

자동 재배포 또는 수동 `Manual Deploy` 클릭.

---

## 5. Cloudflare 설정 (커스텀 도메인 사용 시)

### 5-1. 도메인 등록

1. Cloudflare에 도메인 추가 (예: `academiq.co.kr`)
2. 네임서버를 Cloudflare로 변경

### 5-2. DNS 레코드 설정

| 타입 | 이름 | 값 | 프록시 |
|------|------|-----|--------|
| `CNAME` | `@` or `www` | `cname.vercel-dns.com` | ✅ Orange |
| `CNAME` | `api` | `academiq-backend.onrender.com` | ✅ Orange |

### 5-3. Vercel 커스텀 도메인

Vercel → Project → `Settings` → `Domains` → `academiq.co.kr` 추가

### 5-4. Render 커스텀 도메인 (선택)

Render → Web Service → `Settings` → `Custom Domain` → `api.academiq.co.kr` 추가

### 5-5. Cloudflare 추천 설정

- **SSL/TLS**: Full (Strict)
- **Speed → Optimization**: Auto Minify (JS/CSS/HTML)
- **Caching**: 정적 자산 캐시 규칙 추가
- **Security**: WAF 기본 규칙 활성화

---

## 6. Render Redis (추후 활성화 시)

현재 백엔드 코드는 Redis를 직접 사용하지 않습니다.
Bull Queue(영상 인코딩 작업 큐) 활성화 시 아래를 추가:

```bash
# render.yaml에 추가 또는 Render 대시보드에서 Key Value 생성
REDIS_URL=redis://default:PASSWORD@HOST:PORT
```

기존 `mudot-redis` 공유도 가능하지만 프로젝트 분리 권장.

---

## 7. 배포 체크리스트

### 최초 배포

- [ ] GitHub 리포지토리 Push
- [ ] Render PostgreSQL 생성
- [ ] Render Web Service 배포 + 환경변수 설정
- [ ] R2 키(`S3_ENDPOINT/S3_REGION/S3_BUCKET/S3_ACCESS_KEY/S3_SECRET_KEY`) 입력
- [ ] Render Shell에서 PDF 파일 업로드 (`/data/textbooks/`)
- [ ] Render Shell에서 `npx prisma db seed` 실행
- [ ] Vercel 프로젝트 생성 + 환경변수 설정
- [ ] Vercel 배포 URL 확인 → Render `FRONTEND_URL` 업데이트
- [ ] (선택) Cloudflare DNS 설정 + 커스텀 도메인 연결

### 코드 변경 후 재배포

- Render: GitHub Push → 자동 배포 (main 브랜치)
- Vercel: GitHub Push → 자동 배포 (main 브랜치)

### R2 장애 점검

- `403 SignatureDoesNotMatch`: `S3_ENDPOINT`, `S3_REGION=auto`, Access/Secret 키 재확인
- `NoSuchBucket`: R2 버킷명(`S3_BUCKET`) 및 API 토큰 권한 확인
- 업로드 URL 발급 실패: 백엔드 부팅 로그의 `storage-preflight` 누락 키 메시지 확인

---

## 8. 비용 예상 (월)

| 서비스 | 플랜 | 비용 |
|--------|------|------|
| Vercel | Hobby (무료) | $0 |
| Render Web Service | Free (750h/월) | $0 |
| Render PostgreSQL | Free (1GB, 90일) | $0 → Starter $7 |
| Render Disk | 1GB | $0.25 |
| Cloudflare | Free | $0 |
| **합계 (초기)** | | **~$0.25/월** |

> Render Free Web Service는 15분 비활동 시 슬립. 유료($7/월)로 업그레이드 시 항상 실행.

---

## 9. Render 무료 슬립 보완(keep-alive)

무료 플랜에서 유휴 슬립을 줄이기 위해 GitHub Actions 스케줄러를 사용합니다.

### 9-1. 워크플로우

- 파일: `.github/workflows/render-keepalive.yml`
- 주기: 10분 간격(`*/10 * * * *`) + 수동 실행(`workflow_dispatch`)
- 호출 경로: `/api/health`

### 9-2. 설정

GitHub Repository `Settings -> Secrets and variables -> Actions`에 아래 시크릿 추가:

- `RENDER_KEEPALIVE_URL`: `https://<render-service>.onrender.com/api/health`

시크릿이 없으면 기본값(`https://academiq-backend.onrender.com/api/health`)을 사용합니다.

### 9-3. 운영 점검

- Actions 실행 기록에서 `status=200` 여부 확인
- 비정상 응답(`503`, `5xx`) 발생 시 Render 서비스 상태(중지/suspend) 우선 확인
- 24시간 기준 실패율 및 응답 지연(ms) 추이를 확인

### 9-4. 한계와 주의사항

- keep-alive는 콜드스타트를 완화할 뿐, 무료 플랜에서 always-on을 보장하지 않습니다.
- Render 정책/레이트리밋 변경 시 동작이 달라질 수 있습니다.
- 완전한 상시 가동이 필요하면 유료 플랜 전환이 근본 대응입니다.

---

## 10. 강사 다중배정 Q&A 운영 점검

### 10-1. 데이터 모델

- `QnaQuestion.assignedInstructorId`: 질문 대상 강사
- `QnaQuestion.status`: `OPEN | ANSWERED | CLOSED`
- `QnaQuestion.answeredAt`: 답변 시각
- 기존 `CourseCmsCollaborator`를 재사용하여 다중 강사 배정 소스를 유지

### 10-2. 권한 규칙

- 학생 질문 등록: 본인 `Enrollment.ACTIVE` 강좌만 허용
- 강사 질문함 조회: 본인에게 배정된 질문만 노출
- 답변 작성: 배정 강사 본인, 또는 운영자/슈퍼관리자만 허용

### 10-3. 운영 확인 절차

1. 학생 계정으로 `POST /api/qna/questions` 호출
2. 강사 계정으로 `GET /api/qna/instructor/questions`에서 질문 노출 확인
3. 강사 계정으로 `POST /api/qna/questions/:id/answers` 호출
4. 학생 계정으로 `GET /api/qna/my-questions`에서 상태가 `ANSWERED`인지 확인
5. 백엔드 로그에서 NotifyService 이메일 전송 성공 여부 확인

### 10-4. 장애 대응 체크리스트

- 질문 생성 403: 수강 상태(`Enrollment.ACTIVE`) 및 `courseId` 확인
- 강사 목록 비어있음: `instructorId/cmsOwnerId/CourseCmsCollaborator` 배정 데이터 확인
- 답변 403: `assignedInstructorId`와 로그인 강사 ID 일치 여부 확인
- 이메일 미수신: SES 인증 상태, 발신 도메인/수신 정책, `NotifyService` 오류 로그 확인

---

## 11. 교재 PDF 업로드/열람 점검

### 11-1. 환경별 동작

- 로컬 개발
  - `S3_*` 미설정이면 관리자 교재 업로드가 `POST /api/textbooks/admin/upload-local`로 fallback
  - 저장 경로: `TEXTBOOK_STORAGE_PATH/uploads` 또는 기본 `backend/static/textbooks/uploads`
  - 교재 메타에는 `localPath` 저장
- 배포(Render)
  - `S3_*` 설정 시 `s3Key` 기반 업로드/열람이 기본
  - fallback으로 `localPath`를 쓸 경우 `TEXTBOOK_STORAGE_PATH=/data/textbooks`처럼 영속 디스크 경로 필요

### 11-2. 사용자 열람 실패 시 우선 확인

1. 구매 완료 후 `TextbookAccess`가 생성되었는지 확인
2. 해당 교재 레코드에 `s3Key` 또는 `localPath` 중 최소 1개가 채워졌는지 확인
3. 백엔드 로그에서 `/api/textbooks/:id/view` 예외 메시지 확인
4. 배포 환경에서 `localPath` 사용 중이면 파일이 마운트 디스크에 실제 존재하는지 확인

### 11-3. 워터마크 관련

- 워터마크 문자열은 ASCII 안전 포맷을 사용하므로 한글 이름 계정에서도 인코딩 예외가 발생하지 않아야 함
