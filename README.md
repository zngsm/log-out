# log-out

Vite + React + TypeScript 기반 게임 프로젝트 기본 토대입니다.

## Requirements

- Node.js 20+
- npm 10+

## Environment Setup

1. 의존성 설치

```bash
npm install
```

2. 개발 서버 실행

```bash
npm run dev
```

3. 프로덕션 빌드

```bash
npm run build
```

4. 빌드 결과 미리보기

```bash
npm run preview
```

## Project Structure

```text
src/
  App.tsx
  main.tsx
  styles.css
```

## Server Upload Guide

프로덕션 업로드는 `npm run build` 이후 생성되는 `dist/` 디렉토리를 기준으로 진행합니다.

### Static Hosting

- `dist/` 내부 파일 전체를 정적 호스팅 서버에 업로드합니다.
- 서버의 document root가 `dist/` 내용을 직접 서빙하도록 설정합니다.

예시:

- Nginx, Apache 같은 웹 서버의 정적 파일 경로에 `dist/` 파일 배치
- CDN / object storage 기반 정적 호스팅에 `dist/` 업로드

### Upload Checklist

1. `npm run build` 성공 확인
2. `dist/index.html` 생성 확인
3. `dist/assets/` 생성 확인
4. 서버에 `dist/` 내용 업로드
5. 배포 URL에서 첫 화면 정상 렌더링 확인

## Next Step

- `feat-002`: 파일 탐색기, AI 대화 패널, HUD가 있는 기본 게임 레이아웃 구현

