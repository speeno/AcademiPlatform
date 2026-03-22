# AcademiQ — AI 자격 LMS 통합 플랫폼

> ISO/IEC 17024 기반 AI 자격 교육 + 시험접수 통합 플랫폼  
> **Learn. Certify. Succeed.**

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| **Frontend** | Next.js 14 (App Router) + TypeScript + Tailwind CSS v4 + shadcn/ui |
| **Backend** | NestJS + TypeScript + Prisma ORM (v7) |
| **Database** | PostgreSQL 16 + Redis 7 |
| **Storage** | AWS S3 (비공개 버킷) + CloudFront CDN (Signed URL) |
| **미디어** | AWS MediaConvert (HLS + AES-128 암호화) + Video.js + HLS.js |
| **PDF** | pdfjs-dist (뷰어) + pdf-lib (서버사이드 동적 워터마킹) |
| **결제** | 포트원(구 아임포트) PG |
| **이메일/SMS** | AWS SES + Solapi (알림톡) |

---

## 로컬 개발 환경 실행

### 1. Docker Compose로 DB 실행

```bash
docker-compose up postgres redis -d
```

### 2. 백엔드 실행

```bash
cd backend
cp .env.example .env       # 환경변수 설정
npx prisma migrate dev     # DB 마이그레이션
npm run start:dev          # http://localhost:4400/api
```

### 2-1. DB 변경 자동 반영(선택)

로컬에서 백엔드 시작 시 DB 반영을 자동화하려면 아래 플래그를 사용합니다.

```bash
# migration 파일 자동 적용
AUTO_DB_SYNC=true ./start.sh

# (개발 전용) migration 적용 후 db push 추가 실행
AUTO_DB_SYNC=true AUTO_DB_PUSH=true ./start.sh
```

주의:
- `AUTO_DB_PUSH`는 개발 환경에서만 권장됩니다.
- 운영/배포는 `prisma migrate deploy`만 사용하세요.

### 3. 프론트엔드 실행

```bash
cd frontend
cp .env.local.example .env.local
npm run dev                # http://localhost:3300
```

---

## 폴더 구조

```
/AcademiPlatform
├── frontend/                        # Next.js 14 App Router
│   ├── app/
│   │   ├── (public)/               # 홈, 소개, 과정목록, 시험접수
│   │   ├── (auth)/                 # 로그인, 회원가입
│   │   ├── (classroom)/            # 내 강의실, 마이페이지
│   │   └── (admin)/                # 관리자 백오피스
│   ├── components/
│   │   ├── layout/                 # Navbar, Footer, Logo
│   │   ├── ui/                     # 브랜드 컴포넌트 (BrandButton, BrandCard, BrandBadge, BrandProgress)
│   │   ├── player/                 # Video.js 커스텀 플레이어 + 워터마킹
│   │   └── pdf-viewer/             # PDF.js 보호 웹뷰어
│   └── public/logo/                # logo-main.png, logo-mockup.png
│
├── backend/                        # NestJS
│   ├── src/
│   │   ├── auth/                   # JWT 인증, RBAC
│   │   ├── courses/                # 교육과정, 수강 등록
│   │   ├── lms/                    # 학습 진도 관리
│   │   ├── media/                  # HLS 스트리밍, AES 키 서버, Signed URL
│   │   ├── textbook/               # PDF 교재, 동적 워터마킹, 권한 관리
│   │   ├── exam/                   # 시험 회차, 접수 관리
│   │   ├── payment/                # 포트원 PG 연동
│   │   ├── intro/                  # 소개 페이지 CMS
│   │   ├── notify/                 # 이메일/SMS 알림
│   │   ├── qna/                    # 학생-강사 Q&A
│   │   ├── admin/                  # 관리자 공통 (공지, FAQ, 문의, 회원)
│   │   └── common/                 # Guards, Decorators, Filters
│   └── prisma/schema.prisma        # 전체 DB 스키마
│
└── docker-compose.yml
```

---

## 핵심 보안 기능

### 동영상 복제 방지 (3단계)
1. **Layer 1**: CloudFront Signed URL (15분 만료) + S3 비공개 버킷 + 수강 검증 + 동시 세션 1개 제한
2. **Layer 2**: AWS MediaConvert HLS + AES-128 암호화 + NestJS 내장 키 서버
3. **Layer 3**: Canvas API 가시적 워터마킹 (사용자 이름/이메일 + 위치 랜덤 이동)

### PDF 교재 보호 (3단계)
1. **Layer 1**: S3 비공개 + NestJS 백엔드 프록시 스트리밍 + 15분 뷰어 토큰
2. **Layer 2**: `pdf-lib` 서버사이드 동적 워터마킹 (사용자 정보 + 열람 일시)
3. **Layer 3**: PDF.js 커스텀 뷰어 (다운로드/인쇄 버튼 제거, 우클릭/드래그 차단)

---

## 환경변수

백엔드 (`backend/.env`):

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/academiq
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret
REDIS_URL=redis://localhost:6379
AWS_REGION=ap-northeast-2
# R2(S3 호환) 표준 키
S3_ENDPOINT=https://<accountid>.r2.cloudflarestorage.com
S3_REGION=auto
S3_BUCKET=
S3_ACCESS_KEY=
S3_SECRET_KEY=

# 레거시 AWS fallback 키
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET_PRIVATE=
AWS_CLOUDFRONT_DOMAIN=
AWS_CLOUDFRONT_KEY_PAIR_ID=
PORTONE_API_KEY=
PORTONE_API_SECRET=
PORTONE_IMP_CODE=
PAYMENT_ALERT_WEBHOOK_URL=

# 로컬 시작 스크립트용(선택)
AUTO_DB_SYNC=false
AUTO_DB_PUSH=false
```

프론트엔드 (`frontend/.env.local`):

```env
NEXT_PUBLIC_API_URL=http://localhost:4400/api
NEXT_PUBLIC_SITE_URL=http://localhost:3300
```

---

## 운영 문서

- 결제 운영 런북: `PAYMENT_RUNBOOK.md`
- 배포 체크리스트: `RELEASE_CHECKLIST.md`
- Render 배포/운영 가이드: `DEPLOY.md` (무료 플랜 keep-alive 포함)

## DB 자동 반영 체크리스트

- 로컬
  - 기본은 수동(`AUTO_DB_SYNC=false`)
  - 자동 반영이 필요하면 `AUTO_DB_SYNC=true`로 시작
  - 스키마 변경 후 migration 파일 생성 여부 확인
- 배포
  - 시작 시 `prisma migrate deploy`가 먼저 실행되어야 함
  - 실패 시 `DATABASE_URL`, migration 충돌, DB 권한을 우선 점검

## R2 스토리지 점검 체크리스트

- 필수 키: `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`
- fallback 키: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET_PRIVATE`
- 주요 오류 대응
  - `403 signature mismatch`: endpoint/region/key 불일치 확인
  - `NoSuchBucket`: `S3_BUCKET` 오탈자/권한 확인
  - `Credential is missing`: access/secret 키 누락 확인

## 교재 PDF 업로드/열람 운영 규칙

- 로컬 개발
  - S3 미설정 시 관리자 교재 업로드는 `upload-local` 경로로 저장
  - 저장 위치 기본값: `backend/static/textbooks/uploads` (`TEXTBOOK_STORAGE_PATH` 설정 시 해당 경로 사용)
  - 교재 레코드에는 `localPath`가 저장되어 사용자 열람 시 로컬 파일을 우선 읽음
- 배포 환경
  - 기본은 `s3Key`(R2/S3) 기반 업로드/열람 권장
  - 운영에서도 `localPath` fallback이 가능하지만 `TEXTBOOK_STORAGE_PATH`를 영속 디스크 경로(Render Disk 등)로 맞춰야 함
- 공통
  - PDF 열람 시 워터마크는 ASCII 안전 문자열로 생성되어 한글 이름 계정에서도 인코딩 오류 없이 동작

## 강사 다중배정 Q&A 운영 체크리스트

- 질문 생성 전제
  - 학생은 `Enrollment.ACTIVE` 상태인 강좌에만 질문 가능
  - 질문 작성 시 `assignedInstructorId`는 해당 강좌 배정 강사 목록에서만 선택 가능
- 강사 배정 소스(중복 모델 없이)
  - `Course.instructorId`
  - `Course.cmsOwnerId`
  - `CourseCmsCollaborator`
- 상태 전이
  - 질문 생성: `OPEN`
  - 강사/운영자 답변 등록: `ANSWERED` + `answeredAt` 갱신
  - 닫힘 처리(`CLOSED`) 질문은 답변 차단
- 점검 API
  - 학생: `POST /api/qna/questions`, `GET /api/qna/my-questions`
  - 강사: `GET /api/qna/instructor/questions`, `POST /api/qna/questions/:id/answers`
  - 공통: `GET /api/qna/courses/:courseId/instructors`
- 이메일 점검
  - 강사 답변 직후 `NotifyService`의 email 전송 로그/SES 전송 여부 확인
  - 개발 환경에서 SES 미연동 시, 실패 로그를 기준으로 템플릿/수신자/권한 확인
