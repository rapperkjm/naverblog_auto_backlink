# Naver Blog Backlink Hub Sample

전자책 예제용 샘플 프로젝트입니다. 네이버 블로그 글 목록을 수집하고, Vercel 사이트에 `/nb/[blogId]/[logNo]` 백링크 페이지와 `sitemap.xml`을 생성합니다.

## 주의

이 샘플은 개인용 자동화 예제입니다. Google 색인을 보장하지 않습니다. Search Console의 sitemap 제출은 Google이 URL을 발견하도록 돕는 신호입니다.

## 시작하기

```bash
npm install
cp .env.example .env
```

`.env`에서 `NAVER_BLOG_IDS`, `SITE_ORIGIN`을 수정합니다.

```bash
npm run sync:naver
npm run dev
```

## 주요 명령어

```bash
npm run dev              # 로컬 실행
npm run check            # 타입/문법 검사
npm run sync:naver       # 네이버 글 목록 수집 + 정적 sitemap 생성
npm run generate:sitemap # generated-posts.json 기준 정적 sitemap/robots 생성
npm run build            # Vercel 배포용 빌드
```

## Search Console

1. `https://your-project.vercel.app/`를 URL 접두어 속성으로 추가합니다.
2. HTML 인증 파일을 다운로드해 `static/` 폴더에 넣습니다.
3. 배포 후 `https://your-project.vercel.app/googlexxxx.html`이 열리는지 확인합니다.
4. Sitemaps 메뉴에 `sitemap.xml`을 제출합니다.

## 공개 레포에 넣지 말 것

- 실제 `.env`
- 실제 Google Search Console 인증 파일
- 개인 블로그 전체 글 데이터
- Vercel 빌드 산출물
