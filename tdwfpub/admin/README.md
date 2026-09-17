# 관리자 사이트 개발 전달사항

관리자모드 별도 산출물입니다.
진입 파일은 `/admin/admin-login.html`이며, 로그인 후 메인 화면은 `/admin/admin-main.html`입니다.

## 기본 구조

- 공통 JS: `/admin/js/admin.js`
- include 로드: `/admin/js/include.js`
- form 관련 JS: `/admin/js/form.js` (퍼블리싱용으로 임의작업 한 내용이니 전부 제거 및 변경하셔도 무방합니다.)

## 페이지 활성화 규칙

- 각 페이지의 `body`에는 `data-site="admin"`, `data-section`, `data-page`를 지정합니다.
- GNB/LNB 활성화와 방문 페이지 탭 활성화는 `data-page` 값을 기준으로 처리합니다.
- `header.html`의 `data-nav`, `lnb-community.html`의 `data-lnb-page`, 각 페이지의 `body[data-page]` 값이 서로 맞아야 합니다.

예시:

```html
<body data-site="admin" data-section="community" data-page="notice"></body>
```

## 방문 페이지 탭

- 방문 페이지 탭은 `/admin/js/admin.js`에서 `localStorage`에 저장합니다.
- 저장 키는 `twf-admin-open-tabs`입니다.
- 최대 8개까지만 유지합니다. 같은 메뉴를 다시 열면 기존 탭을 제거하고 최근 탭으로 다시 저장합니다.
- 탭 판별은 페이지 경로만이 아니라 `data-page` 기준으로도 처리합니다.

## 글쓰기/수정 공통 규칙

- 수정 화면으로 사용할 경우 표시를 함께 변경해야합니다.
  - 페이지 제목 `글쓰기` → `글수정`
  - 브레드크럼 현재 위치 `글쓰기` → `글수정`
  - 하단 버튼 `등록하기` → `수정하기`
- 에디터 연결 위치는 HTML 주석 `에디터 연결 위치`로 표시했습니다.
