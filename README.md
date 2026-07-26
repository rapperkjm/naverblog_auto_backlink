# Naver Blog Backlink Hub Sample

전자책 예제용 샘플 프로젝트입니다. 네이버 블로그 글 목록을 수집하고, Vercel 사이트에 `/nb/[blogId]/[logNo]` 백링크 페이지와 `sitemap.xml`을 생성합니다.

## 주의

이 샘플은 개인용 자동화 예제입니다. Google 색인을 보장하지 않습니다. Search Console의 sitemap 제출은 Google이 URL을 발견하도록 돕는 신호입니다.

실제 공개 저장소에는 `.env`, Google Search Console 인증 파일, 개인 블로그 전체 글 데이터, Vercel 빌드 산출물을 포함하지 마세요.

## 시작하기

```bash
npm install
cp .env.example .env
```

Windows PowerShell에서는 다음 명령을 사용할 수 있습니다.

```powershell
copy .env.example .env
```

`.env`에서 `NAVER_BLOG_IDS`, `SITE_ORIGIN`을 수정합니다.

```bash
npm run sync:naver
npm run check
npm run build
npm run dev
```

## npm install 경고에 대하여

이 샘플은 의존성 경고를 줄이기 위해 주요 패키지를 최신 안정 버전대로 맞춰두었습니다.

- `fast-xml-parser`는 5.x 사용
- `@sveltejs/adapter-vercel`은 6.x 사용
- Windows 로컬 빌드 안정성을 위해 `@sveltejs/adapter-node` 함께 사용
- `vite`는 Node 18/20/22에서 다루기 쉬운 6.x 사용
- `cookie` 하위 의존성 보안 경고를 피하기 위해 `overrides` 사용

`npm audit fix --force`는 주요 패키지를 의도하지 않은 버전으로 바꿀 수 있으므로 바로 실행하지 않는 것을 권장합니다. 먼저 `npm audit`으로 어떤 패키지에서 나온 경고인지 확인하고, 필요한 패키지만 직접 업데이트하세요.

## 주요 명령어

```bash
npm run dev              # 로컬 실행
npm run check            # 타입/문법 검사
npm run sync:naver       # 네이버 글 목록 수집 + 정적 sitemap 생성
npm run generate:sitemap # generated-posts.json 기준 정적 sitemap/robots 생성
npm run build            # 로컬 빌드 검증 및 Vercel 배포 빌드
```

## Windows 로컬 빌드 참고

`@sveltejs/adapter-vercel`은 빌드 산출물을 만들 때 심볼릭 링크를 생성할 수 있습니다. Windows에서는 권한 설정에 따라 `EPERM: operation not permitted, symlink` 오류가 날 수 있습니다.

이 샘플은 이를 피하기 위해 로컬에서는 `@sveltejs/adapter-node`로 빌드하고, Vercel 배포 환경에서는 `@sveltejs/adapter-vercel`을 사용하도록 `svelte.config.js`를 구성했습니다.

```js
const isVercel = process.env.VERCEL === '1' || process.env.VERCEL === 'true';
adapter: isVercel ? adapterVercel() : adapterNode()
```

즉, Windows에서 `npm run build`를 실행해도 로컬 빌드 검증이 가능하고, Vercel에 배포하면 Vercel 전용 adapter가 자동으로 적용됩니다.


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
