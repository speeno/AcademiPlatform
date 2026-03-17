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
2. Name: `academiq-db`, Region: `Singapore (ap-southeast-1)` 권장
3. 생성 후 **Internal Connection String** 복사 (나중에 환경변수에 입력)

> 기존 `mudotapidb`와 **공유 가능**하지만, 프로덕션 데이터 분리를 권장합니다.

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
   - **Build Command**: `npm ci && npx prisma generate && npm run build`
   - **Start Command**: `npx prisma migrate deploy && node dist/src/main`
   - **Health Check Path**: `/api/health`

### 2-4. 환경변수 설정

Render 대시보드 → Web Service → `Environment` 탭에서 입력:

| 키 | 값 |
|---|---|
| `NODE_ENV` | `production` |
| `PORT` | `4400` |
| `DATABASE_URL` | PostgreSQL Internal Connection String |
| `JWT_SECRET` | 랜덤 32자 이상 문자열 |
| `JWT_REFRESH_SECRET` | 랜덤 32자 이상 문자열 |
| `VIEWER_TOKEN_SECRET` | 랜덤 문자열 |
| `FRONTEND_URL` | `https://academiq.vercel.app` (Vercel 배포 후 확인) |
| `TEXTBOOK_STORAGE_PATH` | `/data/textbooks` |

> JWT Secret 생성: `openssl rand -base64 48`

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

Render Shell에서:
```bash
# 마이그레이션 (Start Command에 포함되어 있어 자동 실행)
npx prisma migrate deploy

# 초기 데이터 시드 (관리자 계정 + 교재/강좌 생성)
npx prisma db seed
```

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
- [ ] Render Shell에서 PDF 파일 업로드 (`/data/textbooks/`)
- [ ] Render Shell에서 `npx prisma db seed` 실행
- [ ] Vercel 프로젝트 생성 + 환경변수 설정
- [ ] Vercel 배포 URL 확인 → Render `FRONTEND_URL` 업데이트
- [ ] (선택) Cloudflare DNS 설정 + 커스텀 도메인 연결

### 코드 변경 후 재배포

- Render: GitHub Push → 자동 배포 (main 브랜치)
- Vercel: GitHub Push → 자동 배포 (main 브랜치)

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
