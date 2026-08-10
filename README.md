# Naver Blog Link Hub Sample

전자책 예제용 SvelteKit 프로젝트입니다. 네이버 블로그의 최신 글을 RSS와 글 목록 API로 수집하고, Vercel에 배포한 링크 허브의 목록 페이지를 통해 검색엔진이 네이버 원문 링크를 발견할 수 있도록 구성합니다.

> 이 프로젝트는 Google 색인이나 검색 노출을 보장하지 않습니다. 사이트맵과 일반 링크는 URL 발견을 돕는 신호이며, 실제 크롤링과 색인 여부는 검색엔진이 결정합니다.

## 현재 구조

```text
네이버 RSS + 최근 글 목록 확인
        ↓
generated-posts.json 증분 갱신
        ↓
/                         최신 100개
/archive/2                101~200번째
/archive/3                201~300번째
...                       나머지 글
        ↓
각 제목은 네이버 원문으로 직접 연결
        ↓
sitemap.xml에 홈페이지와 archive 페이지 등록
        ↓
GitHub Actions 자동 커밋 → Vercel 재배포
```

예전 샘플처럼 글마다 Vercel의 얇은 중간 페이지를 사이트맵에 넣지 않습니다. 기존 `/nb/[blogId]/[logNo]` 주소는 호환성을 위해 남겨두되 네이버 원문으로 `308 Permanent Redirect`합니다.

## 주요 기능

- RSS 기반 최신 글 수집
- 기존 `generated-posts.json`을 활용한 증분 동기화
- 필요할 때 실행하는 전체 재수집 모드
- 홈페이지와 `/archive/[page]`에 100개 단위 목록 제공
- 모든 글 제목을 네이버 원문 URL로 직접 연결
- 목록 페이지별 `lastmod`를 포함한 정적 `sitemap.xml` 생성
- 네이버 원문을 가리키는 최근 50개 RSS 피드 제공
- GitHub Actions 예약 실행과 변경 시 자동 커밋
- Windows 로컬 빌드에서는 Node adapter, Vercel에서는 Vercel adapter 사용

## 시작하기

```bash
npm install
cp .env.example .env
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

`.env`에서 최소한 다음 값을 바꿉니다.

```env
NAVER_BLOG_IDS=your_blog_id
SITE_ORIGIN=https://your-project.vercel.app
```

여러 블로그는 쉼표로 구분합니다.

```env
NAVER_BLOG_IDS=my_blog,my_second_blog
```

## 최초 전체 수집

공개 샘플의 `generated-posts.json`에는 예제 글만 들어 있습니다. 실제 블로그 전체 목록을 처음 만들 때는 다음 명령을 실행합니다.

```bash
npm run sync:naver:full
```

동작 순서:

1. 블로그별 글 목록을 처음부터 끝까지 수집
2. RSS 최신 글을 추가로 병합
3. `src/lib/server/generated-posts.json` 저장
4. `static/sitemap.xml`과 `static/robots.txt` 생성

글이 많으면 최초 실행에는 시간이 걸릴 수 있습니다.

## 평상시 증분 동기화

최초 수집 이후에는 다음 명령을 사용합니다.

```bash
npm run sync:naver
```

증분 동기화는 다음 순서로 동작합니다.

1. 기존 `generated-posts.json` 읽기
2. RSS 최신 글 수집
3. 최근 글 목록을 최대 몇 페이지만 확인
4. 기존 글만 연속으로 나오면 조기 종료
5. 새 글과 갱신된 정보를 기존 JSON에 병합
6. 아카이브 페이지 수와 `lastmod`를 반영해 사이트맵 재생성

선택 환경변수:

```env
NAVER_INCREMENTAL_MAX_PAGES=5
NAVER_KNOWN_PAGE_STOP_COUNT=2
NAVER_MAX_PAGES_PER_BLOG=1000
```

## 주요 명령어

```bash
npm run dev              # 로컬 개발 서버
npm run check            # Svelte/TypeScript 검사
npm run build            # 로컬 프로덕션 빌드 검증
npm run sync:naver       # 증분 수집 + sitemap 생성
npm run sync:naver:full  # 전체 재수집 + sitemap 생성
npm run generate:sitemap # 현재 JSON 기준 sitemap/robots만 생성
```

## 페이지 구조

### `/`

최신 글 100개를 표시합니다. 페이지 하단의 번호를 통해 이전 글 아카이브로 이동합니다.

### `/archive/2`, `/archive/3`, ...

저장된 글을 최신순으로 100개씩 나눈 목록 페이지입니다. 각 페이지는 고유한 canonical URL을 가지며 사이트맵에 포함됩니다.

`/archive/1`은 홈페이지와 중복되므로 `/`로 영구 리디렉션됩니다.

### `/nb/[blogId]/[logNo]`

과거 구조와 이미 색인된 주소를 위한 호환 라우트입니다. 화면을 표시하지 않고 네이버 원문으로 `308` 리디렉션합니다.

### `/feed.xml`

최신 글 50개의 네이버 원문 URL을 담은 RSS 피드입니다.

### `/sitemap.xml`

홈페이지와 모든 유효한 아카이브 목록 페이지만 포함합니다. 네이버 원문이나 `/nb/...` 리디렉션 URL은 직접 넣지 않습니다.

글이 6,300개라면 대략 다음 구조가 됩니다.

```text
/
/archive/2
/archive/3
...
/archive/63 또는 /archive/64
```

각 목록 페이지 안에는 최대 100개의 네이버 원문 링크가 일반 `<a href>`로 들어갑니다.

## GitHub Actions 설정

워크플로 파일:

```text
.github/workflows/sync-naver-posts.yml
```

저장소에서 다음 메뉴로 이동합니다.

```text
Settings
→ Secrets and variables
→ Actions
→ Variables
→ Repository variables
```

필수 Repository Variables:

```text
NAVER_BLOG_IDS = your_blog_id
SITE_ORIGIN     = https://your-project.vercel.app
```

선택 Variables:

```text
NAVER_INCREMENTAL_MAX_PAGES = 5
NAVER_KNOWN_PAGE_STOP_COUNT = 2
```

샘플 워크플로는 하루 네 번 실행되도록 작성되어 있습니다. 위 필수 변수가 없으면 작업을 안전하게 건너뜁니다.

새 글이 있을 때만 다음 파일이 변경되고 자동 커밋됩니다.

```text
src/lib/server/generated-posts.json
static/sitemap.xml
static/robots.txt
```

GitHub와 Vercel 프로젝트를 연결하면 새 커밋을 감지해 Vercel이 다시 배포합니다.

## Vercel 배포

Vercel 프로젝트의 Environment Variables에도 다음 값을 등록합니다.

```text
NAVER_BLOG_IDS
SITE_ORIGIN
SITE_TITLE
SITE_DESCRIPTION
```

이 샘플은 로컬 Windows 빌드에서 발생할 수 있는 symlink 권한 오류를 피하도록 구성되어 있습니다.

```text
로컬 npm run build → @sveltejs/adapter-node
Vercel 배포          → @sveltejs/adapter-vercel
```

Vercel의 Root Directory는 이 저장소처럼 프로젝트가 루트에 있으면 비워둡니다.

## Google Search Console

1. `https://your-project.vercel.app/`를 **URL 접두어** 속성으로 추가합니다.
2. HTML 인증 파일을 다운로드해 `static/`에 넣습니다.
3. 배포 후 인증 파일 URL이 열리는지 확인합니다.
4. Sitemaps 메뉴에 `sitemap.xml`을 제출합니다.
5. 처리 후 발견된 페이지 수가 홈페이지 + 아카이브 페이지 수와 비슷한지 확인합니다.

사이트맵 성공은 모든 네이버 원문이 즉시 색인된다는 뜻이 아닙니다. Google은 아카이브 페이지를 방문한 뒤 그 안의 네이버 원문 링크를 별도로 발견하고 크롤링 여부를 판단합니다.

## 공개 저장소에 넣지 말 것

- 실제 `.env`
- Google Search Console 인증 파일
- 실제 개인 블로그 전체 `generated-posts.json`
- 토큰, Secret, 개인 이메일 등 민감한 값
- `.svelte-kit`, `.vercel`, `node_modules`, 빌드 산출물

공개 예제에는 지금처럼 가상의 블로그 ID와 소수의 샘플 글만 남기는 것을 권장합니다.

## 주의사항

네이버 글 목록 수집에 사용하는 응답은 공식 공개 API가 아닙니다. 네이버가 응답 형식이나 접근 방식을 변경하면 수집 스크립트 수정이 필요할 수 있습니다. 개인용 자동화와 학습 목적에 맞춰 요청 주기를 과도하게 높이지 마세요.
