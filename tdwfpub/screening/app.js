/*
 * 선발·심사 통합 기획 화면 동작.
 *
 * 서버 없이 브라우저에서 바로 열어 보는 기획 검수본이다.
 * 수치는 As-Is SQL 주석과 개발 DB 에서 확인한 값을 바탕으로 만든 예시이며,
 * 사업을 바꾸면 단계·표·탭이 그 사업 기준으로 바뀐다.
 */
(function () {
	"use strict";

	/* ===== 단계 ===== */
	var STAGES = ["선발기준설정", "1차심사", "1차선발", "후속심사", "최종선발", "지급요청", "지급완료"];

	/*
	 * 사업별 업무절차. 「사업별 업무절차」 표를 그대로 옮겼다.
	 * flow 의 값: true = 거침, "-" = 해당 없음, 문자열 = 그 단계의 내용.
	 */
	var BIZ = {
		"0003": {
			name: "건강검진사업", notice: "2024년 건강검진사업", yearDeg: "2024001", cycle: "정기",
			flow: [true, true, true, "검진청구서류 심사", true, true, true], current: 3,
			mode: "LOTTERY", basis: "APPLY", followup: "checkup", note: "협약병원 연계",
			benefitKeys: "운전자 실명번호 (배우자 신청 시 배우자 성명·생년월일 포함)",
			benefitGroup: null, dup: false,
			next: "기간내 미검진 처리 → 결원 재선발",
			/*
			 * 2024001 실데이터 (TDWF.T_PBANC_SLCTN_SECT / T_PBANC_SLCTN_TYPE / T_RCPT_MNG).
			 * [부문, 본인 정원, 배우자 정원, 본인 신청, 배우자 신청]. 2024년은 배우자 신청도 1건 = 1명이다.
			 * 부문은 추첨선발(COM074 02), 정원은 인원(명)으로만 들어가 있다(SLCTN_RT = 0).
			 * 공고 모집인원은 5,001명으로 등록돼 있으나 부문 합계는 5,509명이고, 접수 0건인 「전국」 부문(6,400명)은 뺐다.
			 */
			typeCols: true, stdBasis: "COUNT", rcptPeriod: "2024-01-15 ~ 2024-02-16",
			dataNote: "2024001 실데이터 · 부문 17개 × 유형 2개",
			dropReasons: ["검진포기", "기간내 미검진", "자격 미달"],
			parts: [
				["서울", 174, 562, 184, 298], ["경기", 329, 1220, 336, 627], ["인천", 49, 226, 50, 114],
				["광주", 55, 262, 55, 135], ["대전", 48, 228, 48, 117], ["울산", 25, 132, 25, 71],
				["부산", 74, 296, 75, 151], ["강원", 19, 94, 19, 49], ["대구", 58, 236, 58, 119],
				["전남", 27, 130, 27, 66], ["경북", 41, 258, 42, 133], ["전북", 16, 80, 16, 40],
				["경남", 48, 274, 49, 141], ["충북", 50, 168, 53, 92], ["충남", 50, 216, 52, 115],
				["제주", 7, 24, 8, 12], ["세종", 7, 26, 8, 14]
			],
			types: [["본인", 1], ["배우자", 1]],
			conds: [["운전자 주소 시도", "일치", "부문별 시도코드 (서울 11, 경기 41, 인천 28 …)"], ["신청구분", "일치", "본인 / 배우자"]]
		},
		"0001": {
			name: "일반장학사업", notice: "2026년 일반장학사업", yearDeg: "2026001", cycle: "정기",
			flow: [true, true, true, "-", true, true, true], current: 2,
			mode: "MIXED", basis: "APPLY", followup: "none",
			benefitKeys: "운전자 실명번호 + 지원자 성명·생년월일·학교구분",
			benefitGroup: "희망바퀴장학사업(0024) 포함", dup: true,
			next: "서류탈락 결원 37명 → 추가선발",
			parts: [["중학생", 1100, 0, 1214, 0], ["고등학생", 2600, 0, 2890, 0], ["대학생", 4100, 0, 4536, 0]],
			types: [["일반", 1, "LOTTERY"], ["다자녀가정", 1, "RANK"], ["성적우수", 1, "RANK"]],
			conds: [["학교구분", "일치", "부문별 (중 / 고 / 대)"], ["특례구분", "일치", "다자녀 06 / 성적우수 …"], ["학년", "범위", "1 ~ 6"]]
		},
		"0024": {
			name: "희망바퀴장학사업", notice: "2026년 희망바퀴장학사업", yearDeg: "2026001", cycle: "정기",
			flow: [true, true, true, "-", true, true, true], current: 1,
			mode: "RANK", basis: "APPLY", followup: "none",
			benefitKeys: "운전자 실명번호 + 지원자 성명·생년월일·학교구분",
			benefitGroup: "일반장학사업(0001) 포함", dup: true,
			next: "중복수혜 의심 9쌍 판정",
			parts: [["고등학생", 300, 0, 412, 0], ["대학생", 500, 0, 688, 0]],
			types: [["오일뱅크", 1, "RANK"]],
			conds: [["학교구분", "일치", "부문별 (고 / 대)"], ["평가점수", "범위", "점수 높은 순"]]
		},
		"0016": {
			name: "예방접종지원사업", notice: "2026년 예방접종지원사업", yearDeg: "2026001", cycle: "수시",
			flow: [true, true, true, "접종청구서류 심사", true, true, true], current: 3,
			mode: "RANK", basis: "APPLY", followup: "vaccine", note: "협약병원 연계",
			benefitKeys: "운전자 실명번호", benefitGroup: null, dup: false,
			next: "접종청구서류 1,284건 심사",
			parts: [["전국", 9000, 0, 9420, 0]],
			types: [["예방접종", 1, "RANK"]],
			conds: [["접수일시", "범위", "접수 순서"]]
		},
		"0011": {
			name: "4대중증질환사업", notice: "2026년 4대중증질환사업", yearDeg: "2026001", cycle: "수시",
			flow: [true, true, true, "전문의 심사", true, true, true], current: 4,
			mode: "RANK", basis: "APPLY", followup: "generic", followupLabel: "전문의 심사",
			benefitKeys: "운전자 실명번호", benefitGroup: null, dup: false,
			next: "최종선발 결재·발표",
			parts: [["전국", 120, 0, 147, 0]], types: [["중증질환", 1, "RANK"]],
			conds: [["질환구분", "일치", "암·심장·뇌혈관·희귀"]]
		},
		"0002": {
			name: "교통사고생계지원사업", notice: "2026년 교통사고생계지원사업", yearDeg: "2026001", cycle: "수시",
			flow: [true, true, true, "운영위 심사", true, true, true], current: 5,
			mode: "RANK", basis: "APPLY", followup: "generic", followupLabel: "운영위원회 심사",
			benefitKeys: "운전자 실명번호", benefitGroup: null, dup: false,
			next: "지급요청 18건",
			parts: [["전국", 60, 0, 71, 0]], types: [["사망·중상", 1, "RANK"]],
			conds: [["피해구분", "일치", "사망 / 중상"]]
		},
		"0014": {
			name: "차량구입지원사업(삼성카드)", notice: "2026년 차량구입지원사업", yearDeg: "2026001", cycle: "정기",
			flow: [true, true, true, "-", true, true, true], current: 0,
			mode: "LOTTERY", basis: "APPLY", followup: "none",
			benefitKeys: "운전자 실명번호", benefitGroup: null, dup: false,
			next: "평가조건 설정 후 예비선발",
			parts: [["전국", 200, 0, 563, 0]], types: [["일반", 1, "LOTTERY"]],
			conds: [["카드사", "일치", "삼성카드"]]
		},
		"0022": {
			name: "교통안전(DTG) 지원사업", notice: "2027년 디지털운행기록장치(DTG) 지원사업", yearDeg: "2027001", cycle: "수시",
			flow: [true, true, true, "장착증빙서류 심사", true, true, true], current: 3,
			mode: "RANK", basis: "APPLY", followup: "generic", followupLabel: "장착증빙서류 심사",
			benefitKeys: "차량번호", benefitGroup: null, dup: false,
			next: "장착증빙서류 212건 심사",
			parts: [["전국", 1500, 0, 1688, 0]], types: [["DTG", 1, "RANK"]],
			conds: [["차량 톤수", "범위", "1톤 초과"]]
		},
		"0021": {
			name: "멤버십카드지원사업", notice: "2027년 멤버십카드지원사업", yearDeg: "2027001", cycle: "수시",
			flow: [true, true, true, "-", "-", "-", "-"], current: 0,
			mode: "RANK", basis: "APPLY", followup: "none",
			benefitKeys: "-", benefitGroup: null, dup: false,
			next: "접수내역 검토 및 카드 일괄등록",
			parts: [["전국", 0, 0, 1280, 0]], types: [["회원", 1, "RANK"]],
			conds: [["회원구분", "일치", "정회원"]]
		},
		"0023": {
			name: "사각지대경고장치(BSD) 지원사업", notice: "2026년 BSD 지원사업", yearDeg: "2026001", cycle: "수시",
			flow: [true, true, true, "-", true, true, true], current: 0,
			mode: "RANK", basis: "APPLY", followup: "none",
			benefitKeys: "차량번호", benefitGroup: null, dup: false,
			next: "접수내역 검토",
			parts: [["전국", 0, 0, 386, 0]], types: [["BSD", 1, "RANK"]],
			conds: [["접수일시", "범위", "접수 순서"]]
		},
		"0017": {
			name: "법률구조지원사업", notice: "2026년 법률구조지원사업", yearDeg: "2026001", cycle: "수시",
			flow: [true, true, true, "-", true, true, true], current: 0,
			mode: "RANK", basis: "APPLY", followup: "none",
			benefitKeys: "운전자 실명번호", benefitGroup: null, dup: false,
			next: "자격요건 및 사건 검토",
			parts: [["전체", 0, 0, 84, 0]], types: [["일반", 1, "RANK"]],
			conds: [["운송종사자격증", "일치", "유효"], ["유가보조금", "일치", "적합"]]
		},
		"0025": {
			name: "출생축하지원사업", notice: "2026년 출생축하지원사업", yearDeg: "2026001", cycle: "수시",
			flow: [true, true, true, "-", true, true, true], current: 0,
			mode: "RANK", basis: "APPLY", followup: "none",
			benefitKeys: "운전자 실명번호", benefitGroup: null, dup: false,
			next: "접수내역 검토 및 지급대기자 관리",
			parts: [["전체", 0, 0, 312, 0]], types: [["출생축하", 1, "RANK"]],
			conds: [["접수일시", "범위", "접수 순서"]]
		}
	};

	/* 선발기준설정은 사업별로 허용된 기준만 보여 준다. */
	var STD_POLICIES = {
		"0001": { mode: "FIXED", guide: "학교급별 선발인원을 직접 배정", keys: ["TOP_GRADE", "PREV_NOT_SELECTED", "NO_SELECTED_CHILD", "GRADE"],
			sorts: [["TOP_GRADE", "MATCH_FIRST"], ["PREV_NOT_SELECTED", "MATCH_FIRST"], ["NO_SELECTED_CHILD", "MATCH_FIRST"], ["GRADE", "DESC"]] },
		"0024": { mode: "AUTO", guide: "학년별 신청현황에 따라 자동 배정", keys: ["PERCENTILE", "CREDITS", "TYPE_ORDER", "RCPT"],
			sorts: [["PERCENTILE", "DESC"], ["CREDITS", "DESC"], ["TYPE_ORDER", "ORDERED", "저소득 → 장애인 → 한부모 → 다문화 → 다자녀"]] },
		"0003": { mode: "AUTO", guide: "지역별 신청현황에 따라 자동 배정", keys: ["SELF_APPLY", "PREV_NOT_SELECTED", "BENEFIT_COUNT", "AGE", "RCPT"],
			sorts: [["SELF_APPLY", "MATCH_FIRST"], ["PREV_NOT_SELECTED", "MATCH_FIRST"], ["BENEFIT_COUNT", "ASC"], ["AGE", "DESC"]] },
		"0016": { mode: "UNLIMITED", guide: "예방접종 · 예산 범위 내 선착순", keys: ["RCPT"], sorts: [["RCPT", "ASC"]] },
		"0021": { mode: "UNLIMITED", guide: "멤버십카드 · 예산 범위 내 선착순", keys: ["RCPT"], sorts: [["RCPT", "ASC"]] },
		"0014": { mode: "UNLIMITED", guide: "차량구입 · 예산 범위 내 선착순", keys: ["RCPT"], sorts: [["RCPT", "ASC"]] },
		"0022": { mode: "UNLIMITED", guide: "DTG · 예산 범위 내 선착순", keys: ["RCPT"], sorts: [["RCPT", "ASC"]] },
		"0023": { mode: "UNLIMITED", guide: "BSD · 예산 범위 내 선착순", keys: ["RCPT"], sorts: [["RCPT", "ASC"]] },
		"0025": { mode: "UNLIMITED", guide: "출생축하 · 예산 범위 내 선착순", keys: ["RCPT"], sorts: [["RCPT", "ASC"]] },
		"0017": { mode: "UNLIMITED", guide: "법률구조 · 자격요건 충족 건 지원", keys: ["LICENSE_VALID", "FUEL_VALID", "RCPT"],
			sorts: [["LICENSE_VALID", "MATCH_FIRST"], ["FUEL_VALID", "MATCH_FIRST"], ["RCPT", "ASC"]] },
		"0011": { mode: "UNLIMITED", guide: "4대중증 · 예산 범위 내 접수순", keys: ["RCPT"], sorts: [["RCPT", "ASC"]] },
		"0002": { mode: "UNLIMITED", guide: "교통사고생계 · 예산 범위 내 접수순", keys: ["RCPT"], sorts: [["RCPT", "ASC"]] }
	};

	var state = { biz: "0003", extra: "none", noshow: "none", approved: false };

	/* ===== 공통 도구 ===== */
	function $(selector, root) { return (root || document).querySelector(selector); }
	function $$(selector, root) { return Array.prototype.slice.call((root || document).querySelectorAll(selector)); }
	function num(value) { return Number(value || 0).toLocaleString("ko-KR"); }
	function biz() { return BIZ[state.biz]; }
	function el(tag, attrs, html) {
		var node = document.createElement(tag);
		Object.keys(attrs || {}).forEach(function (key) {
			if (key === "class") node.className = attrs[key]; else node.setAttribute(key, attrs[key]);
		});
		if (html !== undefined) node.innerHTML = html;
		return node;
	}
	function badge(text, color) { return '<span class="badge ' + (color || "") + '">' + text + "</span>"; }
	function btn(text, attrs, look) {
		return '<button type="button" class="btn ' + (look || "variant-outline color-navy") + ' rounded-md size-sm" ' + (attrs || "") + ">" + text + "</button>";
	}
	function stat(label, value, unit, tone) {
		return '<div class="stat-card ' + (tone || "") + '"><span class="stat-card-label">' + label +
			'</span><span class="stat-card-value">' + value + "<small>" + (unit || "") + "</small></span></div>";
	}
	function showAppToast(message) {
		var toast = $("[data-app-toast]");
		toast.textContent = message;
		toast.hidden = false;
		window.clearTimeout(showAppToast.timer);
		showAppToast.timer = window.setTimeout(function () { toast.hidden = true; }, 4200);
	}

	/* ===== 화면 전환 ===== */
	function route() {
		var id = (location.hash || "#standard").slice(1);
		if (!$('[data-screen="' + id + '"]')) id = "standard";
		$$("[data-screen]").forEach(function (screen) { screen.classList.toggle("is-active", screen.dataset.screen === id); });
		$$(".lnb-list a").forEach(function (link) { link.classList.toggle("active", link.getAttribute("href") === "#" + id); });
		window.scrollTo(0, 0);
	}

	/* ===== 공고 선택 막대 ===== */
	function renderAnnounceBars() {
		var b = biz();
		var options = Object.keys(BIZ).map(function (code) {
			return '<option value="' + code + '"' + (code === state.biz ? " selected" : "") + ">" +
				BIZ[code].name + " · " + BIZ[code].yearDeg.slice(0, 4) + "년 " + Number(BIZ[code].yearDeg.slice(4)) + "회차</option>";
		}).join("");
		var steps = STAGES.map(function (name, index) {
			var flow = b.flow[index];
			var cls = flow === "-" ? "is-na" : (index < b.current ? "done" : (index === b.current ? "active" : ""));
			var sub = flow === "-" ? "해당없음" : (typeof flow === "string" ? flow : name);
			return '<li class="step-item ' + cls + '"><span class="step-num">Step ' + (index + 1) + '</span><span class="step-name">' +
				(typeof flow === "string" && flow !== "-" ? name : sub) + "</span>" +
				(typeof flow === "string" && flow !== "-" ? '<span class="board-form-note">' + flow + "</span>" : "") + "</li>";
		}).join("");

		$$("[data-announce-bar]").forEach(function (bar) {
			/* 선발기준설정은 단계 막대 없이 공고 정보만 보여 준다. */
			if (bar.dataset.announceBar === "plain") {
				var policy = STD_POLICIES[state.biz] || { mode: "FIXED" };
				var recruitPeople = policy.mode === "UNLIMITED" ? "인원 제한 없음" : num(announcedPeople()) + "명";
				bar.innerHTML =
					'<section class="panel" aria-label="사업공고 조회"><div class="std-search-layout">' +
					'<table class="board-search-table"><caption>선발기준을 설정할 사업공고 조회</caption>' +
					'<colgroup><col width="9%" /><col width="31%" /><col width="11%" /><col width="30%" /><col width="9%" /><col width="10%" /></colgroup>' +
					'<tbody><tr><th scope="row">사업명</th><td><div class="flex items-center gap-2 row-type-field"><input type="text" class="form-control w-full" value="' + b.name + '" readonly /><button type="button" class="btn variant-outline color-navy rounded-md size-search-input" data-action="announce-open" data-announce-target="standard">공고조회</button></div></td>' +
					'<th scope="row">공고제목</th><td><input type="text" class="form-control w-full" value="' + b.notice + '" readonly /></td>' +
					'<th scope="row">모집인원</th><td><strong>' + recruitPeople + "</strong></td></tr></tbody></table>" +
					'<button type="button" class="btn variant-solid color-navy rounded-md std-search-button">조회</button></div></section>';
				return;
			}
			bar.innerHTML =
				'<section class="panel" aria-label="사업공고 선택">' +
				'<div class="flex gap-2">' +
				'<table class="board-search-table"><caption>사업공고 선택</caption>' +
				'<colgroup><col width="9%" /><col width="33%" /><col width="9%" /><col width="16%" /><col width="9%" /><col width="24%" /></colgroup>' +
				'<tbody><tr>' +
				'<th scope="row">사업공고</th><td><div class="flex items-center gap-2 row-type-field">' +
				'<select class="form-control w-full" data-biz-select>' + options + "</select>" +
				'<button type="button" class="btn variant-outline color-navy rounded-md size-search-input">공고조회</button></div></td>' +
				'<th scope="row">모집구분</th><td>' + b.cycle + "</td>" +
				'<th scope="row">현재 단계</th><td>' + badge(STAGES[b.current], "blue") + ' <span class="badge">예시 데이터</span></td>' +
				"</tr></tbody></table></div>" +
				'<ol class="board-step-list mt-2" aria-label="사업 단계">' + steps + "</ol>" +
				"</section>";
		});
		$$("[data-biz-select]").forEach(function (select) {
			select.addEventListener("change", function () { selectBiz(select.value); });
		});
	}

	function selectBiz(code) {
		state.biz = code;
		state.extra = "none"; state.noshow = "none"; state.approved = false;
		renderAll();
	}

	function announcementRecords() {
		return Object.keys(BIZ).map(function (code, index) {
			var item = BIZ[code], period = (item.rcptPeriod || "").split(" ~ ");
			var selected = item.parts.reduce(function (sum, part) { return sum + Number(part[1] || 0) + Number(part[2] || 0); }, 0);
			return { no: 201 - index, code: code, title: item.notice, start: period[0] || item.yearDeg.slice(0, 4) + "-01-01", end: period[1] || item.yearDeg.slice(0, 4) + "-12-31", selected: selected, progress: index < 3 ? "접수마감" : (index < 8 ? "접수중" : "준비중"), use: "사용" };
		});
	}

	function renderAnnouncementSearch() {
		var business = $("[data-announce-business]"), progress = $("[data-announce-progress]"), keyword = $("[data-announce-keyword]");
		if (!business.options.length) business.innerHTML = '<option value="">전체</option>' + Object.keys(BIZ).map(function (code) { return '<option value="' + code + '">' + BIZ[code].name + "</option>"; }).join("");
		var rows = announcementRecords().filter(function (item) {
			return (!business.value || item.code === business.value) && (!progress.value || item.progress === progress.value) && (!keyword.value.trim() || item.title.indexOf(keyword.value.trim()) >= 0);
		});
		$("[data-announce-results]").innerHTML = rows.map(function (item) {
			return '<tr><td class="text-center">' + item.no + '</td><td><button type="button" class="board-link-text" data-action="announce-select" data-biz="' + item.code + '">' + item.title + '</button></td><td class="text-center">' + item.start + '</td><td class="text-center">' + item.end + '</td><td class="text-right">' + num(item.selected) + '</td><td class="text-center">' + item.progress + '</td><td class="text-center">' + item.use + "</td></tr>";
		}).join("") || '<tr><td colspan="7" class="text-center review-empty">조회된 공고가 없습니다.</td></tr>';
	}

	function openAnnouncementSearch(target) {
		state.announceTarget = target || "review";
		renderAnnouncementSearch();
		openPopup("popup-announce-search");
	}

	/* ===== 1. 선발기준설정 ===== */
	function quotaRows() {
		var b = biz();
		var rows = [];
		b.parts.forEach(function (part) {
			b.types.forEach(function (type, typeIndex) {
				/* 유형별 정원·신청이 따로 있는 사업은 두 번째 유형이 [2]·[4] 열을 쓴다. */
				var isSpouse = b.typeCols ? typeIndex === 1 : type[1] === 2;
				if (b.basis === "PERSON" || b.typeCols) {
					rows.push({ part: part[0], type: type[0], per: type[1], quota: isSpouse ? part[2] : part[1],
						apply: isSpouse ? part[4] : part[3], mode: type[2] || b.mode });
				} else {
					var share = b.types.length === 1 ? 1 : [0.7, 0.2, 0.1][typeIndex] || 0;
					rows.push({ part: part[0], type: type[0], per: 1, quota: Math.round(part[1] * share),
						apply: Math.round(part[3] * share), mode: type[2] || b.mode });
				}
			});
		});
		return rows;
	}

	function modeLabel(mode) { return { RANK: "순위", LOTTERY: "추첨", MIXED: "혼합" }[mode] || mode; }

	/*
	 * 선발기준설정은 한 화면이다.
	 * 행 = 공고에 설정된 선발부문 × 전형유형. 행에는 선발 비율 또는 인원만 넣는다.
	 * 정렬 기준(최대 5순위)은 모든 부문·유형에 같이 적용해 유형 안의 줄을 세운다.
	 */
	var SORT_LIMIT = 5;
	var SORT_KEYS = {
		RCPT: { label: "접수일시", dirs: ["ASC", "DESC"] },
		TOP_GRADE: { label: "학교급별 최고학년", dirs: ["MATCH_FIRST"] },
		PREV_NOT_SELECTED: { label: "직전년도 미선발자", dirs: ["MATCH_FIRST"] },
		NO_SELECTED_CHILD: { label: "선발자녀 없는 가정", dirs: ["MATCH_FIRST"] },
		GRADE: { label: "학년", dirs: ["DESC", "ASC"] },
		PERCENTILE: { label: "성적(백분위 환산)", dirs: ["DESC", "ASC"] },
		CREDITS: { label: "이수학점", dirs: ["DESC", "ASC"] },
		TYPE_ORDER: { label: "전형", dirs: ["ORDERED"] },
		SELF_APPLY: { label: "운전자 본인만 신청", dirs: ["MATCH_FIRST"] },
		BENEFIT_COUNT: { label: "수혜이력", dirs: ["ASC", "DESC"] },
		AGE: { label: "운전자 나이", dirs: ["DESC", "ASC"] },
		LICENSE_VALID: { label: "운송종사자격증 유효", dirs: ["MATCH_FIRST"] },
		FUEL_VALID: { label: "유가보조금 적합", dirs: ["MATCH_FIRST"] }
	};
	var DIRECTION_LABELS = { ASC: "오름차순", DESC: "내림차순", MATCH_FIRST: "해당 먼저", ORDERED: "순서 지정" };

	function defaultSorts(b) {
		var policy = STD_POLICIES[b.code] || { sorts: [["RCPT", "ASC"]] };
		return policy.sorts.map(function (sort) { return { key: sort[0], dir: sort[1], order: sort[2] || "" }; });
	}

	function stdPolicy() {
		return STD_POLICIES[state.biz] || { mode: "FIXED", guide: "선발인원을 직접 배정", keys: ["RCPT"], sorts: [["RCPT", "ASC"]] };
	}

	function round1(value) { return Math.round(value * 10) / 10; }

	/*
	 * 기준은 두 단계다.
	 *   부문 인원 = 공고 모집인원 × 부문 비율   (또는 부문 인원 직접 입력)
	 *   유형 인원 = 부문 인원 × 유형 비율       (또는 유형 인원 직접 입력)
	 * 인원은 모두 명 단위. 배우자 동반 유형은 2명이 1건이다.
	 */
	function buildStdRows() {
		var b = biz();
		var policy = stdPolicy();
		var rows = quotaRows();
		var total = announcedPeople();
		state.std = {
			code: b.code,
			mode: policy.mode,
			locked: false,
			saved: false,
			savedAt: "",
			history: [["2026-10-20 09:15", "pass004", policy.mode, "최초 기준 등록", "저장"]],
			sorts: defaultSorts(b),
			parts: b.parts.map(function (part) {
				var types = rows.filter(function (row) { return row.part === part[0]; });
				var partQuota = types.reduce(function (sum, row) { return sum + row.quota; }, 0);
				/* 실데이터처럼 정원이 인원으로만 들어 있는 사업은 인원(명)으로 시작한다. */
				var count = policy.mode === "FIXED" || b.stdBasis === "COUNT";
				return {
					name: part[0], basis: count ? "COUNT" : "RATE", value: count ? partQuota : (total ? round1(partQuota / total * 100) : 0),
					types: types.map(function (row) {
						return { type: row.type, per: row.per, apply: row.apply, basis: count ? "COUNT" : "RATE",
							value: count ? row.quota : (partQuota ? round1(row.quota / partQuota * 100) : 0) };
					})
				};
			})
		};
		if (policy.mode === "AUTO") applyAutoAllocation(false);
	}

	function distributeRates(items, weightOf) {
		var total = items.reduce(function (sum, item) { return sum + weightOf(item); }, 0);
		var used = 0;
		items.forEach(function (item, index) {
			var rate = index === items.length - 1 ? round1(100 - used) : round1(total ? weightOf(item) / total * 100 : 0);
			item.basis = "RATE";
			item.value = Math.max(0, rate);
			used = round1(used + rate);
		});
	}

	function applyAutoAllocation(markDirty) {
		if (!state.std || state.std.locked) return;
		distributeRates(state.std.parts, function (part) {
			return part.types.reduce(function (sum, type) { return sum + type.apply * type.per; }, 0);
		});
		state.std.parts.forEach(function (part) {
			distributeRates(part.types, function (type) { return type.apply * type.per; });
		});
		if (markDirty !== false) state.std.saved = false;
	}

	/* 공고 모집인원(명). 공고에 등록된 값이라 기준을 바꿔도 변하지 않는다. */
	function announcedPeople() {
		return quotaRows().reduce(function (sum, row) { return sum + row.quota; }, 0);
	}

	function partPeople(part) {
		if (state.std && state.std.mode === "UNLIMITED") {
			return part.types.reduce(function (sum, type) { return sum + type.apply * type.per; }, 0);
		}
		var v = Number(part.value) || 0;
		return Math.max(0, part.basis === "RATE" ? Math.round(announcedPeople() * v / 100) : v);
	}

	function typePeople(part, type) {
		if (state.std && state.std.mode === "UNLIMITED") return type.apply * type.per;
		var v = Number(type.value) || 0;
		return Math.max(0, type.basis === "RATE" ? Math.round(partPeople(part) * v / 100) : v);
	}

	/* 유형 인원을 건으로 바꾼다. 신청보다 많이 뽑을 수는 없다. */
	function typePicked(part, type) {
		return Math.min(type.apply, Math.floor(typePeople(part, type) / type.per));
	}

	function flatRows() {
		var list = [];
		state.std.parts.forEach(function (part) {
			part.types.forEach(function (type) {
				list.push({ part: part.name, type: type.type, per: type.per, apply: type.apply,
					people: typePeople(part, type), picked: typePicked(part, type) });
			});
		});
		return list;
	}

	function stdTotals() {
		var t = { apply: 0, picked: 0, people: 0, partSum: 0, typeOver: [], left: 0 };
		state.std.parts.forEach(function (part) {
			var pp = partPeople(part);
			var typeSum = part.types.reduce(function (sum, type) { return sum + typePeople(part, type); }, 0);
			t.partSum += pp;
			if (typeSum > pp) t.typeOver.push(part.name);
		});
		flatRows().forEach(function (row) {
			t.apply += row.apply; t.picked += row.picked; t.people += row.picked * row.per;
			/* 신청이 모자라 채우지 못하는 인원. 다른 유형·부문으로 옮길지는 담당자가 정한다. */
			t.left += Math.max(0, row.people - row.picked * row.per);
		});
		t.over = state.std.mode === "UNLIMITED" ? 0 : t.partSum - announcedPeople();
		return t;
	}

	function sortDuplicated() {
		var keys = state.std.sorts.map(function (s) { return s.key; });
		return keys.some(function (k, i) { return keys.indexOf(k) !== i; });
	}

	function valueInput(level, p, t, item) {
		return '<span class="std-input"><input type="number" min="0" step="' + (item.basis === "RATE" ? "0.1" : "1") +
			'" class="form-control text-right" data-std-field="' + level + 'value" data-p="' + p + '" data-t="' + t +
			'" value="' + item.value + '" aria-label="입력값"' + (state.std.locked || state.std.mode === "UNLIMITED" ? " disabled" : "") +
			'/><span>' + (item.basis === "RATE" ? "%" : "명") + "</span></span>";
	}

	/* 항목마다 비율·인원을 고르는 두 칸짜리 스위치 */
	function basisToggle(p, t, basis) {
		return '<span class="std-seg" role="group" aria-label="입력 기준">' + [["RATE", "비율 %"], ["COUNT", "인원 명"]].map(function (opt) {
			return '<button type="button" class="' + (basis === opt[0] ? "is-on" : "") + '" data-action="std-basis" data-p="' + p + '" data-t="' + t +
			'" data-basis="' + opt[0] + '" aria-pressed="' + (basis === opt[0]) + '"' +
			(state.std.locked || state.std.mode === "UNLIMITED" ? " disabled" : "") + '>' + opt[1] + "</button>";
		}).join("") + "</span>";
	}

	/* 비교 결과 표시: diff = 실제 - 기준. 0 이면 일치, 음수면 부족, 양수면 초과. */
	function statusPill(diff, label) {
		if (diff === 0) return '<span class="std-status is-ok">일치</span>';
		return diff < 0
			? '<span class="std-status is-short">' + (label || "") + "부족 " + num(-diff) + "명</span>"
			: '<span class="std-status is-over">' + (label || "") + "초과 " + num(diff) + "명</span>";
	}

	/* 부문 한 개의 계산 결과 */
	function partSummary(part) {
		var pp = partPeople(part);
		var s = { people: pp, typeSum: 0, apply: 0, picked: 0, lack: 0, left: 0 };
		part.types.forEach(function (type) {
			var people = typePeople(part, type);
			var tp = typePicked(part, type);
			s.typeSum += people; s.apply += type.apply; s.picked += tp;
			if (tp * type.per < people) { s.lack += 1; s.left += people - tp * type.per; }
		});
		s.diff = s.typeSum - pp;
		return s;
	}

	/*
	 * 왼쪽: 부문 목록(입력값·인원·유형 합 상태만). 행을 누르면 그 부문을 고른다.
	 * 오른쪽: 고른 부문의 기준과 그 부문에 설정된 유형들의 입력.
	 */
	function renderStandard() {
		var b = biz();
		if (!state.std || state.std.code !== b.code) buildStdRows();
		var parts = state.std.parts;
		if (!(state.std.sel < parts.length)) state.std.sel = 0;
		var issuesOnly = $("[data-std-issues-only]").checked;
		var unlimited = state.std.mode === "UNLIMITED";
		var modeNames = { FIXED: "직접 배정", AUTO: "신청현황 기준 배정", UNLIMITED: "인원 제한 없음" };
		$("[data-std-source]").textContent = "· " + (b.dataNote || ("부문 " + parts.length + "개"));
		$("[data-std-person-note]").hidden = !parts.some(function (part) { return part.types.some(function (type) { return type.per === 2; }); });
		$$('[data-std-mode]').forEach(function (radio) {
			radio.checked = radio.value === state.std.mode;
			radio.disabled = state.std.locked;
		});
		$("[data-std-mode-guide]").textContent = stdPolicy().guide;
		$("[data-std-auto-button]").hidden = state.std.mode !== "AUTO";
		$("[data-std-auto-button]").disabled = state.std.locked;
		$("[data-std-unlimited]").hidden = !unlimited;
		$("[data-std-issues-only]").disabled = unlimited;

		var issueParts = 0;
		$("[data-std-parts]").innerHTML = parts.map(function (part, p) {
			var s = partSummary(part);
			if (!unlimited && s.diff !== 0) issueParts += 1;
			if (!unlimited && issuesOnly && s.diff === 0 && p !== state.std.sel) return "";
			return '<tr class="std-part-item' + (p === state.std.sel ? " is-selected" : "") + (s.diff !== 0 ? " has-issue" : "") +
				'" data-action="std-select" data-p="' + p + '" tabindex="0"><th scope="row">' + part.name + "</th>" +
				'<td class="text-right">' + (unlimited ? '<span class="std-status is-unlimited">제한없음</span>' : (part.basis === "RATE" ? part.value + "%" : num(part.value) + "명")) + "</td>" +
				'<td class="text-right"><b>' + num(s.people) + '</b></td><td class="text-center">' + (unlimited ? '<span class="std-status is-ok">전체 지원</span>' : statusPill(s.diff)) +
				'</td><td class="text-right">' + (unlimited ? '-' : (s.left ? '<span class="std-left">' + num(s.left) + "</span>" : '<span class="std-muted">-</span>')) + "</td></tr>";
		}).join("");

		var tt = stdTotals();
		var announced = announcedPeople();
		$("[data-std-parts-foot]").innerHTML = unlimited
			? '<tr><th scope="row">합계</th><td class="text-right std-muted">제한없음</td><td class="text-right"><b>' + num(tt.apply) + '</b></td><td class="text-center"><span class="std-status is-ok">전체 지원</span></td><td class="text-right">-</td></tr>'
			: '<tr><th scope="row">합계</th><td class="text-right std-muted">모집 ' + num(announced) + '</td><td class="text-right"><b>' + num(tt.partSum) +
			'</b></td><td class="text-center">' + statusPill(tt.over) + '</td><td class="text-right">' + (tt.left ? '<span class="std-left">' + num(tt.left) + "</span>" : "-") + "</td></tr>";

		renderStdDetail();

		$("[data-std-stats]").innerHTML = unlimited
			? stat("인원 배정 기준", modeNames[state.std.mode], "") + stat("접수인원", num(tt.apply), "명") +
				stat("지원 예정", num(tt.picked), "명") + stat("순위 기준", state.std.sorts.length, "개")
			: stat("인원 배정 기준", modeNames[state.std.mode], "") + stat("공고 모집인원", num(announced), "명") +
				stat("부문 합계", num(tt.partSum), "명" + (tt.over === 0 ? " · 일치" : (tt.over > 0 ? " · 초과 " + num(tt.over) : " · 부족 " + num(-tt.over))),
					tt.over > 0 ? "is-danger" : (tt.over < 0 ? "is-warn" : "")) +
				stat("신청 부족 잔여", num(tt.left), "명", tt.left ? "is-warn" : "") + stat("확인 필요 부문", num(issueParts), "개", issueParts ? "is-danger" : "");

		renderSorts();
		renderStdSaveState();
	}

	function renderStdDetail() {
		var parts = state.std.parts;
		var p = state.std.sel;
		var part = parts[p];
		var s = partSummary(part);
		var rows = part.types.map(function (type, t) {
			var people = typePeople(part, type);
			var tp = typePicked(part, type);
			var short = Math.max(0, people - tp * type.per);
			return '<tr><th scope="row">' + type.type + (type.per === 2 ? ' <span class="std-muted">(1건 2명)</span>' : "") + "</th>" +
				'<td class="text-right">' + num(type.apply) + '</td><td class="text-center">' + (state.std.mode === "UNLIMITED" ? '<span class="std-muted">제한없음</span>' : basisToggle(p, t, type.basis)) +
				'</td><td class="text-center">' + (state.std.mode === "UNLIMITED" ? '-' : valueInput("t", p, t, type)) + '</td><td class="text-right"><b>' + num(people) +
				'</b></td><td class="text-right">' + num(tp) + '</td><td class="text-center">' +
				(state.std.mode === "UNLIMITED" ? '<span class="std-status is-ok">전체 지원</span>' : (short ? '<span class="std-status is-short">신청 부족 ' + num(short) + "명</span>" : '<span class="std-status is-quiet">신청 충분</span>')) + "</td></tr>";
		}).join("");
		var partControls = state.std.mode === "UNLIMITED"
			? '<span class="std-status is-unlimited">제한없음</span><span class="std-muted">현재 신청 ' + num(s.apply) + '건을 모두 지원 예정으로 봅니다.</span>'
			: basisToggle(p, -1, part.basis) + valueInput("p", p, -1, part) + '<span class="std-muted">' +
				(part.basis === "RATE" ? "모집인원 " + num(announcedPeople()) + "명의 " + part.value + "%" : "직접 입력") +
				'</span><span class="std-detail-eq">= <b>' + num(s.people) + "</b>명</span>";
		$("[data-std-detail]").innerHTML =
			'<div class="std-detail-head"><h3 class="board-section-title">' + part.name + ' <span class="std-muted">유형 ' + part.types.length + "개</span></h3>" +
			'<div class="flex gap-1">' + btn("◀ 이전 부문", 'data-action="std-select" data-p="' + (p - 1) + '"' + (p === 0 ? " disabled" : "")) +
			btn("다음 부문 ▶", 'data-action="std-select" data-p="' + (p + 1) + '"' + (p === parts.length - 1 ? " disabled" : "")) + "</div></div>" +
			'<div class="std-detail-part"><span class="std-unit-label">부문 인원</span>' + partControls + '</div>' +
			'<table class="board-table std-type-table"><caption>' + part.name + " 전형유형</caption>" +
			'<colgroup><col width="18%" /><col width="11%" /><col width="20%" /><col width="17%" /><col width="11%" /><col width="9%" /><col width="14%" /></colgroup>' +
			'<thead><tr><th scope="col">전형유형</th><th scope="col">신청(건)</th><th scope="col">입력 기준</th><th scope="col">입력값</th>' +
			'<th scope="col">인원(명)</th><th scope="col">선발(건)</th><th scope="col">신청 대비</th></tr></thead>' +
			"<tbody>" + rows + "</tbody>" +
			'<tfoot><tr><th scope="row">유형 합</th><td class="text-right">' + num(s.apply) + '</td><td colspan="2" class="text-right std-muted">' + (state.std.mode === "UNLIMITED" ? "전체 신청 지원" : "부문 인원 " + num(s.people) + "명과 비교") +
			'</td><td class="text-right"><b>' + num(s.typeSum) + '</b></td><td class="text-right"><b>' + num(s.picked) +
			'</b></td><td class="text-center">' + (state.std.mode === "UNLIMITED" ? '<span class="std-status is-ok">전체 지원</span>' : statusPill(s.diff) + (s.left ? '<br><span class="std-left">남는 ' + num(s.left) + "명</span>" : "")) +
			"</td></tr></tfoot></table>";
	}

	/* 정렬 기준은 1~5순위 칸을 한 줄로 늘어놓는다. 빈 칸 하나는 「추가」 자리로 쓴다. */
	function renderSorts() {
		var sorts = state.std.sorts;
		var locked = state.std.locked;
		var policy = stdPolicy();
		var slots = sorts.map(function (sort, index) {
			var keys = policy.keys.map(function (k) {
				return '<option value="' + k + '"' + (k === sort.key ? " selected" : "") + ">" + SORT_KEYS[k].label + "</option>";
			}).join("");
			var dirs = SORT_KEYS[sort.key].dirs.map(function (dir) {
				return '<option value="' + dir + '"' + (dir === sort.dir ? " selected" : "") + '>' + DIRECTION_LABELS[dir] + '</option>';
			}).join("");
			var order = sort.dir === "ORDERED" ? '<input type="text" class="form-control w-full" data-sort-field="order" value="' + (sort.order || "") + '" aria-label="사용자 지정 순서"' + (locked ? " disabled" : "") + ' />' : "";
			return '<li class="std-sort-slot" data-sort-row="' + index + '">' +
				'<div class="std-sort-head"><b>' + (index + 1) + '순위</b><span class="flex gap-1">' +
				btn("◀", 'data-action="sort-move" data-step="-1" aria-label="앞으로"' + (index === 0 || locked ? " disabled" : "")) +
				btn("▶", 'data-action="sort-move" data-step="1" aria-label="뒤로"' + (index === sorts.length - 1 || locked ? " disabled" : "")) +
				btn("✕", 'data-action="sort-remove" aria-label="삭제"' + (sorts.length === 1 || locked ? " disabled" : "")) + "</span></div>" +
				'<select class="form-control w-full" data-sort-field="key" aria-label="' + (index + 1) + '순위 정렬 항목"' + (locked ? " disabled" : "") + '>' + keys + "</select>" +
				'<select class="form-control w-full" data-sort-field="dir" aria-label="' + (index + 1) + '순위 정렬 방식"' + (locked ? " disabled" : "") + '>' + dirs + "</select>" + order + '</li>';
		});
		var canAdd = policy.keys.some(function (key) {
			return sorts.every(function (sort) { return sort.key !== key; });
		});
		for (var i = sorts.length; i < SORT_LIMIT; i += 1) {
			slots.push(i === sorts.length && !locked && canAdd
				? '<li class="std-sort-slot is-empty"><button type="button" class="std-sort-add" data-action="sort-add">+ ' + (i + 1) + "순위 추가</button></li>"
				: '<li class="std-sort-slot is-empty"><span>' + (i + 1) + "순위</span></li>");
		}
		$("[data-sort-body]").innerHTML = slots.join("");
		$("[data-sort-foot]").innerHTML = (sortDuplicated() ? badge("같은 항목이 두 번 들어 있습니다", "red") + " " : "") +
			"사업별 허용 항목만 표시 · 끝까지 같으면 접수일시가 빠른 사람이 앞";
	}

	function renderStdSaveState() {
		var std = state.std;
		var modeNames = { FIXED: "직접 배정", AUTO: "신청현황 기준 배정", UNLIMITED: "인원 제한 없음" };
		$("[data-std-save-title]").textContent = std.locked ? "잠긴 기준입니다." : (std.saved ? "저장된 기준입니다." : "작성 중인 기준입니다.");
		$("[data-std-save-desc]").textContent = std.locked
			? "1차심사가 시작되어 인원 배정과 선발순위를 수정할 수 없습니다."
			: (std.saved ? "최근 저장 " + std.savedAt + " · pass004" : "저장하면 처리자와 처리일시가 변경 이력에 남습니다.");
		$("[data-std-save-button]").disabled = std.locked;
		$('[data-action="copy-previous"]').disabled = std.locked;
		$("[data-std-history]").innerHTML = std.history.map(function (row, index) {
			var sorts = index === 0 && (std.saved || std.locked)
				? std.sorts.map(function (sort, i) { return (i + 1) + "순위 " + SORT_KEYS[sort.key].label; }).join(" · ")
				: row[3];
			return '<tr><td class="text-center">' + row[0] + '</td><td class="text-center">' + row[1] + '</td><td class="text-center">' +
				(modeNames[row[2]] || row[2]) + '</td><td>' + sorts + '</td><td class="text-center">' + badge(row[4], row[4] === "잠금" ? "blue" : "green") +
				'</td><td class="text-center">' + btn("보기") + '</td></tr>';
		}).join("");
	}

	/* ===== 2. 1차심사 ===== */
	var REVIEW_ROWS = {
		"0003": [
			{ no: "00000124", rank: 1, part: "서울", type: "본인", driver: "김○수", driverBirth: "1974-03-12", target: "김○수", targetBirth: "1974-03-12", relation: "본인", phone: "010-24**-7812", address: "서울특별시 송파구", vehicle: "서울82바12**", license: "정상", fuel: "정상", docs: "해당없음", benefit: 0, hospital: "국민체력센터", status: "01", memo: "" },
			{ no: "00000131", rank: 2, part: "서울", type: "배우자", driver: "이○호", driverBirth: "1970-10-28", target: "박○희", targetBirth: "1976-06-02", relation: "배우자", phone: "010-38**-1029", address: "서울특별시 강서구", vehicle: "서울80사43**", license: "정상", fuel: "정상", docs: "1/1", benefit: 0, hospital: "서울메디검진센터", status: "01", memo: "가족관계증명서 대상자 확인 필요" },
			{ no: "00000148", rank: 3, part: "서울", type: "본인", driver: "최○진", driverBirth: "1968-08-17", target: "최○진", targetBirth: "1968-08-17", relation: "본인", phone: "010-77**-2041", address: "서울특별시 도봉구", vehicle: "서울83아71**", license: "정상", fuel: "정상", docs: "해당없음", benefit: 0, hospital: "한신메디피아", status: "03", memo: "신청정보와 검증정보 일치" },
			{ no: "00000156", rank: 4, part: "서울", type: "배우자", driver: "정○철", driverBirth: "1972-01-09", target: "정○철", targetBirth: "1972-01-09", relation: "배우자", phone: "010-51**-6620", address: "서울특별시 중랑구", vehicle: "서울81자09**", license: "정상", fuel: "정상", docs: "1/1", benefit: 0, hospital: "한국건강관리협회 서울동부", status: "02", memo: "배우자 신청이나 대상자가 운전자와 동일하여 확인 중" },
			{ no: "00000172", rank: 5, part: "서울", type: "본인", driver: "윤○태", driverBirth: "1975-11-21", target: "윤○태", targetBirth: "1975-11-21", relation: "본인", phone: "010-62**-9017", address: "서울특별시 영등포구", vehicle: "서울84바35**", license: "정상", fuel: "정상", docs: "해당없음", benefit: 0, hospital: "여의도성모병원", status: "99", memo: "2024년 출생연도 기준 불일치" },
			{ no: "00000407", rank: 1, part: "경기", type: "본인", driver: "한○석", driverBirth: "1966-04-30", target: "한○석", targetBirth: "1966-04-30", relation: "본인", phone: "010-19**-3408", address: "경기도 수원시", vehicle: "경기90바18**", license: "정상", fuel: "정상", docs: "해당없음", benefit: 1, hospital: "KMI 수원센터", status: "01", memo: "2022년 건강검진 수혜 이력 1회" },
			{ no: "00000423", rank: 2, part: "경기", type: "배우자", driver: "문○식", driverBirth: "1978-12-11", target: "서○경", targetBirth: "1980-02-24", relation: "배우자", phone: "010-83**-5516", address: "경기도 성남시", vehicle: "경기91사62**", license: "정상", fuel: "정상", docs: "1/1", benefit: 0, hospital: "분당제생병원", status: "03", memo: "가족관계 및 대상연도 확인 완료" },
			{ no: "00000791", rank: 1, part: "인천", type: "본인", driver: "강○민", driverBirth: "1972-07-08", target: "강○민", targetBirth: "1972-07-08", relation: "본인", phone: "010-44**-7823", address: "인천광역시 남동구", vehicle: "인천80바55**", license: "정상", fuel: "확인필요", docs: "해당없음", benefit: 0, hospital: "미선택", status: "01", memo: "유가 검증 결과와 검진병원 선택 여부 확인" },
			{ no: "00000183", rank: 6, part: "서울", type: "본인", driver: "오○환", driverBirth: "1964-05-18", target: "오○환", targetBirth: "1964-05-18", relation: "본인", phone: "010-35**-4481", address: "서울특별시 관악구", vehicle: "서울86아41**", license: "정상", fuel: "정상", docs: "해당없음", benefit: 0, hospital: "한국의학연구소 강남", status: "01", memo: "", visible: false }
		]
	};

	function makeGenericReviewRows() {
		var units = quotaRows();
		return [0, 1, 2, 3, 4, 5, 6, 7].map(function (index) {
			var unit = units[index % units.length];
			return { no: String(4100 + index * 37).padStart(8, "0"), rank: index + 1, part: unit.part, type: unit.type,
				driver: ["김○수", "이○호", "박○진", "최○철", "정○태", "강○석", "윤○민", "한○식"][index], driverBirth: "197" + (index % 9) + "-0" + ((index % 8) + 1) + "-12",
				target: ["김○수", "이○희", "박○진", "최○철", "정○태", "강○석", "윤○민", "한○경"][index], targetBirth: "200" + (index % 9) + "-04-18",
				relation: index % 3 === 1 ? "배우자" : "본인", phone: "010-****-" + String(1200 + index * 17), address: "등록 주소", vehicle: "서울8" + index + "바****",
				license: index === 6 ? "확인필요" : "정상", fuel: index === 5 ? "확인필요" : "정상", docs: index === 3 ? "확인필요" : "완료", benefit: index === 4 ? 1 : 0,
				hospital: "-", status: ["01", "03", "01", "02", "99", "01", "03", "01"][index], memo: index === 3 ? "보완서류 확인 대기" : "" };
		});
	}

	function reviewRows() {
		if (!REVIEW_ROWS[state.biz]) REVIEW_ROWS[state.biz] = makeGenericReviewRows();
		return REVIEW_ROWS[state.biz];
	}

	function reviewStatus(code) {
		return { "01": ["심사대기", ""], "02": ["보류", "orange"], "03": ["심사완료", "green"], "99": ["탈락", "red"] }[code] || [code, ""];
	}

	function reviewCheck(value) {
		if (value === "정상" || value === "완료" || value === "해당없음" || /^\d+\/\d+$/.test(value)) return '<span class="review-check is-ok">' + value + "</span>";
		return '<span class="review-check is-warn">' + value + "</span>";
	}

	function setReviewOptions(selector, values, allLabel) {
		var select = $(selector);
		select.innerHTML = '<option value="">' + allLabel + "</option>" + values.filter(function (value, index, self) { return self.indexOf(value) === index; })
			.map(function (value) { return '<option value="' + value + '">' + value + "</option>"; }).join("");
	}

	function filteredReviewRows() {
		var part = $("[data-review-part]").value, type = $("[data-review-type]").value;
		var status = $("[data-review-status]").value, driver = $("[data-review-driver]").value.trim(), target = $("[data-review-target]").value.trim();
		var number = $("[data-review-number]").value.trim();
		return reviewRows().filter(function (row) {
			return row.visible !== false && (!part || row.part === part) && (!type || row.type === type) && (!status || row.status === status) &&
				(!driver || row.driver.indexOf(driver) >= 0) && (!target || row.target.indexOf(target) >= 0) && (!number || row.no.indexOf(number) >= 0);
		});
	}

	function renderReviewRegion() {
		var panel = $("[data-review-region-panel]");
		panel.hidden = state.biz !== "0003";
		if (panel.hidden) return;
		$("[data-review-region-grid]").innerHTML = biz().parts.map(function (part, index) {
			var quota = part[1] + part[2], applied = part[3] + part[4], completed = Math.round(applied * (0.78 + (index % 4) * 0.04));
			return '<button type="button" class="review-region-item" data-action="review-region" data-region="' + part[0] + '"><span>' + part[0] + '</span><b>' + num(completed) + ' / ' + num(applied) + '</b><small>정원 ' + num(quota) + "명</small></button>";
		}).join("");
	}

	function renderReview() {
		var b = biz(), rows = reviewRows();
		$("[data-review-biz-name]").value = b.name;
		$("[data-review-notice-title]").value = b.notice;
		var previous = {
			part: $("[data-review-part]").value, type: $("[data-review-type]").value,
			status: $("[data-review-status]").value, driver: $("[data-review-driver]").value, target: $("[data-review-target]").value,
			number: $("[data-review-number]").value
		};
		setReviewOptions("[data-review-part]", b.parts.map(function (part) { return part[0]; }), "전체 부문");
		setReviewOptions("[data-review-type]", b.types.map(function (type) { return type[0]; }), "전체 유형");
		Object.keys(previous).forEach(function (key) {
			var field = $("[data-review-" + key + "]");
			if (field && Array.prototype.some.call(field.options || [], function (option) { return option.value === previous[key]; })) field.value = previous[key];
			else if (field && !(field.options)) field.value = previous[key];
		});
		var total = b.code === "0003" ? 3399 : quotaRows().reduce(function (sum, row) { return sum + row.apply; }, 0);
		var done = b.code === "0003" ? 2814 : Math.round(total * 0.72), hold = b.code === "0003" ? 48 : Math.round(total * 0.02), rejected = b.code === "0003" ? 125 : Math.round(total * 0.04);
		$("[data-review-stats]").innerHTML = stat("1차심사 대상", num(total), "명") + stat("심사완료", num(done), "명") + stat("심사대기", num(Math.max(0, total - done - hold - rejected)), "명") + stat("보류", num(hold), "명", "is-warn") + stat("탈락", num(rejected), "명", "is-danger");
		var reviewSorts = state.std && state.std.code === b.code ? state.std.sorts : defaultSorts(b);
		$("[data-review-standard-summary]").innerHTML = '<span class="material-symbols-rounded" aria-hidden="true">rule</span><strong>적용 선발기준</strong><span>부문·유형별 배정 인원 적용</span><i></i>' + reviewSorts.map(function (sort, index) { return '<b>' + (index + 1) + '순위 ' + SORT_KEYS[sort.key].label + '</b>'; }).join('<span class="material-symbols-rounded review-standard-arrow" aria-hidden="true">chevron_right</span>');
		renderReviewRegion();
		$("[data-review-list-copy]").textContent = b.code === "0003" ? "선발기준 순서대로 표시합니다. 보류·탈락자는 목록 위치를 유지하고 순위 계산에서 제외합니다." : "선발기준설정에서 저장한 순서대로 심사대상을 표시합니다.";
		var filtered = filteredReviewRows();
		$("[data-review-body]").innerHTML = filtered.map(function (row) {
			var sourceIndex = rows.indexOf(row), status = reviewStatus(row.status), excluded = row.status === "02" || row.status === "99";
			var memo = row.memo ? '<button type="button" class="review-memo-button" data-action="review-memo" data-review-index="' + sourceIndex + '" aria-label="메모 보기"><span class="material-symbols-rounded" aria-hidden="true">sticky_note_2</span><span class="review-memo-tooltip">' + row.memo + "</span></button>" : "-";
			return '<tr class="' + (excluded ? "review-row-excluded" : (row.autoFilled ? "review-row-auto" : "review-row-ranked")) + '"><td class="text-center"><label class="check-label"><input type="checkbox" data-review-row-check data-review-index="' + sourceIndex + '" /><span class="check-label-text"></span></label></td>' +
				'<td class="text-center"><b>' + (excluded ? "-" : row.rank) + '</b>' + (row.autoFilled ? '<span class="review-auto-badge">자동충원</span>' : '') + '</td><td class="text-center">' + row.no + '</td><td class="text-center">' + row.part + '</td><td class="text-center">' + row.type + '</td>' +
				'<td class="text-center">' + row.driver + '</td><td class="text-center">' + row.target + '</td><td class="text-center">' + row.targetBirth + '</td><td class="text-center">' + reviewCheck(row.license) + '</td><td class="text-center">' + reviewCheck(row.fuel) + '</td><td class="text-center">' + reviewCheck(row.docs) + '</td>' +
				'<td class="text-center">' + (row.benefit ? '<b class="text-red">' + row.benefit + "회</b>" : "-") + '</td><td class="text-center">' + badge(status[0], status[1]) + '</td><td class="text-center">' + memo + '</td><td class="text-center"><div class="review-row-actions">' +
				btn("상세", 'data-action="review-detail" data-review-index="' + sourceIndex + '"') + btn("심사", 'data-action="review-eval" data-review-index="' + sourceIndex + '"', "variant-solid color-navy") + "</div></td></tr>";
		}).join("") || '<tr><td colspan="15" class="text-center review-empty">조회된 심사대상이 없습니다.</td></tr>';
		$("[data-review-count]").textContent = "총 " + num(filtered.length) + "건 (화면 표본)";
		$("[data-review-preview]").hidden = true;
	}

	function openReviewDetail(index) {
		var row = reviewRows()[index];
		state.reviewIndex = index;
		$("[data-review-popup-subtitle]").textContent = biz().notice + " · 접수번호 " + row.no;
		var status = reviewStatus(row.status);
		$("[data-review-detail-summary]").innerHTML = '<div><span>선발순위</span><b>' + (row.status === "02" || row.status === "99" ? "순위 제외" : row.part + " · " + row.type + " " + row.rank + "위") + '</b></div><div><span>접수구분</span><b>' + badge(status[0], status[1]) + '</b></div><div><span>신청일</span><b>2024-02-' + String(10 + index).padStart(2, "0") + '</b></div><div><span>선택병원</span><b>' + row.hospital + "</b></div>";
		$("[data-review-driver-detail]").innerHTML = '<tr><th scope="row">성명</th><td>' + row.driver + '</td><th scope="row">생년월일</th><td>' + row.driverBirth + '</td><th scope="row">휴대전화</th><td>' + row.phone + '</td></tr>' +
			'<tr><th scope="row">자택주소</th><td colspan="3">' + row.address + '</td><th scope="row">차량번호</th><td>' + row.vehicle + "</td></tr>";
		$("[data-review-target-detail]").innerHTML = '<tr><th scope="row">신청구분</th><td>' + row.type + '</td><th scope="row">대상자 성명</th><td>' + row.target + '</td><th scope="row">생년월일</th><td>' + row.targetBirth + '</td></tr>' +
			'<tr><th scope="row">운전자와 관계</th><td>' + row.relation + '</td><th scope="row">선발부문</th><td>' + row.part + '</td><th scope="row">과거 수혜</th><td>' + (row.benefit ? row.benefit + "회" : "없음") + "</td></tr>";
		var targetMatch = row.type === "본인" ? row.driver === row.target : row.driver !== row.target;
		var evenYear = Number(row.targetBirth.slice(0, 4)) % 2 === 0;
		var checks = [["운송종사자격", row.license, row.license === "정상"], ["유가보조금", row.fuel, row.fuel === "정상"], ["신청구분·대상자", targetMatch ? "일치" : "불일치", targetMatch], ["2024 검진 대상연도", evenYear ? "해당" : "비해당", evenYear], ["검진병원", row.hospital, row.hospital !== "미선택"], ["중복 식별값", "중복 없음", true]];
		$("[data-review-check-grid]").innerHTML = checks.map(function (check) { return '<div class="review-check-card ' + (check[2] ? "is-ok" : "is-warn") + '"><span class="material-symbols-rounded" aria-hidden="true">' + (check[2] ? "check_circle" : "error") + '</span><div><small>' + check[0] + "</small><b>" + check[1] + "</b></div></div>"; }).join("");
		var documents = row.type === "배우자" ? [["가족관계증명서", "family_relation_" + row.no + ".pdf", row.docs === "1/1"]] : [["공고상 별도 제출서류 없음", "온라인 검증값으로 심사", true]];
		$("[data-review-document-list]").innerHTML = documents.map(function (doc) { return '<div class="review-document-item"><span class="material-symbols-rounded" aria-hidden="true">description</span><div><b>' + doc[0] + "</b><small>" + doc[1] + '</small></div><span class="review-check ' + (doc[2] ? "is-ok" : "is-warn") + '">' + (doc[2] ? "제출완료" : "확인필요") + '</span>' + (doc[0].indexOf("없음") < 0 ? '<div class="review-document-actions">' + btn('<span class="material-symbols-rounded" aria-hidden="true">visibility</span> 미리보기', 'data-action="review-document-preview"') + btn('<span class="material-symbols-rounded" aria-hidden="true">download</span> 다운로드', 'data-action="review-document-download"') + "</div>" : "") + "</div>"; }).join("");
		openPopup("popup-review-detail");
	}

	function openReviewEval(index) {
		var row = reviewRows()[index]; state.reviewIndex = index;
		$("[data-review-eval-target]").textContent = row.no + " · " + row.driver + " / " + row.target + " (" + row.part + " · " + row.type + ")";
		$("[data-review-eval-memo]").value = row.memo || "";
		$("[data-review-reason]").value = "";
		var result = $('input[name="reviewResult"][value="' + row.status + '"]');
		if (result) result.checked = true; else $('input[name="reviewResult"][value="03"]').checked = true;
		openPopup("popup-review-eval");
	}

	function openReviewMemo(index) {
		var row = reviewRows()[index]; state.reviewIndex = index;
		$("[data-review-memo-target]").textContent = "접수번호 " + row.no + " · " + row.driver + " / " + row.target;
		$("[data-review-memo-text]").value = row.memo || "";
		$("[data-review-memo-history]").innerHTML = row.memo ? '<li><b>2024-02-19 14:22 · checkup01</b><span>' + row.memo + "</span></li>" : '<li class="is-empty">등록된 메모가 없습니다.</li>';
		openPopup("popup-review-memo");
	}

	function selectedReviewIndexes() {
		return $$('[data-review-row-check]:checked').map(function (box) { return Number(box.dataset.reviewIndex); });
	}

	function autoFillReviewVacancy(rejected) {
		var rows = reviewRows();
		var candidate = rows.find(function (row) { return row.visible === false && row.part === rejected.part && row.type === rejected.type; });
		if (!candidate) {
			var maxRank = rows.filter(function (row) { return row.part === rejected.part && row.type === rejected.type; }).reduce(function (max, row) { return Math.max(max, Number(row.rank || 0)); }, 0);
			candidate = { no: String(90000000 + rows.length + 1), rank: maxRank + 1, part: rejected.part, type: rejected.type, driver: "차○순", driverBirth: "1970-06-18", target: "차○순", targetBirth: "1970-06-18", relation: rejected.type === "배우자" ? "배우자" : "본인", phone: "010-****-9051", address: rejected.part + " 등록 주소", vehicle: "지역80바****", license: "정상", fuel: "정상", docs: rejected.type === "배우자" ? "1/1" : "해당없음", benefit: 0, hospital: "미선택", status: "01", memo: "" };
			rows.push(candidate);
		}
		candidate.visible = true;
		candidate.autoFilled = true;
		candidate.memo = "[자동충원] " + rejected.no + " 탈락으로 차순위 심사대상 편입";
		showAppToast(rejected.part + " · " + rejected.type + " 결원 1명을 자동 충원했습니다. " + rejected.no + " 탈락 → " + candidate.no + " 차순위 편입");
	}

	function openReviewWindow(index) {
		var row = reviewRows()[index];
		var url = new URL("review-detail.html", location.href);
		url.searchParams.set("bizId", state.biz);
		url.searchParams.set("yearDeg", biz().yearDeg);
		url.searchParams.set("acceptNo", row.no);
		var detailWindow = window.open(url.href, "tdwfReviewDetail_" + row.no, "width=1280,height=920,scrollbars=yes,resizable=yes");
		if (detailWindow) detailWindow.focus();
		else alert("접수내역 상세창을 열 수 없습니다. 브라우저의 팝업 차단 설정을 확인해 주세요.");
	}

	function previewReviewBatch(type) {
		var indexes = selectedReviewIndexes();
		if (!indexes.length) { alert("처리할 접수 건을 선택해 주세요."); return; }
		state.reviewBatch = { type: type, indexes: indexes };
		var preview = $("[data-review-preview]");
		var label = type === "03" ? "심사완료" : "보류(후순위 이동)";
		preview.hidden = false;
		preview.innerHTML = '<div><b>' + num(indexes.length) + '건을 ' + label + ' 처리합니다.</b><span>확정 전 대상과 처리 결과를 확인해 주세요. 확정 내용은 처리 이력에 남습니다.</span></div><div class="flex gap-1">' +
			btn("처리 확정", 'data-action="review-batch-confirm"', "variant-solid color-navy") + btn("취소", 'data-action="review-batch-cancel"') + "</div>";
	}

	function openDup(pair) {
		var a = pair[1].split(" "), bb = pair[2].split(" ");
		$("[data-dup-reason]").innerHTML = "<b>" + pair[0] + "</b> · 겹친 대상자 " + pair[3] + " — 노란 칸이 두 접수에서 같은 값입니다.";
		function side(title, no, name, spouse, mine, birth) {
			return '<section class="panel"><h3 class="board-section-title">' + title + badge(no, "blue") + "</h3>" +
				'<table class="board-form-table"><caption>' + title + '</caption><colgroup><col width="30%" /><col width="70%" /></colgroup><tbody>' +
				'<tr><th scope="row">운전자</th><td>' + name + " (" + birth + ")</td></tr>" +
				'<tr><th scope="row">배우자</th><td class="' + (mine ? "cell-match" : "") + '">' + spouse + "</td></tr>" +
				'<tr><th scope="row">자녀(지원자)</th><td class="cell-match">' + pair[3].replace(/ \(.*/, "") + " (2009.05.02, 고등학교 2학년)</td></tr>" +
				'<tr><th scope="row">가족관계 등록</th><td>' + (mine ? "배우자로 상대 접수자 등록" : "자녀만 등록") + "</td></tr>" +
				'<tr><th scope="row">접수일시</th><td>' + (mine ? "2026-03-04 09:12" : "2026-03-06 21:40") + "</td></tr>" +
				'<tr><th scope="row">평가순위</th><td>' + (mine ? "212위 (예비선발)" : "305위 (예비선발)") + "</td></tr>" +
				"</tbody></table></section>";
		}
		$("[data-dup-compare]").innerHTML = side("접수 A", a[0], a[1], bb[1], true, "1971.03.14") + side("접수 B", bb[0], bb[1], a[1], false, "1973.08.22");
		openPopup("popup-dup");
	}

	/* ===== 3. 1차선발 ===== */
	function renderSelection() {
		var rows = quotaRows();
		var totals = { quota: 0, reserve: 0, pass: 0, fix: 0, fail: 0, vacancy: 0 };
		var vacancies = rows.map(function (row, index) {
			var quota = row.quota;
			var pass = Math.round(quota * 0.86);
			var fix = Math.round(quota * 0.03);
			var reserve = Math.round(quota * 0.08);
			var fail = Math.round(quota * 0.04) + (index % 3);
			if (state.extra === "confirmed") reserve += Math.max(0, quota - pass - fix - reserve);
			var vacancy = Math.max(0, quota - pass - fix - reserve);
			totals.quota += quota; totals.reserve += reserve; totals.pass += pass; totals.fix += fix; totals.fail += fail; totals.vacancy += vacancy;
			return { row: row, quota: quota, pass: pass, fix: fix, reserve: reserve, fail: fail, vacancy: vacancy, wait: Math.max(0, row.apply * row.per - quota) };
		});
		$("[data-sel-stats]").innerHTML = stat("정원", num(totals.quota), "명") + stat("예비선발", num(totals.reserve), "명") +
			stat("서류 합격", num(totals.pass), "명") + stat("보완", num(totals.fix), "명") + stat("탈락", num(totals.fail), "명", "is-danger") +
			stat("결원", num(totals.vacancy), "명", totals.vacancy ? "is-warn" : "");
		$("[data-vacancy-body]").innerHTML = vacancies.map(function (v) {
			var add = state.extra === "preview" && v.vacancy ? '<b class="text-blue">+' + num(Math.floor(v.vacancy / v.row.per) * v.row.per) + "</b>" : "-";
			return '<tr><td class="text-center">' + v.row.part + '</td><td class="text-center">' + v.row.type + '</td><td class="text-right">' + num(v.quota) +
				'</td><td class="text-right">' + num(v.reserve) + '</td><td class="text-right">' + num(v.pass) + '</td><td class="text-right">' + num(v.fix) +
				'</td><td class="text-right">' + num(v.fail) + '</td><td class="text-right">' + (v.vacancy ? '<b class="text-red">' + num(v.vacancy) + "</b>" : 0) +
				'</td><td class="text-right">' + num(v.wait) + '</td><td class="text-center">' + add + "</td></tr>";
		}).join("");

		var banner = $("[data-extra-banner]");
		banner.hidden = state.extra === "none";
		banner.classList.toggle("is-confirmed", state.extra === "confirmed");
		banner.innerHTML = state.extra === "preview"
			? "<span>3차 추가선발 미리보기 — 결원만큼 대기자에서 뽑았습니다. 아직 저장되지 않았습니다.</span>"
			: "<span>3차 추가선발이 확정되었습니다. 추가된 인원은 1차심사(서류심사) 대상으로 넘어갑니다.</span>";
		$('[data-action="extra-confirm"]').hidden = state.extra !== "preview";
		$('[data-action="extra-preview"]').hidden = state.extra === "confirmed";

		var first = rows[0];
		var rounds = [
			["1차", "2026-04-02 14:20", "1차심사 완료자 최초 선발", num(totals.quota) + "명", biz().mode === "RANK" ? "-" : "48213", "pass004", "확정"],
			["2차", "2026-05-11 10:05", first.part + "·" + first.type + (rows.length > 1 ? " 외 " + (rows.length - 1) + "개" : ""), num(Math.max(2, Math.round(totals.quota * 0.013))) + "명", biz().mode === "RANK" ? "-" : "77105", "pass004", "확정"]
		];
		if (state.extra === "confirmed") rounds.push(["3차", "2026-10-20 10:31", "결원 발생 부문·전형 전체", num(totals.vacancy || 37) + "명", "90321", "pass004", "확정"]);
		$("[data-round-body]").innerHTML = rounds.map(function (round, index) {
			var last = index === rounds.length - 1;
			return '<tr><td class="text-center">' + round[0] + '</td><td class="text-center">' + round[1] + "</td><td>" + round[2] + '</td><td class="text-right">' +
				round[3] + '</td><td class="text-center">' + round[4] + '</td><td class="text-center">' + round[5] + '</td><td class="text-center">' +
				badge(round[6], "green") + (last && index > 0 ? " " + btn("되돌리기") : "") + "</td></tr>";
		}).join("");
	}

	/* ===== 4. 후속심사 ===== */
	function renderFollowup() {
		var b = biz();
		$$("[data-followup-variant]").forEach(function (block) { block.hidden = block.dataset.followupVariant !== b.followup; });
		$("[data-followup-none-biz]").textContent = b.name;
		if (b.followup === "checkup") renderCheckup();
		if (b.followup === "vaccine") renderVaccine();
		if (b.followup === "generic") {
			$("[data-followup-generic-label]").textContent = b.followupLabel;
			$("[data-followup-generic-title]").textContent = b.followupLabel + " 목록";
			$("[data-generic-body]").innerHTML = [0, 1, 2, 3].map(function (i) {
				return '<tr><td class="text-center">' + String(210 + i).padStart(8, "0") + '</td><td class="text-center">' + ["김", "이", "박", "최"][i] +
					'○○</td><td class="text-center">' + (b.followupLabel.indexOf("장착") >= 0 ? "장착확인서·영수증" : "진단서·소견서") +
					'</td><td class="text-center">2026-09-' + (10 + i) + '</td><td class="text-center">' + ["적합", "-", "보완", "-"][i] +
					'</td><td class="text-center">' + btn("심사") + "</td></tr>";
			}).join("");
		}
	}

	function renderCheckup() {
		var noshowDone = state.noshow === "confirmed";
		$("[data-checkup-stats]").innerHTML = stat("미처리", num(noshowDone ? 1662 : 2071), "명") + stat("예약완료", num(157), "명") +
			stat("검진완료", num(459), "명") + stat("결과입력(청구)", num(573), "명") + stat("지급완료", num(3086), "명") +
			stat("자격취소(기간내미검진)", num(noshowDone ? 409 : 0), "명", noshowDone ? "is-danger" : "") + stat("검진포기", num(54), "명");
		var people = [
			["00000011", "운전자", "홍○○", "착한의사", "미처리", "", "", true],
			["00000011", "배우자", "김○○", "착한의사", "미처리", "", "", true],
			["00000054", "배우자", "최○○", "국민체력센터(서울 송파구)", "검진완료", "2026-05-02", "2026-05-09", false],
			["00005103", "운전자", "이○진", "한국건강관리협회 대전충남지부", "예약완료", "2026-06-20", "", true],
			["00000010", "운전자", "유○상", "가천대 길병원(인천 남동구)", "지급완료", "2026-04-11", "2026-04-18", false]
		];
		$("[data-checkup-body]").innerHTML = people.map(function (p) {
			return '<tr><td class="text-center">' + p[0] + '</td><td class="text-center">' + p[1] + '</td><td class="text-center">' + p[2] + "</td><td>" + p[3] +
				'</td><td class="text-center">' + p[4] + '</td><td class="text-center">' + (p[5] || "-") + '</td><td class="text-center">' + (p[6] || "-") +
				'</td><td class="text-center">' + (p[7] ? btn("병원변경", 'data-hospital-open="' + p.join("|") + '"') : '<span class="board-form-note" title="검진 후에는 바꿀 수 없습니다">변경불가</span>') +
				'</td><td class="text-center">' + btn("상세") + "</td></tr>";
		}).join("");
		$$("[data-hospital-open]").forEach(function (button) {
			button.addEventListener("click", function () {
				var p = button.dataset.hospitalOpen.split("|");
				$("[data-hospital-target]").textContent = p[0] + " · " + p[1] + " " + p[2];
				$("[data-hospital-current]").textContent = p[3];
				$("[data-hospital-status]").textContent = p[4];
				openPopup("popup-hospital");
			});
		});

		var noshow = $("[data-noshow-body]");
		noshow.innerHTML = [
			["부부 신청 · 둘 다 미검진", 106, "접수 자격취소(98) · 탈락", "2026.07.30 기간내 미검진"],
			["부부 신청 · 운전자만 미검진 (배우자 검진)", 23, "운전자 자격취소(98)", "2026.07.30 기간내 운전자 미검진"],
			["부부 신청 · 배우자만 미검진 (운전자 검진)", 46, "배우자 자격취소(98)", "2026.07.30 기간내 배우자 미검진"],
			["본인 신청 · 미검진", 128, "자격중지(98)", "2026.07.30 기간내 미검진"]
		].map(function (r) {
			return "<tr><td>" + r[0] + '</td><td class="text-right"><b>' + r[1] + '</b></td><td class="text-center">' + r[2] + "</td><td>" + r[3] + "</td></tr>";
		}).join("") + '<tr><td colspan="4" class="text-left" style="color:var(--muted);line-height:1.6">검진 대상자 단위로는 <b>409명</b>이 자격취소, 미검진·포기 <b>573명</b>의 병원이 기타병원(A014)으로 바뀝니다. ' +
			"부부 중 한 명만 검진한 경우 검진한 사람의 지급을 이어 갈지는 현업 확인이 필요합니다.</td></tr>";
		var banner = $("[data-noshow-banner]");
		banner.hidden = state.noshow === "none";
		banner.classList.toggle("is-confirmed", noshowDone);
		banner.innerHTML = state.noshow === "preview"
			? "<span>미리보기입니다. 확정하면 위 303건(409명)이 처리되고 결원이 생깁니다.</span>"
			: '<span>미검진 처리를 확정했습니다. 결원 409명 → </span><a href="#selection" class="btn variant-solid color-navy rounded-md size-sm">1차선발에서 재선발</a>';
		$("[data-noshow-result]").hidden = state.noshow === "none";
		$('[data-action="noshow-confirm"]').hidden = state.noshow !== "preview";
		$('[data-action="noshow-preview"]').hidden = noshowDone;

		$("[data-claim-body]").innerHTML = [0, 1, 2].map(function (i) {
			return '<tr><td class="text-center">' + String(3300 + i).padStart(8, "0") + '</td><td class="text-center">' + ["박", "정", "강"][i] +
				'○○</td><td>' + ["한국건강관리협회 광주전남지부", "KMI한국의학연구소 수원센터", "광주기독병원(광주 남구)"][i] + '</td><td class="text-center">2026-0' + (5 + i) +
				'-1' + i + '</td><td class="text-right">500,000원</td><td class="text-center">' + btn("서류") + '</td><td class="text-center">' + btn("심사") + "</td></tr>";
		}).join("");
	}

	function renderVaccine() {
		$("[data-vaccine-stats]").innerHTML = stat("접종 회차", num(22713), "건") + stat("접종 전 (변경 가능)", num(15256), "건") +
			stat("접종완료", num(4120), "건") + stat("청구완료", num(1284), "건", "is-warn") + stat("지급완료", num(2053), "건");
		var rows = [
			["00000003", "남○○", "B형간염", 1, "한국건강관리협회 서울서부지부", "", "미처리", "미처리", true],
			["00000003", "남○○", "B형간염", 2, "한국건강관리협회 서울서부지부", "2026-02-06", "청구완료", "지급완료", false],
			["00000003", "남○○", "B형간염", 3, "한국건강관리협회 서울서부지부", "", "미처리", "미처리", true],
			["00000005", "윤○○", "파상풍", 1, "한국건강관리협회 부산서부지부", "2026-01-07", "청구완료", "지급완료", false],
			["00000005", "윤○○", "대상포진", 1, "한국건강관리협회 부산서부지부", "2026-01-07", "미처리", "미처리", false]
		];
		$("[data-vaccine-body]").innerHTML = rows.map(function (r) {
			var reason = r[5] ? "접종일이 있어 바꿀 수 없습니다" : "청구가 시작되어 바꿀 수 없습니다";
			return '<tr><td class="text-center">' + (r[8] ? '<label class="check-label"><input type="checkbox" /><span class="check-label-text"></span></label>'
				: '<span class="board-form-note" title="' + reason + '">불가</span>') + '</td><td class="text-center">' + r[0] + '</td><td class="text-center">' + r[1] +
				'</td><td class="text-center">' + r[2] + '</td><td class="text-center">' + r[3] + "차</td><td>" + r[4] + '</td><td class="text-center">' + (r[5] || "-") +
				'</td><td class="text-center">' + r[6] + '</td><td class="text-center">' + r[7] + "</td></tr>";
		}).join("");
	}

	/* ===== 5. 최종선발 ===== */
	function finalCounts() {
		var rows = quotaRows();
		var quota = rows.reduce(function (sum, row) { return sum + row.quota; }, 0);
		var apply = rows.reduce(function (sum, row) { return sum + row.apply * row.per; }, 0);
		var picked = Math.round(quota * 0.976);
		return { picked: picked, failed: Math.max(0, apply - picked) };
	}

	function renderFinal() {
		var counts = finalCounts();
		$("[data-final-n06]").textContent = " · " + num(counts.picked) + "명";
		$("[data-final-n04]").textContent = " · " + num(counts.picked) + "명";
		$("[data-final-n04-2]").textContent = num(counts.picked);
		$("[data-final-user-view]").innerHTML = "최종선발 <b>" + num(counts.picked) + "</b>명은 「선발」, 미선발 <b>" + num(counts.failed) + "</b>명은 「미선발」로 보입니다. " +
			'<span class="board-form-note">발표일시 전에는 「심사중」으로 보입니다.</span>';
		$('[data-action="publish"]').disabled = !state.approved;
		var steps = $$('[data-screen="final"] .board-status-steps li');
		steps[2].className = state.approved ? "status-done" : "status-available";
		steps[3].className = state.approved ? "status-current" : "status-disabled";
	}

	function renderPayment() {
		$$("[data-pay-stats]").forEach(function (box) {
			var picked = finalCounts().picked;
			var bad = Math.max(1, Math.round(picked * 0.008));
			box.innerHTML = stat("지급 대상", num(picked), "명") + stat("계좌검증 완료", num(picked - bad), "명") + stat("계좌 오류", num(bad), "명", "is-danger") +
				stat("지급처", biz().note ? "협약병원" : "본인 계좌", "");
		});
	}

	/* ===== 8. 문자 ===== */
	function byteLength(text) {
		var bytes = 0;
		for (var i = 0; i < text.length; i += 1) bytes += text.charCodeAt(i) > 127 ? 2 : 1;
		return bytes;
	}

	function splitBytes(text, limit) {
		var parts = [], current = "", size = 0;
		for (var i = 0; i < text.length; i += 1) {
			var ch = text.charAt(i), add = ch.charCodeAt(0) > 127 ? 2 : 1;
			if (size + add > limit) { parts.push(current); current = ""; size = 0; }
			current += ch; size += add;
		}
		if (current) parts.push(current);
		return parts;
	}

	function renderSmsText() {
		var text = $("[data-sms-text]").value;
		var parts = splitBytes(text, 90);
		$("[data-sms-bytes]").textContent = byteLength(text);
		$("[data-sms-parts]").textContent = parts.length + "건으로 나뉨";
		$("[data-sms-split]").innerHTML = parts.map(function (part, index) {
			return "<li><b>" + (index + 1) + "/" + parts.length + " · " + byteLength(part) + "byte</b>" + part.replace(/</g, "&lt;") + "</li>";
		}).join("");
	}

	function renderSmsStats() {
		var on = function (rule) { var box = $('[data-sms-rule="' + rule + '"]'); return box && box.checked; };
		var base = 1024;
		var couple = on("couple") ? 106 : 0, dup = on("dupnum") ? 41 : 0, bad = on("badnum") ? 17 : 0, block = on("block") ? 8 : 0, benefit = on("benefit") ? 0 : 0;
		var send = base - couple - dup - bad - block - benefit;
		var box = $("[data-sms-stats]");
		box.hidden = false;
		box.innerHTML = stat("추출", num(base), "명") + stat("부부 중 운전자만", "-" + couple, "명") + stat("같은 번호", "-" + dup, "명") +
			stat("비정상 번호", "-" + bad, "명") + stat("발송 제외자", "-" + block, "명") + stat("최종 발송", num(send), "명", "is-warn");
		$("[data-sms-days]").textContent = send > 15000 ? Math.ceil(send / 15000) + "일로 나눠 예약" : "하루에 모두 발송";
	}

	/* ===== 9. 이력 ===== */
	function renderHistory() {
		$("[data-history-biz]").innerHTML = '<option>전체</option>' + Object.keys(BIZ).map(function (code) {
			return "<option>" + BIZ[code].name + "</option>";
		}).join("");
		var rows = [
			["2026-10-20 10:31", "일반장학사업 2026001", "1차선발", "추가선발 3차 (결원 보충)", "37명", "pass004", "확정", true],
			["2026-07-02 17:40", "건강검진사업 2026001", "후속심사", "검진상태 일괄변경 → 지급완료", "1,204명", "pass004", "확정", false],
			["2026-05-11 10:05", "일반장학사업 2026001", "1차선발", "추가선발 2차", "52명", "pass004", "확정", false],
			["2026-04-03 16:44", "일반장학사업 2026001", "1차심사", "기수혜자 탈락처리", "131명", "pass004", "확정", false],
			["2026-04-02 14:20", "일반장학사업 2026001", "선발기준설정", "직접 배정·선발순위 저장", "기준 4개", "pass004", "저장", false],
			["2026-04-02 14:25", "일반장학사업 2026001", "선발기준설정", "1차심사 시작으로 기준 잠금", "기준 4개", "pass004", "잠금", false],
			["2026-03-28 11:02", "건강검진사업 2026001", "선발기준설정", "지역별 신청현황 기준 배정", "지역 17개", "pass004", "저장", false],
			["2026-03-27 17:30", "4대중증질환사업 2026001", "최종선발", "최종선발자 발표", "118명", "pass004", "발표완료", false]
		];
		$("[data-history-body]").innerHTML = rows.map(function (r) {
			var color = r[6] === "되돌림" ? "" : (r[6] === "발표완료" ? "blue" : "green");
			var undo = r[7] ? btn("되돌리기", "", "variant-outline color-navy")
				: '<span title="다음 단계가 진행되어 되돌릴 수 없습니다" style="color:#8a99a8">-</span>';
			return '<tr><td class="text-center">' + r[0] + "</td><td>" + r[1] + '</td><td class="text-center">' + r[2] + "</td><td>" + r[3] +
				'</td><td class="text-right">' + r[4] + '</td><td class="text-center">' + r[5] + '</td><td class="text-center">' + badge(r[6], color) +
				'</td><td class="text-center"><div class="flex justify-center gap-1">' + btn("상세") + undo + "</div></td></tr>";
		}).join("");
	}

	/* ===== 팝업 ===== */
	function openPopup(id) {
		var popup = document.getElementById(id);
		popup.classList.add("is-open");
		popup.setAttribute("aria-hidden", "false");
		document.documentElement.classList.add("popup-open");
	}

	function closePopup(popup) {
		popup.classList.remove("is-open");
		popup.setAttribute("aria-hidden", "true");
		if (!$(".popup.is-open")) document.documentElement.classList.remove("popup-open");
	}

	var pendingConfirm = null;
	function askConfirm(job, count, undo, onOk) {
		$("[data-confirm-job]").textContent = job;
		$("[data-confirm-count]").innerHTML = count;
		$("[data-confirm-undo]").textContent = undo;
		pendingConfirm = onOk;
		openPopup("popup-confirm");
	}

	/* ===== 이벤트 ===== */
	function bindActions() {
		document.addEventListener("click", function (event) {
			var target = event.target.closest("[data-action],[data-popup-open],[data-popup-close],[data-tab],[data-confirm-ok],[data-plan-toggle],[data-hospital-save]");
			if (!target) return;

			if (target.matches("[data-plan-toggle]")) {
				var hidden = document.body.classList.toggle("hide-plan");
				target.setAttribute("aria-pressed", String(!hidden));
				return;
			}
			if (target.matches("[data-tab]")) {
				var box = target.closest("[data-board-tabs]");
				$$("[data-tab]", box).forEach(function (tab) { tab.classList.toggle("active", tab === target); });
				$$("[data-tab-panel]", box).forEach(function (panel) { panel.hidden = panel.dataset.tabPanel !== target.dataset.tab; });
				return;
			}
			if (target.matches("[data-popup-open]")) { openPopup(target.dataset.popupOpen); return; }
			if (target.matches("[data-popup-close]")) { closePopup(target.closest(".popup")); return; }
			if (target.matches("[data-confirm-ok]")) {
				closePopup(target.closest(".popup"));
				if (pendingConfirm) pendingConfirm();
				pendingConfirm = null;
				return;
			}
			if (target.matches("[data-hospital-save]")) {
				closePopup(target.closest(".popup"));
				alert("병원을 바꿨습니다. 변경 이력이 남고 신청자에게 안내문자가 나갑니다. (기획 화면 — 실제로 저장되지 않습니다)");
				return;
			}

			switch (target.dataset.action) {
			case "announce-open":
				openAnnouncementSearch(target.dataset.announceTarget);
				break;
			case "announce-search":
				renderAnnouncementSearch();
				break;
			case "announce-page":
				event.preventDefault();
				break;
			case "announce-select":
				closePopup(target.closest(".popup"));
				selectBiz(target.dataset.biz);
				break;
			case "review-page":
				event.preventDefault();
				if (target.getAttribute("aria-disabled") === "true") break;
				var reviewPage = Number(target.dataset.page || 1);
				var reviewPagination = target.closest("[data-review-pagination]");
				$$('.board-pagination-list .board-page-button', reviewPagination).forEach(function (link) {
					var active = Number(link.dataset.page) === reviewPage;
					if (active) { link.setAttribute("aria-current", "page"); link.setAttribute("aria-disabled", "true"); link.tabIndex = -1; }
					else { link.removeAttribute("aria-current"); link.removeAttribute("aria-disabled"); link.removeAttribute("tabindex"); }
				});
				var navLinks = $$('.board-page-button[aria-label]', reviewPagination);
				[[0, 1, reviewPage > 1], [1, reviewPage - 1, reviewPage > 1], [2, reviewPage + 1, reviewPage < 3], [3, 3, reviewPage < 3]].forEach(function (item) {
					var link = navLinks[item[0]]; link.dataset.page = item[1];
					if (item[2]) { link.removeAttribute("aria-disabled"); link.removeAttribute("tabindex"); }
					else { link.setAttribute("aria-disabled", "true"); link.tabIndex = -1; }
				});
				break;
			case "review-search":
				renderReview();
				break;
			case "review-region":
				$("[data-review-part]").value = target.dataset.region;
				renderReview();
				break;
			case "review-detail":
				openReviewWindow(Number(target.dataset.reviewIndex));
				break;
			case "review-eval":
				openReviewEval(Number(target.dataset.reviewIndex));
				break;
			case "review-memo":
				openReviewMemo(Number(target.dataset.reviewIndex));
				break;
			case "review-open-eval":
				openReviewEval(state.reviewIndex);
				break;
			case "review-open-memo":
				openReviewMemo(state.reviewIndex);
				break;
			case "review-prev":
				openReviewDetail((state.reviewIndex - 1 + reviewRows().length) % reviewRows().length);
				break;
			case "review-next":
				openReviewDetail((state.reviewIndex + 1) % reviewRows().length);
				break;
			case "review-eval-save":
				var reviewResult = $('input[name="reviewResult"]:checked').value;
				var reviewReason = $("[data-review-reason]").value;
				if (!reviewReason) { alert("처리 사유를 선택해 주세요."); break; }
				var reviewRow = reviewRows()[state.reviewIndex];
				var previousReviewStatus = reviewRow.status;
				reviewRow.status = reviewResult;
				reviewRow.memo = $("[data-review-eval-memo]").value.trim() || reviewReason;
				if (reviewResult === "99" && previousReviewStatus !== "99") autoFillReviewVacancy(reviewRow);
				closePopup(target.closest(".popup"));
				if ($("#popup-review-detail").classList.contains("is-open")) openReviewDetail(state.reviewIndex);
				renderReview();
				break;
			case "review-memo-save":
				reviewRows()[state.reviewIndex].memo = $("[data-review-memo-text]").value.trim();
				closePopup(target.closest(".popup"));
				renderReview();
				break;
			case "review-send-sms":
				alert("신청자에게 문자를 발송했습니다. 발송 내용과 처리자가 이력에 남습니다. (기획 화면)");
				break;
			case "review-document-preview":
				alert("관리자 공통 파일 미리보기 팝업을 엽니다. (tdwfFilePreview.openPreview 연계)");
				break;
			case "review-document-download":
				alert("원본 제출서류 다운로드를 시작합니다. (tdwfFilePreview.download 연계)");
				break;
			case "review-excel":
				alert("현재 조회 조건의 1차심사 목록을 엑셀로 생성합니다. (기획 화면)");
				break;
			case "review-sms":
				var smsTargets = selectedReviewIndexes();
				alert(smsTargets.length ? "선택한 " + smsTargets.length + "명에게 보낼 문자 작성 화면을 엽니다. (기획 화면)" : "문자를 보낼 접수 건을 선택해 주세요.");
				break;
			case "review-batch-pass":
				previewReviewBatch("03");
				break;
			case "review-batch-hold":
				previewReviewBatch("02");
				break;
			case "review-batch-cancel":
				$("[data-review-preview]").hidden = true;
				state.reviewBatch = null;
				break;
			case "review-batch-confirm":
				var batch = state.reviewBatch;
				if (!batch) break;
				askConfirm(batch.type === "03" ? "1차심사 일괄 완료" : "1차심사 일괄 보류", num(batch.indexes.length) + "건", "1차선발이 시작되기 전까지 되돌릴 수 있습니다.", function () {
					batch.indexes.forEach(function (index) { reviewRows()[index].status = batch.type; });
					state.reviewBatch = null;
					renderReview();
				});
				break;
			case "copy-previous":
				state.std.saved = false;
				alert("전년도 기준을 불러온 상태를 시연합니다. 올해 공고에 없는 부문·유형은 제외됩니다.");
				renderStandard();
				break;
			case "std-save":
				if (state.std.locked) break;
				if (state.std.mode !== "UNLIMITED" && stdTotals().over !== 0) {
					alert("부문 인원 합계를 공고 모집인원과 일치시켜 주세요."); break;
				}
				if (state.std.mode !== "UNLIMITED" && stdTotals().typeOver.length) {
					alert(stdTotals().typeOver.join(", ") + " 부문의 유형 인원 합계가 부문 인원보다 많습니다."); break;
				}
				if (sortDuplicated()) { alert("선발순위에 같은 항목이 두 번 들어 있습니다."); break; }
				state.std.saved = true;
				state.std.savedAt = "2026-10-26 14:30";
				state.std.history.unshift([state.std.savedAt, "pass004", state.std.mode, "현재 선발순위 저장", "저장"]);
				renderStandard();
				break;
			case "std-auto-distribute":
				applyAutoAllocation(true);
				renderStandard();
				break;
			case "sort-add":
				var used = state.std.sorts.map(function (s) { return s.key; });
				var next = stdPolicy().keys.filter(function (k) { return used.indexOf(k) < 0; })[0];
				if (state.std.sorts.length < SORT_LIMIT && next) state.std.sorts.push({ key: next, dir: SORT_KEYS[next].dirs[0], order: "" });
				state.std.saved = false;
				renderStandard();
				break;
			case "sort-move":
			case "sort-remove":
				var sortIndex = Number(target.closest("[data-sort-row]").dataset.sortRow);
				var sorts = state.std.sorts;
				if (target.dataset.action === "sort-remove") sorts.splice(sortIndex, 1);
				else sorts.splice(sortIndex + Number(target.dataset.step), 0, sorts.splice(sortIndex, 1)[0]);
				state.std.saved = false;
				renderStandard();
				break;
			case "std-basis":
				/* 기준을 바꿔도 같은 인원이 되도록 입력값을 환산한다. 부문은 모집인원, 유형은 부문 인원 기준. */
				var bPart = state.std.parts[Number(target.dataset.p)];
				var bItem = target.dataset.t === "-1" ? bPart : bPart.types[Number(target.dataset.t)];
				if (bItem.basis !== target.dataset.basis) {
					var bPeople = bItem === bPart ? partPeople(bPart) : typePeople(bPart, bItem);
					var bBase = bItem === bPart ? announcedPeople() : partPeople(bPart);
					bItem.value = target.dataset.basis === "RATE" ? round1(bPeople / Math.max(bBase, 1) * 100) : bPeople;
					bItem.basis = target.dataset.basis;
					state.std.saved = false;
					renderStandard();
				}
				break;
			case "std-select":
				state.std.sel = Number(target.dataset.p);
				renderStandard();
				break;
			case "detect-benefit":
				$("[data-benefit-result]").hidden = false;
				$("[data-benefit-stats]").innerHTML = stat("탐지", 131, "명", "is-warn") + stat("최근 1년", 58, "명") + stat("최근 2~3년", 73, "명") + stat("이미 탈락", 4, "명");
				$("[data-benefit-body]").innerHTML = [0, 1, 2, 3, 4].map(function (i) {
					return '<tr><td class="text-center"><label class="check-label"><input type="checkbox" checked /><span class="check-label-text"></span></label></td><td class="text-center">' +
						String(5200 + i * 13).padStart(8, "0") + '</td><td class="text-center">' + ["김", "이", "박", "최", "정"][i] + '○○</td><td class="text-center">' +
						["김○○", "이○○", "박○○", "최○○", "정○○"][i] + '</td><td class="text-center">2009.0' + (i + 1) + '.12</td><td class="text-center">최종선발</td><td class="text-center">' +
						(2023 + (i % 3)) + '001</td><td class="text-center">예비선발</td><td class="text-center">-</td></tr>';
				}).join("") + '<tr><td colspan="9" class="text-center" style="color:var(--muted)">… 외 126명</td></tr>';
				break;
			case "reject-benefit":
				askConfirm("기수혜자 탈락처리", "131명 → 탈락(99), 사유 「평가시 기수혜자 탈락처리」", "1차선발 추가선발 전까지 되돌릴 수 있습니다.", function () {
					$$("[data-benefit-body] tr td:last-child").forEach(function (cell) { cell.innerHTML = badge("탈락", "red"); });
				});
				break;
			case "dup-save":
				closePopup(target.closest(".popup"));
				alert("판정을 저장했습니다. 탈락 건의 사유와 두 접수의 메모가 자동으로 기록됩니다. (기획 화면)");
				break;
			case "complete-review":
				if (biz().dup) { alert("중복수혜 판정 대기 9쌍이 남아 있어 1차심사를 완료할 수 없습니다."); }
				else { alert("1차심사를 완료합니다. (기획 화면)"); }
				break;
			case "extra-preview":
				state.extra = "preview"; renderSelection();
				break;
			case "extra-confirm":
				askConfirm("3차 추가선발", "결원 부문·전형에 대기자 추가", "추가된 인원의 서류심사가 시작되기 전까지 되돌릴 수 있습니다.", function () { state.extra = "confirmed"; renderSelection(); });
				break;
			case "noshow-preview":
				state.noshow = "preview"; renderCheckup();
				break;
			case "noshow-confirm":
				askConfirm("기간내 미검진 처리 (기한 2026-07-30)", "303건 / 409명 자격취소, 573명 병원 → 기타병원(A014)", "재선발이 시작되기 전까지 되돌릴 수 있습니다.", function () { state.noshow = "confirmed"; renderCheckup(); });
				break;
			case "approve":
				askConfirm("최종선발 결재완료", num(finalCounts().picked) + "명 (04 → 05)", "발표 전까지 되돌릴 수 있습니다.", function () { state.approved = true; renderFinal(); });
				break;
			case "publish":
				askConfirm("최종선발자 발표", "선발 " + num(finalCounts().picked) + "명 / 미선발 " + num(finalCounts().failed) + "명 · 발표일시 2026-10-21 10:00", "발표는 되돌릴 수 없습니다. 사용자에게 바로 보입니다.", function () {
					alert("발표를 예약했습니다. (기획 화면)");
				});
				break;
			case "sms-extract":
				renderSmsStats();
				break;
			default:
				break;
			}
		});

		document.addEventListener("change", function (event) {
			if (event.target.matches("[data-review-check-all]")) {
				$$('[data-review-row-check]').forEach(function (box) { box.checked = event.target.checked; });
			}
			if (event.target.matches("[data-std-issues-only]")) renderStandard();
			if (event.target.matches("[data-std-mode]")) {
				state.std.mode = event.target.value;
				state.std.saved = false;
				if (state.std.mode === "AUTO") applyAutoAllocation(false);
				renderStandard();
				return;
			}
			var stdField = event.target.dataset.stdField;
			if (stdField) {
				var part = state.std.parts[Number(event.target.dataset.p)];
				var level = stdField.charAt(0);
				var item = level === "p" ? part : part.types[Number(event.target.dataset.t)];
				if (stdField.slice(1) === "value") item.value = Number(event.target.value) || 0;
				/* 기준을 바꾸면 같은 인원이 되도록 입력값을 환산한다. 부문은 모집인원, 유형은 부문 인원 기준. */
				if (stdField.slice(1) === "basis") {
					var people = level === "p" ? partPeople(part) : typePeople(part, item);
					var base = level === "p" ? announcedPeople() : partPeople(part);
					item.value = event.target.value === "RATE" ? round1(people / Math.max(base, 1) * 100) : people;
					item.basis = event.target.value;
				}
				state.std.saved = false;
				renderStandard();
			}
			var sortRow = event.target.closest("[data-sort-row]");
			if (sortRow && event.target.dataset.sortField) {
				var sort = state.std.sorts[Number(sortRow.dataset.sortRow)];
				sort[event.target.dataset.sortField] = event.target.value;
				if (event.target.dataset.sortField === "key") {
					sort.dir = SORT_KEYS[sort.key].dirs[0];
					sort.order = "";
				}
				state.std.saved = false;
				renderStandard();
			}
			if (event.target.matches("[data-sms-rule]") && !$("[data-sms-stats]").hidden) renderSmsStats();
			if (event.target.matches("[data-check-all]")) {
				$$('[data-benefit-body] input[type="checkbox"]').forEach(function (box) { box.checked = event.target.checked; });
			}
		});
		$("[data-sms-text]").addEventListener("input", renderSmsText);
		window.addEventListener("hashchange", route);
	}

	function renderAll() {
		renderAnnounceBars();
		renderStandard();
		renderReview();
		renderSelection();
		renderFollowup();
		renderFinal();
		renderPayment();
		renderHistory();
	}

	document.addEventListener("DOMContentLoaded", function () {
		Object.keys(BIZ).forEach(function (code) { BIZ[code].code = code; });
		bindActions();
		renderAll();
		renderSmsText();
		route();
	});
})();
