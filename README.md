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
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET_PRIVATE=
AWS_CLOUDFRONT_DOMAIN=
AWS_CLOUDFRONT_KEY_PAIR_ID=
PORTONE_API_KEY=
PORTONE_API_SECRET=
PORTONE_IMP_CODE=
PAYMENT_ALERT_WEBHOOK_URL=
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
