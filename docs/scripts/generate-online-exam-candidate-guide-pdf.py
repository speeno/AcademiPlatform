#!/usr/bin/env python3
"""Generate AcademiQ online exam candidate guide PDF."""

from __future__ import annotations

from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm, mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    HRFlowable,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

ROOT = Path(__file__).resolve().parents[2]
PDF_PATH = ROOT / "docs" / "online-exam-candidate-guide.pdf"

FONT_PATH = "/System/Library/Fonts/Supplemental/AppleGothic.ttf"
FONT_NAME = "AppleGothic"

BRAND_BLUE = colors.HexColor("#073B78")
BRAND_TEAL = colors.HexColor("#08A9A5")
TEXT_MUTED = colors.HexColor("#5A6B7D")
TEXT_BODY = colors.HexColor("#102033")
BORDER = colors.HexColor("#D8E3EE")
BG_SUBTLE = colors.HexColor("#EAF2F8")


def register_font() -> None:
    if not Path(FONT_PATH).exists():
        raise FileNotFoundError(f"Korean font not found: {FONT_PATH}")
    pdfmetrics.registerFont(TTFont(FONT_NAME, FONT_PATH))


def styles() -> dict[str, ParagraphStyle]:
    base = getSampleStyleSheet()
    return {
        "cover_title": ParagraphStyle(
            "cover_title",
            fontName=FONT_NAME,
            fontSize=28,
            leading=34,
            textColor=BRAND_BLUE,
            alignment=TA_CENTER,
            spaceAfter=10,
        ),
        "cover_sub": ParagraphStyle(
            "cover_sub",
            fontName=FONT_NAME,
            fontSize=16,
            leading=22,
            textColor=TEXT_BODY,
            alignment=TA_CENTER,
            spaceAfter=8,
        ),
        "cover_meta": ParagraphStyle(
            "cover_meta",
            fontName=FONT_NAME,
            fontSize=11,
            leading=16,
            textColor=TEXT_MUTED,
            alignment=TA_CENTER,
            spaceAfter=6,
        ),
        "h1": ParagraphStyle(
            "h1",
            fontName=FONT_NAME,
            fontSize=16,
            leading=22,
            textColor=BRAND_BLUE,
            spaceBefore=14,
            spaceAfter=8,
        ),
        "h2": ParagraphStyle(
            "h2",
            fontName=FONT_NAME,
            fontSize=13,
            leading=18,
            textColor=BRAND_BLUE,
            spaceBefore=10,
            spaceAfter=6,
        ),
        "body": ParagraphStyle(
            "body",
            fontName=FONT_NAME,
            fontSize=10.5,
            leading=16,
            textColor=TEXT_BODY,
            spaceAfter=6,
        ),
        "bullet": ParagraphStyle(
            "bullet",
            fontName=FONT_NAME,
            fontSize=10.5,
            leading=16,
            textColor=TEXT_BODY,
            leftIndent=14,
            bulletIndent=0,
            spaceAfter=4,
        ),
        "small": ParagraphStyle(
            "small",
            fontName=FONT_NAME,
            fontSize=9,
            leading=13,
            textColor=TEXT_MUTED,
            spaceAfter=4,
        ),
        "table_head": ParagraphStyle(
            "table_head",
            fontName=FONT_NAME,
            fontSize=10,
            leading=14,
            textColor=colors.white,
        ),
        "table_cell": ParagraphStyle(
            "table_cell",
            fontName=FONT_NAME,
            fontSize=9.5,
            leading=14,
            textColor=TEXT_BODY,
        ),
    }


def P(text: str, style: ParagraphStyle) -> Paragraph:
    return Paragraph(text.replace("\n", "<br/>"), style)


def make_table(rows: list[list[str]], col_widths: list[float], s: dict) -> Table:
    data = []
    for i, row in enumerate(rows):
        styled = []
        for cell in row:
            style = s["table_head"] if i == 0 else s["table_cell"]
            styled.append(P(cell, style))
        data.append(styled)

    table = Table(data, colWidths=col_widths, repeatRows=1)
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), BRAND_BLUE),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, -1), FONT_NAME),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("GRID", (0, 0), (-1, -1), 0.4, BORDER),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, BG_SUBTLE]),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    return table


def add_header_footer(canvas, doc) -> None:
    canvas.saveState()
    canvas.setFont(FONT_NAME, 8)
    canvas.setFillColor(TEXT_MUTED)
    if doc.page > 1:
        canvas.drawString(2 * cm, A4[1] - 1.2 * cm, "AcademiQ")
        canvas.drawRightString(A4[0] - 2 * cm, A4[1] - 1.2 * cm, "온라인 시험 응시 가이드")
        canvas.setStrokeColor(BORDER)
        canvas.line(2 * cm, A4[1] - 1.35 * cm, A4[0] - 2 * cm, A4[1] - 1.35 * cm)
        canvas.drawCentredString(A4[0] / 2, 1 * cm, f"- {canvas.getPageNumber()} -")
    canvas.restoreState()


def build_story(s: dict) -> list:
    story: list = []
    usable = A4[0] - 4 * cm

    # Cover
    story.append(Spacer(1, 5 * cm))
    story.append(P("AcademiQ", s["cover_title"]))
    story.append(Spacer(1, 0.4 * cm))
    story.append(P("온라인 시험 응시 가이드 및 주의사항", s["cover_sub"]))
    story.append(Spacer(1, 0.6 * cm))
    story.append(P("응시자용 안내서", s["cover_meta"]))
    story.append(P("2026년 6월 · AcademiQ 플랫폼", s["cover_meta"]))
    story.append(Spacer(1, 2.5 * cm))
    story.append(
        P(
            "본 문서는 시험 시작 전 반드시 숙지해 주시기 바랍니다.<br/>"
            "응시 중 일부 행위는 시스템에 기록되며 관리자가 검토합니다.",
            s["cover_meta"],
        )
    )
    story.append(PageBreak())

    # Intro
    story.append(P("안내", s["h1"]))
    story.append(
        P(
            "본 문서는 AcademiQ 플랫폼에서 온라인 시험을 응시하는 수험자를 위한 안내입니다. "
            "시험 시작 전 반드시 숙지해 주시기 바랍니다. 시험 규정 위반 시 "
            "<b>응시 무효·감점·재시험 불가</b> 등의 조치가 있을 수 있으며, 응시 중 일부 행위는 "
            "<b>시스템에 자동 기록</b>되고 <b>관리자가 실시간·사후 검토</b>합니다.",
            s["body"],
        )
    )
    story.append(Spacer(1, 0.2 * cm))

    # Section 1
    story.append(P("1. 시험 진행 절차", s["h1"]))
    story.append(
        make_table(
            [
                ["단계", "내용"],
                ["① 접수·승인", "시험 접수 후 관리자 온라인 응시 승인이 완료되어야 합니다."],
                ["② 대기실(로비)", "응시 가능 시간에 로비에 입장해 환경(웹캠·전체화면 등)을 점검합니다."],
                ["③ 응시", "제한 시간 내 문항에 답하고, 답안은 자동 저장됩니다."],
                ["④ 결과 확인", "채점 완료 및 결과 공개 후 마이페이지에서 확인합니다."],
            ],
            [usable * 0.22, usable * 0.78],
            s,
        )
    )
    story.append(Spacer(1, 0.3 * cm))

    # Section 2
    story.append(P("2. 응시 전 준비사항", s["h1"]))
    story.append(P("2.1 계정·접수", s["h2"]))
    for item in [
        "본인 계정으로 로그인했는지 확인합니다. (계정 공유·대리 응시 금지)",
        "마이페이지 시험 접수 내역에서 온라인 응시 승인 완료 여부를 확인합니다.",
        "시험 응시 가능 시간을 확인합니다.",
    ]:
        story.append(P(f"• {item}", s["bullet"]))

    story.append(P("2.2 환경·장비", s["h2"]))
    for item in [
        "안정적인 인터넷(유선 또는 Wi-Fi)을 준비합니다.",
        "노트북은 전원 연결을 권장합니다.",
        "조용하고 독립된 공간에서 응시합니다.",
        "브라우저: Chrome 또는 Edge 최신 버전 권장",
        "운영체제: Windows 10 이상, macOS 12 이상 권장",
        "네트워크: 10Mbps 이상의 안정적인 연결 권장",
    ]:
        story.append(P(f"• {item}", s["bullet"]))

    story.append(P("2.3 회차별 추가 준비", s["h2"]))
    story.append(
        make_table(
            [
                ["설정", "응시 전 준비"],
                ["웹캠 필수", "카메라 정상 동작, 충분한 조명, 얼굴이 화면에 보이도록 준비"],
                ["전체화면 필수", "전체화면 전환이 가능한 브라우저 사용 (로비에서 사전 확인)"],
            ],
            [usable * 0.28, usable * 0.72],
            s,
        )
    )
    story.append(PageBreak())

    # Section 3
    story.append(P("3. 응시 중 필수 준수 사항", s["h1"]))
    story.append(P("3.1 반드시 지켜야 할 사항", s["h2"]))
    rules = [
        "시험 화면 유지 — 다른 탭·앱으로 이동하지 않습니다. (이탈 시 기록됨)",
        "복사·붙여넣기 금지 — 시도 시 차단되며 기록됩니다.",
        "우클릭 금지 — 마우스 우클릭 메뉴는 사용할 수 없습니다.",
        "전체화면 유지 — 전체화면 필수 회차에서는 응시 내내 유지합니다.",
        "웹캠 유지 — 웹캠 필수 회차에서는 카메라를 가리거나 끄지 않습니다.",
        "외부 도움 금지 — 검색, AI, 메신저, 교재, 타인과의 대화 등 일체 금지",
        "추가 기기 금지 — 휴대폰, 태블릿, 두 번째 모니터 사용 금지",
        "직접 작성 — 모든 답안은 본인이 직접 작성합니다.",
        "시간 확인 — 시간 종료 시 자동 제출됩니다.",
        "제출 신중 — 제출 후에는 답안 수정이 불가합니다.",
    ]
    for i, rule in enumerate(rules, 1):
        story.append(P(f"{i}. {rule}", s["bullet"]))

    story.append(P("3.2 답안 저장·제출", s["h2"]))
    for item in [
        "문항 변경 시 답안이 자동 저장됩니다. “저장됨” 표시를 확인하세요.",
        "동일 접수 건으로는 1회만 응시할 수 있습니다.",
        "응시 중이던 시험이 있다면 이어서 진행할 수 있습니다.",
    ]:
        story.append(P(f"• {item}", s["bullet"]))

    story.append(P("3.3 응시 시간", s["h2"]))
    for item in [
        "개인 제한 시간과 회차 종료 시각 중 더 이른 시각에 시험이 종료됩니다.",
        "종료 시점에 미제출 답안은 자동 제출됩니다.",
    ]:
        story.append(P(f"• {item}", s["bullet"]))

    # Section 4
    story.append(P("4. 금지 행위 및 감독 안내", s["h1"]))
    story.append(
        P(
            "AcademiQ는 공정한 시험을 위해 응시 환경을 관리합니다. "
            "아래 행위는 기록되거나 차단될 수 있습니다.",
            s["body"],
        )
    )
    story.append(Spacer(1, 0.15 * cm))
    story.append(
        make_table(
            [
                ["행위", "처리"],
                ["시험 화면 이탈 (다른 탭·창 전환, 최소화)", "기록"],
                ["복사 시도", "차단 및 기록"],
                ["붙여넣기 시도", "차단 및 기록"],
                ["전체화면 해제 (필수 회차)", "기록"],
                ["웹캠 권한 거부·카메라 중단 (필수 회차)", "기록"],
            ],
            [usable * 0.55, usable * 0.45],
            s,
        )
    )
    story.append(Spacer(1, 0.2 * cm))
    story.append(P("4.1 웹캠 감독 (웹캠 필수 회차)", s["h2"]))
    for item in [
        "로비에서 카메라 권한·동작을 사전 확인합니다.",
        "응시 중 화면에 웹캠 미리보기가 표시됩니다.",
        "시험 시작 직후 및 약 3분마다 화면이 촬영되어 감독 기록으로 저장됩니다.",
        "금지: 카메라 가리기, 대리 응시, 복수 인원 출현, 휴대폰 사용 등",
    ]:
        story.append(P(f"• {item}", s["bullet"]))

    story.append(P("4.2 전체화면 (전체화면 필수 회차)", s["h2"]))
    for item in [
        "로비에서 전체화면 전환을 사전 확인합니다.",
        "응시 내내 전체화면을 유지해야 합니다. 중간에 해제하면 기록됩니다.",
    ]:
        story.append(P(f"• {item}", s["bullet"]))

    story.append(P("4.3 기타 금지 행위", s["h2"]))
    for item in [
        "본인 계정을 타인에게 제공하거나 대리 응시",
        "허용되지 않은 참고 자료·인터넷 검색 활용",
        "문항 촬영·유출 (스크린샷·촬영 금지)",
        "타인이 작성한 답안 제출 (서술형·파일 제출 포함)",
        "응시 중 가족·동료와 구두 상담",
    ]:
        story.append(P(f"• {item}", s["bullet"]))
    story.append(PageBreak())

    # Section 5-8
    story.append(P("5. 응시 후 안내", s["h1"]))
    for item in [
        "마이페이지 시험 접수 내역에서 완료·채점·결과 상태를 확인합니다.",
        "결과는 관리자가 결과를 공개한 이후 조회할 수 있습니다.",
        "이의 제기·문의는 공지사항 및 1:1 문의를 이용해 주세요.",
    ]:
        story.append(P(f"• {item}", s["bullet"]))

    story.append(P("6. 위반 시 조치", s["h1"]))
    story.append(
        P(
            "시스템은 경고 횟수에 따라 자동 실격하지 않으며, 관리자가 행위 기록·웹캠 기록·"
            "제출 시각·답안 내용을 종합해 판단합니다.",
            s["body"],
        )
    )
    story.append(Spacer(1, 0.15 * cm))
    story.append(
        make_table(
            [
                ["수준", "예시", "조치"],
                ["경미", "일시적 화면 이탈 후 즉시 복귀", "경고·기록 유지"],
                ["중대", "화면 이탈·복사 시도 반복, 감독 영상 이상", "답안 검토, 감점 또는 재시험 불가"],
                ["중대", "웹캠 거부, 대리 응시 정황", "응시 무효 검토"],
                ["최중대", "문항 유출, 조직적 부정", "시험 무효, 자격 취소 등"],
            ],
            [usable * 0.15, usable * 0.5, usable * 0.35],
            s,
        )
    )

    story.append(P("7. 자주 묻는 질문", s["h1"]))
    faqs = [
        ("승인 전에는 시험을 볼 수 없나요?", "네. 온라인 응시 승인, 게시된 시험지, 응시 가능 시간이 모두 충족되어야 합니다."),
        ("인터넷이 끊기면 어떻게 되나요?", "연결 복구 후 이어서 진행할 수 있습니다. 안정적인 환경에서 응시하세요."),
        ("시간이 끝나면 어떻게 되나요?", "제한 시간 또는 회차 종료 시각에 자동 제출됩니다."),
        ("제출 후 답을 고칠 수 있나요?", "아니요. 제출 후에는 수정할 수 없습니다."),
        ("웹캠이 필수가 아닌 시험도 있나요?", "있습니다. 회차 설정에 따라 다릅니다."),
    ]
    for q, a in faqs:
        story.append(P(f"<b>Q. {q}</b>", s["body"]))
        story.append(P(f"A. {a}", s["bullet"]))

    story.append(P("8. 문의", s["h1"]))
    for item in [
        "공지사항: 플랫폼 상단 공지 및 마이페이지 안내",
        "1:1 문의: 웹사이트 문의하기",
        "시험별 문의: 해당 시험 공고에 안내된 주최 기관 연락처",
    ]:
        story.append(P(f"• {item}", s["bullet"]))

    story.append(Spacer(1, 0.5 * cm))
    story.append(HRFlowable(width="100%", thickness=0.5, color=BORDER))
    story.append(Spacer(1, 0.2 * cm))
    story.append(
        P(
            "본 안내는 AcademiQ 온라인 시험 시스템 기준으로 작성되었습니다. "
            "개별 시험의 추가 규정은 시험 공고를 우선 적용합니다.",
            s["small"],
        )
    )
    story.append(P("<b>AcademiQ</b> — 공정하고 신뢰할 수 있는 온라인 시험", s["small"]))

    return story


def main() -> None:
    register_font()
    s = styles()
    doc = SimpleDocTemplate(
        str(PDF_PATH),
        pagesize=A4,
        leftMargin=2 * cm,
        rightMargin=2 * cm,
        topMargin=1.8 * cm,
        bottomMargin=1.8 * cm,
        title="AcademiQ 온라인 시험 응시 가이드",
        author="AcademiQ",
    )
    doc.build(build_story(s), onFirstPage=add_header_footer, onLaterPages=add_header_footer)
    print(f"Generated: {PDF_PATH}")


if __name__ == "__main__":
    main()
