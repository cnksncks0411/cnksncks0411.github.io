(function () {
	"use strict";
	var params = new URLSearchParams(location.search);
	var bizId = params.get("bizId") || "0003";
	var yearDeg = params.get("yearDeg") || "2024001";
	var acceptNo = params.get("acceptNo") || "00000124";
	var notices = { "0003": "2024년 건강검진사업", "0001": "2026년 일반장학사업", "0024": "2026년 희망바퀴장학사업" };
	var applicants = [
		{ no: "00000124", rank: 1, part: "서울", type: "본인", driver: "김○수", driverBirth: "1974-03-12", target: "김○수", targetBirth: "1974-03-12", relation: "본인", phone: "010-24**-7812", address: "서울특별시 송파구", vehicle: "서울82바12**", license: "정상", fuel: "정상", docs: "해당없음", benefit: 0, hospital: "국민체력센터", status: "01" },
		{ no: "00000131", rank: 2, part: "서울", type: "배우자", driver: "이○호", driverBirth: "1970-10-28", target: "박○희", targetBirth: "1976-06-02", relation: "배우자", phone: "010-38**-1029", address: "서울특별시 강서구", vehicle: "서울80사43**", license: "정상", fuel: "정상", docs: "1/1", benefit: 0, hospital: "서울메디검진센터", status: "01" },
		{ no: "00000148", rank: 3, part: "서울", type: "본인", driver: "최○진", driverBirth: "1968-08-17", target: "최○진", targetBirth: "1968-08-17", relation: "본인", phone: "010-77**-2041", address: "서울특별시 도봉구", vehicle: "서울83아71**", license: "정상", fuel: "정상", docs: "해당없음", benefit: 0, hospital: "한신메디피아", status: "03" },
		{ no: "00000156", rank: 4, part: "서울", type: "배우자", driver: "정○철", driverBirth: "1972-01-09", target: "정○철", targetBirth: "1972-01-09", relation: "배우자", phone: "010-51**-6620", address: "서울특별시 중랑구", vehicle: "서울81자09**", license: "정상", fuel: "정상", docs: "1/1", benefit: 0, hospital: "한국건강관리협회 서울동부", status: "02" }
	];
	var statusNames = { "01": "심사대기", "02": "보류", "03": "심사완료", "99": "탈락" };
	function $(selector) { return document.querySelector(selector); }
	function currentIndex() { var index = applicants.findIndex(function (row) { return row.no === acceptNo; }); return index < 0 ? 0 : index; }
	function current() {
		var found = applicants.find(function (row) { return row.no === acceptNo; });
		if (found) return found;
		return { no: acceptNo, rank: 1, part: "전국", type: "일반", driver: "신청자", driverBirth: "1970-01-01", target: "지원대상자", targetBirth: "2000-01-01", relation: "본인", phone: "010-****-0000", address: "등록 주소", vehicle: "등록 차량", license: "정상", fuel: "정상", docs: "완료", benefit: 0, hospital: "-", status: "01" };
	}
	function showToast(message) { var toast = $("[data-detail-toast]"); toast.textContent = message; toast.hidden = false; window.clearTimeout(showToast.timer); showToast.timer = window.setTimeout(function () { toast.hidden = true; }, 2400); }
	function checkCard(label, value, ok) { return '<div class="review-check-card ' + (ok ? "is-ok" : "is-warn") + '"><span class="material-symbols-rounded" aria-hidden="true">' + (ok ? "check_circle" : "error") + '</span><div><small>' + label + '</small><b>' + value + "</b></div></div>"; }
	function previewDocument(fileName) {
		var preview = window.open("", "tdwfDocumentPreview", "width=980,height=820,scrollbars=yes,resizable=yes");
		if (!preview) { showToast("미리보기 창을 열 수 없습니다. 팝업 차단 설정을 확인해 주세요."); return; }
		preview.document.open();
		preview.document.write('<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><title>' + fileName + '</title><style>body{margin:0;background:#edf2f7;font-family:Arial,sans-serif;color:#173d69}.bar{display:flex;align-items:center;justify-content:space-between;padding:16px 22px;background:#fff;border-bottom:1px solid #cad7e3}.paper{width:720px;min-height:900px;margin:28px auto;padding:60px;background:#fff;box-shadow:0 6px 24px rgba(20,50,80,.15)}h1{text-align:center;margin:0 0 50px}table{width:100%;border-collapse:collapse}th,td{padding:14px;border:1px solid #cbd5df}th{width:28%;background:#f3f6f9}.stamp{margin-top:80px;text-align:right;color:#788b9d}</style></head><body><div class="bar"><strong>제출서류 미리보기</strong><span>' + fileName + '</span></div><main class="paper"><h1>가족관계증명서</h1><table><tr><th>신청자</th><td>이○호</td></tr><tr><th>검진대상자</th><td>박○희</td></tr><tr><th>관계</th><td>배우자</td></tr><tr><th>발급일</th><td>2024-02-08</td></tr></table><p class="stamp">정적 기획 화면용 문서 미리보기</p></main></body></html>');
		preview.document.close();
		preview.focus();
	}
	function downloadDocument(fileName) {
		var content = "TDWF 정적 기획 화면용 제출서류 파일\n파일명: " + fileName + "\n실서비스에서는 tdwfFilePreview.download를 통해 원본 파일을 내려받습니다.";
		var url = URL.createObjectURL(new Blob([content], { type: "application/octet-stream" }));
		var link = document.createElement("a");
		link.href = url; link.download = fileName; document.body.appendChild(link); link.click(); link.remove();
		window.setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
		showToast(fileName + " 다운로드를 시작했습니다.");
	}
	function openPopup(id) {
		var popup = document.getElementById(id);
		popup.classList.add("is-open");
		popup.setAttribute("aria-hidden", "false");
		document.documentElement.classList.add("popup-open");
	}
	function closePopup(popup) {
		if (!popup) return;
		popup.classList.remove("is-open");
		popup.setAttribute("aria-hidden", "true");
		if (!document.querySelector(".popup.is-open")) document.documentElement.classList.remove("popup-open");
	}
	function openMemoPopup() {
		var row = current();
		$("[data-detail-memo-target]").textContent = row.no + " · " + row.driver + " / " + row.target;
		$("[data-detail-memo-text]").value = row.memo || "";
		$("[data-detail-memo-history]").innerHTML = row.memo ? '<li><b>최근 저장 · screening01</b><span>' + row.memo + "</span></li>" : '<li class="is-empty">등록된 메모가 없습니다.</li>';
		openPopup("detail-memo-popup");
	}
	function openReviewPopup() {
		var row = current();
		$("[data-detail-review-target]").textContent = row.no + " · " + row.driver + " / " + row.target + " (" + row.part + " · " + row.type + ")";
		$("[data-detail-review-reason]").value = "";
		$("[data-detail-review-memo]").value = row.reviewMemo || "";
		var result = $('input[name="detailReviewResult"][value="' + row.status + '"]');
		(result || $('input[name="detailReviewResult"][value="03"]')).checked = true;
		openPopup("detail-review-popup");
	}
	function saveMemo() {
		var row = current();
		row.memo = $("[data-detail-memo-text]").value.trim();
		closePopup(document.getElementById("detail-memo-popup"));
		showToast("접수번호 " + row.no + "의 메모를 저장했습니다.");
	}
	function saveReview() {
		var reason = $("[data-detail-review-reason]").value;
		if (!reason) { alert("처리 사유를 선택해 주세요."); return; }
		var row = current();
		row.status = $('input[name="detailReviewResult"]:checked').value;
		row.reviewMemo = $("[data-detail-review-memo]").value.trim() || reason;
		closePopup(document.getElementById("detail-review-popup"));
		render();
		showToast("접수번호 " + row.no + "을(를) " + statusNames[row.status] + " 처리했습니다.");
	}
	function render() {
		var row = current();
		var notice = notices[bizId] || "선택 공고";
		document.title = "접수내역 상세 - " + row.no;
		$("[data-detail-heading]").textContent = notice + " · " + yearDeg + " · 접수번호 " + row.no;
		$("[data-detail-summary]").innerHTML = '<div><span>선발순위</span><b>' + row.part + " · " + row.type + " " + row.rank + '위</b></div><div><span>접수구분</span><b>' + statusNames[row.status] + '</b></div><div><span>신청일</span><b>2024-02-' + String(10 + currentIndex()).padStart(2, "0") + '</b></div><div><span>선택병원</span><b>' + row.hospital + "</b></div>";
		$("[data-detail-driver]").innerHTML = '<tr><th scope="row">성명</th><td>' + row.driver + '</td><th scope="row">생년월일</th><td>' + row.driverBirth + '</td></tr><tr><th scope="row">휴대전화</th><td>' + row.phone + '</td><th scope="row">차량번호</th><td>' + row.vehicle + '</td></tr><tr><th scope="row">자택주소</th><td colspan="3">' + row.address + "</td></tr>";
		$("[data-detail-target]").innerHTML = '<tr><th scope="row">대상자 성명</th><td>' + row.target + '</td><th scope="row">생년월일</th><td>' + row.targetBirth + '</td></tr><tr><th scope="row">신청구분</th><td>' + row.type + '</td><th scope="row">운전자와 관계</th><td>' + row.relation + '</td></tr><tr><th scope="row">선발부문</th><td>' + row.part + '</td><th scope="row">과거 수혜</th><td>' + (row.benefit ? row.benefit + "회" : "없음") + "</td></tr>";
		var targetMatch = row.type === "본인" ? row.driver === row.target : row.driver !== row.target;
		var evenYear = Number(row.targetBirth.slice(0, 4)) % 2 === 0;
		$("[data-detail-checks]").innerHTML = checkCard("운송종사자격", row.license, row.license === "정상") + checkCard("유가보조금", row.fuel, row.fuel === "정상") + checkCard("신청구분·대상자", targetMatch ? "일치" : "불일치", targetMatch) + checkCard("2024 검진 대상연도", evenYear ? "해당" : "비해당", evenYear) + checkCard("검진병원", row.hospital, row.hospital !== "미선택") + checkCard("중복 식별값", "중복 없음", true);
		var docs = row.type === "배우자" ? [["가족관계증명서", "family_relation_" + row.no + ".pdf", row.docs === "1/1"]] : [["공고상 별도 제출서류 없음", "온라인 검증값으로 심사", true]];
		$("[data-detail-documents]").innerHTML = docs.map(function (doc) { return '<div class="review-document-item"><span class="material-symbols-rounded" aria-hidden="true">description</span><div><b>' + doc[0] + '</b><small>' + doc[1] + '</small></div><span class="review-check ' + (doc[2] ? "is-ok" : "is-warn") + '">' + (doc[2] ? "제출완료" : "확인필요") + '</span>' + (doc[0].indexOf("없음") < 0 ? '<div class="review-document-actions"><button type="button" class="btn variant-outline color-navy rounded-md size-sm" data-action="document-preview" data-file-name="' + doc[1] + '"><span class="material-symbols-rounded" aria-hidden="true">visibility</span> 미리보기</button><button type="button" class="btn variant-outline color-navy rounded-md size-sm" data-action="document-download" data-file-name="' + doc[1] + '"><span class="material-symbols-rounded" aria-hidden="true">download</span> 다운로드</button></div>' : "") + "</div>"; }).join("");
	}
	function move(offset) { var index = (currentIndex() + offset + applicants.length) % applicants.length; acceptNo = applicants[index].no; params.set("acceptNo", acceptNo); history.replaceState(null, "", location.pathname + "?" + params.toString()); render(); }
	document.addEventListener("click", function (event) {
		var closer = event.target.closest("[data-detail-popup-close]");
		if (closer) { closePopup(closer.closest(".popup")); return; }
		var button = event.target.closest("[data-action]"); if (!button) return;
		switch (button.dataset.action) {
			case "window-close": window.close(); break;
			case "previous": move(-1); break;
			case "next": move(1); break;
			case "sms-send": showToast("문자 발송 요청을 확인했습니다. (정적 화면)"); break;
			case "document-preview": previewDocument(button.dataset.fileName || "제출서류"); break;
			case "document-download": downloadDocument(button.dataset.fileName || "제출서류"); break;
			case "memo": openMemoPopup(); break;
			case "review": openReviewPopup(); break;
			case "memo-save": saveMemo(); break;
			case "review-save": saveReview(); break;
		}
	});
	$("[data-detail-sms-template]").addEventListener("change", function (event) {
		var messages = { supplement: "[화물복지재단] 건강검진사업 신청서류 확인이 필요합니다. 마이페이지에서 보완해 주세요.", complete: "[화물복지재단] 건강검진사업 1차심사가 완료되었습니다.", reject: "[화물복지재단] 건강검진사업 심사 결과를 마이페이지에서 확인해 주세요." };
		$("[data-detail-sms-message]").value = messages[event.target.value];
	});
	render();
}());
