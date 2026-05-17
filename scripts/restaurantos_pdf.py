"""
RestaurantOS PDF generator — whitelabel sales deck + feature catalog.

Usage:
    python /dev-server/scripts/restaurantos_pdf.py

To rebrand for a new restaurant, edit the BRAND dict below.
Outputs to /mnt/documents/.
"""
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor, Color
from reportlab.pdfgen import canvas
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle,
    KeepTogether, Frame, PageTemplate, BaseDocTemplate, NextPageTemplate
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT, TA_JUSTIFY
import os

# ============================================================
# BRAND CONFIG — change these to rebrand
# ============================================================
BRAND = {
    "product_name": "RestaurantOS",
    "tagline": "Komplett digitális kifőzde- és étterem-platform",
    "vendor": "Lovable Studio",
    "contact": "hello@restaurantos.hu",

    # Whitelabel palette (dark, gold accent)
    "bg_dark":       HexColor("#0F172A"),  # main dark background
    "bg_panel":      HexColor("#1B263B"),  # card / panel
    "bg_panel_alt":  HexColor("#162033"),
    "accent":        HexColor("#F6C22D"),  # gold accent (cserélhető)
    "accent_soft":   HexColor("#FFE8A3"),
    "text_on_dark":  HexColor("#FFF8E6"),
    "text_muted":    HexColor("#9CA8BD"),
    "success":       HexColor("#4ADE80"),
    "danger":        HexColor("#F87171"),

    # Case study (last 1-2 pages of catalog)
    "case_study": {
        "name": "Kiscsibe Reggeliző & Étterem",
        "location": "Budapest, Zugló",
        "tagline": "Házias ízek minden hétköznap",
        "primary": HexColor("#F6C22D"),
        "secondary": HexColor("#FFF8E6"),
        "dark": HexColor("#1F2A41"),
        "url": "kiscsibe-etterem.hu",
        "stats": [
            ("776",  "étlap tétel a master library-ben"),
            ("13",   "modul élesben"),
            ("17",   "edge function automatizáció"),
            ("~4500","sor új kód 1 hét alatt"),
            ("≤2 mp","oldalbetöltés mobilon"),
            ("100%", "GDPR + EU allergén compliance"),
        ]
    }
}

OUTPUT_DIR = "/mnt/documents"
os.makedirs(OUTPUT_DIR, exist_ok=True)

PAGE_W, PAGE_H = A4
MARGIN = 18 * mm


# ============================================================
# Shared page chrome (dark background, header bar, footer)
# ============================================================
def draw_background(c: canvas.Canvas, doc):
    c.setFillColor(BRAND["bg_dark"])
    c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)

    # Top accent bar
    c.setFillColor(BRAND["accent"])
    c.rect(0, PAGE_H - 4*mm, PAGE_W, 4*mm, fill=1, stroke=0)

    # Footer
    c.setFillColor(BRAND["text_muted"])
    c.setFont("Helvetica", 8)
    c.drawString(MARGIN, 10*mm, f"{BRAND['product_name']} — {BRAND['tagline']}")
    c.drawRightString(PAGE_W - MARGIN, 10*mm, f"oldal {doc.page}")


def draw_cover_background(c: canvas.Canvas, doc):
    # Full dark with large gold corner shape
    c.setFillColor(BRAND["bg_dark"])
    c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    # accent corner
    c.setFillColor(BRAND["accent"])
    p = c.beginPath()
    p.moveTo(0, PAGE_H)
    p.lineTo(PAGE_W * 0.55, PAGE_H)
    p.lineTo(0, PAGE_H * 0.55)
    p.close()
    c.drawPath(p, fill=1, stroke=0)
    # subtle panel band bottom
    c.setFillColor(BRAND["bg_panel"])
    c.rect(0, 0, PAGE_W, 35*mm, fill=1, stroke=0)


# ============================================================
# Styles
# ============================================================
def make_styles():
    s = getSampleStyleSheet()
    styles = {
        "title": ParagraphStyle("title", parent=s["Title"], fontName="Helvetica-Bold",
                                fontSize=42, leading=48,
                                textColor=BRAND["text_on_dark"], alignment=TA_LEFT),
        "subtitle": ParagraphStyle("subtitle", parent=s["Normal"], fontName="Helvetica",
                                   fontSize=18, leading=24,
                                   textColor=BRAND["accent_soft"], alignment=TA_LEFT),
        "h1": ParagraphStyle("h1", parent=s["Heading1"], fontName="Helvetica-Bold",
                             fontSize=26, leading=32,
                             textColor=BRAND["accent"], spaceAfter=10, alignment=TA_LEFT),
        "h2": ParagraphStyle("h2", parent=s["Heading2"], fontName="Helvetica-Bold",
                             fontSize=16, leading=20,
                             textColor=BRAND["text_on_dark"], spaceBefore=10, spaceAfter=6),
        "h3": ParagraphStyle("h3", parent=s["Heading3"], fontName="Helvetica-Bold",
                             fontSize=12, leading=15,
                             textColor=BRAND["accent"], spaceBefore=6, spaceAfter=3),
        "body": ParagraphStyle("body", parent=s["BodyText"], fontName="Helvetica",
                               fontSize=10.5, leading=15,
                               textColor=BRAND["text_on_dark"], alignment=TA_JUSTIFY,
                               spaceAfter=6),
        "bullet": ParagraphStyle("bullet", parent=s["BodyText"], fontName="Helvetica",
                                 fontSize=10.5, leading=15,
                                 textColor=BRAND["text_on_dark"], leftIndent=12,
                                 bulletIndent=0, spaceAfter=3),
        "muted": ParagraphStyle("muted", parent=s["Normal"], fontName="Helvetica-Oblique",
                                fontSize=9, leading=12,
                                textColor=BRAND["text_muted"]),
        "label": ParagraphStyle("label", parent=s["Normal"], fontName="Helvetica-Bold",
                                fontSize=8, leading=10,
                                textColor=BRAND["accent"]),
        "kpi_num": ParagraphStyle("kpi_num", parent=s["Normal"], fontName="Helvetica-Bold",
                                  fontSize=28, leading=32,
                                  textColor=BRAND["accent"], alignment=TA_CENTER),
        "kpi_lbl": ParagraphStyle("kpi_lbl", parent=s["Normal"], fontName="Helvetica",
                                  fontSize=9, leading=11,
                                  textColor=BRAND["text_on_dark"], alignment=TA_CENTER),
        "cover_brand": ParagraphStyle("cover_brand", parent=s["Normal"], fontName="Helvetica-Bold",
                                      fontSize=11, leading=14,
                                      textColor=BRAND["bg_dark"], alignment=TA_LEFT),
        "footer": ParagraphStyle("footer", parent=s["Normal"], fontName="Helvetica",
                                 fontSize=9, textColor=BRAND["text_muted"]),
    }
    return styles


# ============================================================
# Reusable layout helpers
# ============================================================
def panel(content_flows, styles, bg=None, pad=10):
    """Wrap flowables in a dark panel."""
    bg = bg or BRAND["bg_panel"]
    inner = [c for c in content_flows]
    t = Table([[inner]], colWidths=[PAGE_W - 2*MARGIN])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,-1), bg),
        ("BOX", (0,0), (-1,-1), 0.5, BRAND["bg_panel_alt"]),
        ("LEFTPADDING", (0,0), (-1,-1), pad),
        ("RIGHTPADDING", (0,0), (-1,-1), pad),
        ("TOPPADDING", (0,0), (-1,-1), pad),
        ("BOTTOMPADDING", (0,0), (-1,-1), pad),
        ("VALIGN", (0,0), (-1,-1), "TOP"),
    ]))
    return t


def kpi_row(items, styles):
    """items = [(value, label), ...] - returns a Table."""
    cells = []
    for v, l in items:
        cells.append([
            Paragraph(str(v), styles["kpi_num"]),
            Paragraph(l, styles["kpi_lbl"]),
        ])
    # Transpose: one column per KPI
    columns = []
    for cell in cells:
        col_table = Table([[cell[0]], [cell[1]]], colWidths=[(PAGE_W - 2*MARGIN) / len(items) - 4])
        col_table.setStyle(TableStyle([
            ("BACKGROUND", (0,0), (-1,-1), BRAND["bg_panel"]),
            ("BOX", (0,0), (-1,-1), 0.5, BRAND["bg_panel_alt"]),
            ("TOPPADDING", (0,0), (-1,-1), 10),
            ("BOTTOMPADDING", (0,0), (-1,-1), 10),
            ("LEFTPADDING", (0,0), (-1,-1), 6),
            ("RIGHTPADDING", (0,0), (-1,-1), 6),
        ]))
        columns.append(col_table)
    row = Table([columns], colWidths=[(PAGE_W - 2*MARGIN)/len(items)]*len(items))
    row.setStyle(TableStyle([
        ("LEFTPADDING", (0,0), (-1,-1), 2),
        ("RIGHTPADDING", (0,0), (-1,-1), 2),
        ("TOPPADDING", (0,0), (-1,-1), 0),
        ("BOTTOMPADDING", (0,0), (-1,-1), 0),
    ]))
    return row


def screenshot_placeholder(label, h_mm=70):
    """A grey box that says 'képernyőkép helye'."""
    w = PAGE_W - 2*MARGIN
    t = Table([[Paragraph(f"<i>[ képernyőkép helye — {label} ]</i>",
                          ParagraphStyle("ph", fontName="Helvetica-Oblique",
                                         fontSize=9, textColor=BRAND["text_muted"],
                                         alignment=TA_CENTER))]],
              colWidths=[w], rowHeights=[h_mm*mm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,-1), BRAND["bg_panel_alt"]),
        ("BOX", (0,0), (-1,-1), 0.5, BRAND["accent"]),
        ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
        ("ALIGN", (0,0), (-1,-1), "CENTER"),
    ]))
    return t


def bullet_list(items, styles):
    out = []
    for it in items:
        out.append(Paragraph(f"<font color='{BRAND['accent'].hexval()[2:]}'>▸</font>&nbsp;&nbsp;{it}", styles["bullet"]))
    return out


def feature_block(title, who, value, what_it_does, styles, screenshot_label=None):
    """One feature card: title, audience, value, description, optional screenshot."""
    items = [
        Paragraph(title, styles["h2"]),
        Paragraph(f"<b>Kinek:</b> {who} &nbsp;&nbsp;|&nbsp;&nbsp; <b>Üzleti érték:</b> {value}", styles["muted"]),
        Spacer(1, 4),
    ]
    if isinstance(what_it_does, list):
        items.extend(bullet_list(what_it_does, styles))
    else:
        items.append(Paragraph(what_it_does, styles["body"]))
    if screenshot_label:
        items.append(Spacer(1, 6))
        items.append(screenshot_placeholder(screenshot_label, h_mm=45))
    return KeepTogether(panel(items, styles))


# ============================================================
# PDF #1 — SALES DECK
# ============================================================
def build_sales_deck(path):
    doc = BaseDocTemplate(path, pagesize=A4,
                          leftMargin=MARGIN, rightMargin=MARGIN,
                          topMargin=25*mm, bottomMargin=20*mm,
                          title=f"{BRAND['product_name']} — Sales Deck",
                          author=BRAND["vendor"])

    frame = Frame(MARGIN, 18*mm, PAGE_W-2*MARGIN, PAGE_H-43*mm, id="body")
    cover_frame = Frame(MARGIN, 40*mm, PAGE_W-2*MARGIN, PAGE_H-80*mm, id="cover")

    doc.addPageTemplates([
        PageTemplate(id="cover", frames=[cover_frame], onPage=draw_cover_background),
        PageTemplate(id="body", frames=[frame], onPage=draw_background),
    ])

    s = make_styles()
    story = []

    # ---- COVER ----
    story.append(Spacer(1, 80*mm))
    story.append(Paragraph(BRAND["product_name"], s["title"]))
    story.append(Spacer(1, 6))
    story.append(Paragraph(BRAND["tagline"], s["subtitle"]))
    story.append(Spacer(1, 30))
    story.append(Paragraph(
        "Egyetlen platform, amit a vendég, a konyha és a tulajdonos egyaránt szeret. "
        "Rendelésfelvétel, menü-kezelés, kapacitás, számlázás, analitika, AI — egy helyen.",
        ParagraphStyle("c", parent=s["body"], textColor=BRAND["text_on_dark"], fontSize=12, leading=18)
    ))
    story.append(NextPageTemplate("body"))
    story.append(PageBreak())

    # ---- PAGE 2: A PROBLÉMA ----
    story.append(Paragraph("A probléma", s["h1"]))
    story.append(panel([
        Paragraph(
            "A magyar kifőzdék és kis éttermek 2026-ban is papíron, Excelben és telefonon dolgoznak. "
            "Az eredmény: elveszett rendelések, túl- vagy alulrendelés, kaotikus ÁFA, "
            "nincs adat a döntésekhez, a vevő pedig minden nap újra felhívja, mi a mai menü.",
            s["body"]),
        Spacer(1, 6),
        Paragraph("Tipikus napi fájdalmak:", s["h3"]),
        *bullet_list([
            "<b>20-50 telefonhívás</b> ebédidőben — egy ember csak ezzel van.",
            "<b>Kézzel írt rendelési lapok</b>, amelyek elvesznek vagy olvashatatlanok.",
            "<b>Túlrendelés vagy elfogyott étel</b> — nincs valós idejű készlet.",
            "<b>Hónap végi ÁFA-rémálom</b> — kupacba gyűjtött nyugták és számlák.",
            "<b>Nincs törzsvendég-program</b>, nincs adat a marketinghez.",
            "<b>Étlap fotók</b> — vagy nincsenek, vagy amatőr mobil képek.",
        ], s),
    ], s))
    story.append(PageBreak())

    # ---- PAGE 3: A MEGOLDÁS ----
    story.append(Paragraph(f"A megoldás: {BRAND['product_name']}", s["h1"]))
    story.append(panel([
        Paragraph(
            f"A {BRAND['product_name']} egy <b>kulcsrakész, brandelhető platform</b>, "
            "amely 1-2 hét alatt élesben van. Webes felület + admin + konyhai kijelző + "
            "automatizált emailek + számlázás + AI — egy rendszerben.",
            s["body"]),
        Spacer(1, 8),
        kpi_row([
            ("13", "modul"),
            ("17", "automatizáció"),
            ("1-2 hét", "bevezetés"),
            ("1 nap", "brand átszínezés"),
        ], s),
    ], s))
    story.append(Spacer(1, 10))
    story.append(Paragraph("3 felhasználói élmény, 1 platform", s["h2"]))
    story.append(Spacer(1, 4))
    for who, what in [
        ("👤 Vendég", "Mobil-first weboldal, 2 kattintásos napi menü rendelés, automatikus email visszaigazolás, átvételi időpont foglalás."),
        ("👨‍🍳 Konyha", "Realtime Kanban kijelző hangjelzéssel, 80mm hőnyomtató, napi összegző kiírás, sold-out toggle."),
        ("👔 Tulajdonos", "Bevétel-/rendelés-grafikonok, AI ár-javaslat, ÁFA Excel export, számla OCR, hulladék-tracking, kapacitás-tervezés."),
    ]:
        story.append(panel([
            Paragraph(who, s["h2"]),
            Paragraph(what, s["body"]),
        ], s, bg=BRAND["bg_panel"]))
        story.append(Spacer(1, 4))
    story.append(PageBreak())

    # ---- PAGE 4: Vevői élmény ----
    story.append(Paragraph("Vevői élmény", s["h1"]))
    story.append(panel([
        Paragraph("Mobil-first, dark mode, prémium tipográfia.", s["body"]),
        *bullet_list([
            "Hero a mai ajánlattal — egy görgetés alatt a vendég látja, mit ehet ma.",
            "Heti naptár-sáv: hétfő-péntek, MA badge, glow effekt.",
            "Kombó (leves + főétel) egyetlen kártyán, fix áron.",
            "EU allergén ikonok (14 db) — törvényi megfelelés.",
            "Cookie consent + GDPR. Élesben verifiziable.",
            "PWA telepíthető — saját ikon a vendég telefonján.",
        ], s),
        Spacer(1, 6),
        screenshot_placeholder("főoldal mobil — hero + mai ajánlat", 75),
    ], s))
    story.append(PageBreak())

    # ---- PAGE 5: Konyhai élmény ----
    story.append(Paragraph("Konyhai élmény", s["h1"]))
    story.append(panel([
        Paragraph("Realtime, hangjelzéses Kanban — a konyhán a tablet vagy a TV mutatja a rendeléseket. "
                  "Egy érintés → státusz vált → vendég email + admin értesítés.", s["body"]),
        *bullet_list([
            "<b>Kanban oszlopok:</b> Új → Készítés alatt → Kész → Átvéve.",
            "<b>Hangjelzés</b> új rendelésnél (audio toast).",
            "<b>80mm / 76mm hőnyomtató</b> formázott nyugta.",
            "<b>Napi összegző</b> — hány adag, mennyi alapanyag.",
            "<b>Sold-out toggle</b> tételenként — azonnal eltűnik a vendőoldalról.",
            "<b>Modifier-ek</b> (↳ jelölés) — pl. „spagetti sajt nélkül”.",
        ], s),
        Spacer(1, 6),
        screenshot_placeholder("konyhai Kanban + KDS nyomtatás", 60),
    ], s))
    story.append(PageBreak())

    # ---- PAGE 6: Tulajdonosi élmény ----
    story.append(Paragraph("Tulajdonosi élmény", s["h1"]))
    story.append(panel([
        Paragraph("Egy dashboard, ahonnan az egész üzletet látod.", s["body"]),
        *bullet_list([
            "<b>Analytics:</b> bevétel, rendelésszám, étlap-népszerűség, vevői heatmap.",
            "<b>AI árazási javaslat</b> (Gemini 3 Flash) — mit emelnél, mit csökkentenél.",
            "<b>Kapacitáskezelés:</b> időslot, sablon, blackout napok, heat coloring.",
            "<b>Számlázás:</b> bejövő/kimenő, ÁFA Excel export, AI OCR fotóból.",
            "<b>Hulladék-tracking:</b> tervezett vs. eladott vs. kidobott adag.",
            "<b>Időjárás-alapú forecast</b> (Open-Meteo) — holnap hány adag kell.",
        ], s),
        Spacer(1, 6),
        screenshot_placeholder("admin dashboard + analytics grafikonok", 60),
    ], s))
    story.append(PageBreak())

    # ---- PAGE 7: AI funkciók ----
    story.append(Paragraph("AI funkciók — mert 2026-ban ez már nem extra", s["h1"]))
    for title, desc in [
        ("🖼️ AI képgenerátor",
         "Egy kattintásra prémium ételfotó generálódik (Gemini 2.5 Flash Image). "
         "Egységes stílus: sötét slate alap, fehér tányér, 45°-os szög."),
        ("🧾 AI számla OCR",
         "Fotózd le a beérkezett számlát — partner, összeg, ÁFA, tételek automatikusan kitöltve."),
        ("💸 AI árazási javaslat",
         "Heti elemzés a forgalomról és ajánlás, mely tételek árát érdemes módosítani."),
        ("🌤️ AI keresletbecslés",
         "Időjárás-előrejelzés + 4 hetes átlag → konkrét darabszám-javaslat holnapra."),
    ]:
        story.append(panel([Paragraph(title, s["h2"]), Paragraph(desc, s["body"])], s))
        story.append(Spacer(1, 4))
    story.append(PageBreak())

    # ---- PAGE 8: Email + jogi compliance ----
    story.append(Paragraph("Email automatizáció + jogi compliance", s["h1"]))
    story.append(panel([
        Paragraph("4 automatikus email-trigger pont, brandelt sablon, BCC admin másolat:", s["body"]),
        *bullet_list([
            "Rendelés visszaigazolás (azonnal)",
            "Készítés alatt (admin status: preparing)",
            "Átvehető (admin status: ready)",
            "Köszönő + értékelés-kérő (completed)",
        ], s),
        Spacer(1, 6),
        Paragraph("Beépített jogi csomag:", s["h3"]),
        *bullet_list([
            "Impresszum, Adatvédelmi nyilatkozat, ÁSZF, Süti tájékoztató",
            "Admin felületen Markdown editorban szerkeszthető (nincs fejlesztői munka)",
            "Cookie consent banner + localStorage",
            "EU 14 allergén kötelező jelölése",
            "GDPR-kompatibilis adatkezelés, audit log minden admin műveletről",
        ], s),
    ], s))
    story.append(PageBreak())

    # ---- PAGE 9: Mobil-first / PWA ----
    story.append(Paragraph("Mobil-first, PWA, push", s["h1"]))
    story.append(panel([
        Paragraph(
            "A vendégek 80%-a mobilról rendel. A platform mobil-first lett tervezve: "
            "4-tab sticky bottom nav, swipeable lightbox, kompakt napi menü grid, "
            "fixed +36 telefon prefix, automatikus dark mode.",
            s["body"]),
        *bullet_list([
            "Telepíthető PWA — saját ikonnal a kezdőképernyőn.",
            "Push notification (VAPID) — új ajánlat / akció.",
            "Service worker — működik gyenge interneten is.",
            "≤2 mp oldalbetöltés mobilon.",
        ], s),
        Spacer(1, 6),
        screenshot_placeholder("mobil főoldal + bottom nav", 60),
    ], s))
    story.append(PageBreak())

    # ---- PAGE 10: Bevezetés ----
    story.append(Paragraph("Bevezetés — 1-2 hét, kulcsrakész", s["h1"]))
    timeline = [
        ("Nap 1-2", "Brand átszínezés — színek, font, logó, domain (1 dict-ből)."),
        ("Nap 3-5", "Étlap import (Excel), kategóriák, allergének, AI képek generálása."),
        ("Nap 6-7", "Email-domain DNS, jogi szövegek finomítás, kupon-beállítás."),
        ("Nap 8-10", "Konyhai tréning (Kanban, KDS, sold-out), admin workshop."),
        ("Nap 11-14", "Soft launch, monitorozás, finomhangolás."),
        ("Folyamatos", "Support, frissítések, új modulok igény szerint."),
    ]
    for when, what in timeline:
        story.append(panel([
            Paragraph(f"<b>{when}</b>", s["h3"]),
            Paragraph(what, s["body"]),
        ], s, bg=BRAND["bg_panel"]))
        story.append(Spacer(1, 3))
    story.append(PageBreak())

    # ---- PAGE 11: Pricing ----
    story.append(Paragraph("Árazási sáv (irányadó)", s["h1"]))
    story.append(panel([
        Paragraph("A pontos árajánlat a kívánt modulok és a brandelés mértéke alapján készül. "
                  "Az alábbi sávok orientáló jellegűek.", s["muted"]),
        Spacer(1, 8),
    ], s))

    pricing_data = [
        ["Csomag", "Egyszeri setup", "Havi licenc", "Mit tartalmaz"],
        ["Starter", "_______ Ft", "_______ Ft / hó",
         "Vendői oldal, étlap, napi ajánlat, kosár, email"],
        ["Pro", "_______ Ft", "_______ Ft / hó",
         "+ Kanban, KDS print, kapacitás, kuponok, analytics"],
        ["Enterprise", "_______ Ft", "_______ Ft / hó",
         "+ AI modulok, számlázás, OCR, push, prioritás támogatás"],
    ]
    pt = Table(pricing_data, colWidths=[28*mm, 32*mm, 32*mm, 80*mm])
    pt.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,0), BRAND["accent"]),
        ("TEXTCOLOR",  (0,0), (-1,0), BRAND["bg_dark"]),
        ("FONTNAME",   (0,0), (-1,0), "Helvetica-Bold"),
        ("BACKGROUND", (0,1), (-1,-1), BRAND["bg_panel"]),
        ("TEXTCOLOR",  (0,1), (-1,-1), BRAND["text_on_dark"]),
        ("FONTNAME",   (0,1), (-1,-1), "Helvetica"),
        ("FONTSIZE",   (0,0), (-1,-1), 9),
        ("VALIGN",     (0,0), (-1,-1), "TOP"),
        ("LEFTPADDING",(0,0), (-1,-1), 6),
        ("RIGHTPADDING",(0,0), (-1,-1), 6),
        ("TOPPADDING", (0,0), (-1,-1), 8),
        ("BOTTOMPADDING",(0,0), (-1,-1), 8),
        ("BOX",        (0,0), (-1,-1), 0.5, BRAND["bg_panel_alt"]),
        ("INNERGRID",  (0,0), (-1,-1), 0.3, BRAND["bg_panel_alt"]),
    ]))
    story.append(pt)
    story.append(Spacer(1, 10))
    story.append(panel([
        Paragraph("Extra modulok (felár):", s["h3"]),
        *bullet_list([
            "Online fizetés (Stripe / SimplePay) integráció",
            "SMS értesítés (Twilio / hazai gateway)",
            "Több telephely / franchise mód",
            "Egyedi AI integráció (étrend-ajánló, chat asszisztens)",
            "Asztalfoglalás modul",
            "SZÉP kártya / utalvány elfogadás",
        ], s),
    ], s))
    story.append(PageBreak())

    # ---- PAGE 12: CTA ----
    story.append(Spacer(1, 40))
    story.append(Paragraph("Kezdjük együtt.", s["title"]))
    story.append(Spacer(1, 10))
    story.append(Paragraph(
        "Egy 30 perces demón megmutatjuk a teljes rendszert élesben, "
        "és az igényeid alapján egy konkrét bevezetési tervet készítünk.",
        s["body"]))
    story.append(Spacer(1, 20))
    story.append(panel([
        Paragraph(f"<b>Kapcsolat:</b> {BRAND['contact']}", s["h2"]),
        Paragraph(f"<b>Vendor:</b> {BRAND['vendor']}", s["body"]),
    ], s))

    doc.build(story)


# ============================================================
# PDF #2 — FEATURE CATALOG
# ============================================================
FEATURES = [
    ("1. Architektúra áttekintés",
     "fejlesztő / IT",
     "skálázható, biztonságos alap",
     [
         "<b>Frontend:</b> React 18 + Vite 5 + TypeScript 5 + Tailwind 3 + shadcn/ui",
         "<b>Backend:</b> Supabase (Postgres + Auth + Storage + Realtime + Edge Functions)",
         "<b>17 Edge Function</b> Deno + TypeScript — auth, email, OCR, AI, cron",
         "<b>RLS</b> minden táblán, role-based access (owner / admin / staff / customer)",
         "<b>Audit log</b> minden admin műveletről (ki, mikor, mit változtatott)",
     ]),
    ("2. Szerepkörök & jogosultság",
     "tulaj + alkalmazottak",
     "biztonság és rugalmasság",
     [
         "<b>Owner</b> — minden, beleértve user-jogosultság kezelést",
         "<b>Admin</b> — minden modul, de nem oszthat új admin-jogot",
         "<b>Staff</b> — csak rendelés-kezelés, KDS, napi nézet (Kanban)",
         "<b>Customer</b> — saját rendelései, favorit, loyalty",
         "<b>Hidden admin</b> — 5 kattintás a logón = login képernyő (titkos belépés)",
     ]),
    ("3. Étlap-kezelés (Master Library)",
     "konyhafőnök, admin",
     "egyszer rögzítve, mindig kéznél",
     [
         "<b>500+ tétel master library</b>, 16 kategóriába rendezve",
         "Excel import (.xlsx) — vesszővel elválasztott allergének automatikus parse",
         "Auto-capitalize a tétel-nevekre (DB-szinten)",
         "Modifier-ek (pl. „extra sajt”, „mártás külön”)",
         "EU 14 allergén ikon kötelező hozzárendelése",
         "AI képgenerátor egyenként vagy batch-ben (Gemini 2.5 Flash Image)",
     ]),
    ("4. Napi ajánlat & kombó",
     "vendég + konyha",
     "klasszikus kifőzde-élmény digitálisan",
     [
         "Hétfő-péntek napi menü (alapból 2200 Ft)",
         "Kombó = leves + főétel (1+1) — automatikusan szinkronizálva, ha 1 leves és 1 főétel van",
         "Á la carte rendelés is támogatva — bármely tétel külön",
         "Fix tételek („mindig elérhető”) — pl. üdítő, savanyúság",
         "Sold-out toggle tételenként — azonnal eltűnik a vendégoldalról",
         "Auto-advance: péntek 16:00 után automatikusan a következő hétfő",
     ]),
    ("5. Kapacitáskezelés",
     "tulaj",
     "nem vállal túl, nincs csalódott vendég",
     [
         "Időslot-ok (15-30 perces bontásban)",
         "Mentett sablonok (pl. „hétköznap”, „pénteki csúcs”)",
         "Blackout napok (ünnep, szabadság)",
         "Heat coloring — vizuálisan látszik, melyik slot kezd betelni",
         "Race-safe foglalás (`update_capacity_slot` SQL függvény)",
     ]),
    ("6. Rendelés-leadás",
     "vendég",
     "2-3 kattintás a megrendelésig",
     [
         "Mobil-optimalizált kosár, deduplikációval (`complete_menu_id_soup_main`)",
         "Kupon-kód validálás real-time (`validate_coupon_code` RPC)",
         "Telefon mező +36 prefix fixen + validáció",
         "Nyitvatartás validáció (`validate_pickup_time` SQL)",
         "„Minél hamarabb” opció zárva-amikor-zárva, csak ütemezett rendelés",
         "Múltbeli rendelés tiltása (3 szintű védelem: UI + edge + DB trigger)",
     ]),
    ("7. Rendelés-kezelés (KDS)",
     "konyha + admin",
     "kaotikus papírkupacból átlátható Kanban",
     [
         "Kanban: Új → Készítés alatt → Kész → Átvéve → Lemondva",
         "Realtime (Supabase Realtime) — új rendelés azonnal a kijelzőn",
         "Hangjelzés (audio toast) új rendelésnél",
         "80mm / 76mm hőnyomtató formázás (CSS @media print)",
         "Napi összegző (mennyi alapanyag kell, hány adag)",
         "Coupon kód zöld jelöléssel a KDS-ben",
     ]),
    ("8. Email automatizáció",
     "vendég + admin",
     "kommunikáció emberi munka nélkül",
     [
         "<b>4 trigger pont:</b> Create, Prepare, Ready, Complete",
         "Saját domain feladó (`rendeles@brand.hu`)",
         "BCC admin másolat minden emailről",
         "Brandelt HTML template (logó, színek, font)",
         "Resend API gateway — naplózott küldés, bounce kezelés",
         "Welcome newsletter feliratkozóknak",
         "Heti étlap newsletter automatikus küldés",
     ]),
    ("9. Számlázás (Invoicing)",
     "tulaj + könyvelő",
     "hónap végi ÁFA-rémálom megszüntetése",
     [
         "Bejövő (költség) + Kimenő (bevétel) + Order receipt (auto-generált)",
         "<b>AI OCR számla-fotóból</b> (Gemini Vision) — partner, összeg, ÁFA, tételek",
         "ÁFA összesítő Excel export (27% / 5% / 0% kulcsok bontva)",
         "Kategória bontás (alapanyag, rezsi, bér, adó, étel értékesítés…)",
         "Recurring invoice — havi fix kiadások auto-rögzítése",
         "Partner CRM (`/admin/partners`) — kapcsolatok adattárában",
         "Order completed → automatikus számla (`create_invoice_on_order_complete` trigger)",
     ]),
    ("10. Analytics",
     "tulaj",
     "adatvezérelt döntések",
     [
         "Bevétel grafikon (napi / heti / havi)",
         "Rendelés-szám trend",
         "Étlap-népszerűség (top-N tételek)",
         "Vevői heatmap (visszatérő vs. új)",
         "Átlagos kosárméret",
         "Kupon-felhasználási riport",
     ]),
    ("11. AI Business Intelligence",
     "tulaj",
     "konzulens helyett AI",
     [
         "<b>Árazási javaslat</b> — Gemini 3 Flash heti riport: mit emelj, mit csökkents",
         "Konkrét tételenkénti javaslat indoklással",
         "Hulladék-arány és margin elemzés",
         "Egy kattintással elfogadva — frissül az étlap",
     ]),
    ("12. Kuponok és kedvezmények",
     "marketing",
     "akció = forgalom",
     [
         "Százalékos vagy fix összegű kedvezmény",
         "Felhasználási limit (összes + per-vevő)",
         "Minimum rendelési érték",
         "Lejárati dátum",
         "Auto-generated loyalty kupon 5 / 10 / 20 rendelés után",
         "Coupon usage tracking (`coupon_usages` tábla)",
     ]),
    ("13. Hulladékkövetés",
     "konyha + tulaj",
     "csökkentett pazarlás",
     [
         "Napi naplózás: tervezett vs. eladott vs. kidobott adag",
         "Tételenkénti bontás",
         "Heti / havi waste arány",
         "Forecasting-be visszacsatolva",
     ]),
    ("14. Forecasting",
     "konyha",
     "holnap pont annyit készíts, amennyi kell",
     [
         "Időjárás-előrejelzés (Open-Meteo, ingyenes)",
         "4 hetes átlag az adott napra",
         "Hulladék-adat figyelembevétele",
         "Konkrét darabszám-javaslat tételenként",
     ]),
    ("15. Loyalty program",
     "marketing",
     "törzsvendég-építés automatikusan",
     [
         "5. rendelés után üdvözlő kupon",
         "10. rendelés után közepes kedvezmény",
         "20. rendelés után VIP kupon",
         "Auto-küldés emailben, kód automatikus generálás",
     ]),
    ("16. PWA & Push notification",
     "vendég",
     "saját app, App Store nélkül",
     [
         "Telepíthető PWA (manifest + service worker)",
         "Saját ikon a kezdőképernyőn",
         "Offline-fallback statikus oldalakhoz",
         "Web Push (VAPID) — új ajánlat, akció",
         "Opt-in onboarding (engedélykérés)",
     ]),
    ("17. Gallery & Branding",
     "marketing",
     "professzionális megjelenés",
     [
         "2 kategória: Ételek + Éttermünk",
         "Multi upload, batch kategorizálás",
         "Swipeable lightbox (mobil-friendly)",
         "ACAIA-inspirált design, rounded-3xl",
         "Lazy loading, optimalizált képek",
     ]),
    ("18. Tartalomszerkesztő",
     "admin (nem fejlesztő)",
     "önkiszolgáló tartalomkezelés",
     [
         "About oldal — JSON-alapú szekciók szerkesztő",
         "Jogi oldalak (Impresszum / ÁSZF / Adatvédelmi / Süti) — Markdown editor",
         "FAQ — kérdés-válasz párok CRUD",
         "Announcement editor v2 — banner képpel, smart CTA linkkel",
         "Newsletter szerkesztő — heti étlap kiküldés",
     ]),
    ("19. Dokumentumtár (Brand Drive)",
     "admin + staff",
     "közös tudásbázis",
     [
         "Mappa-struktúra, drag & drop upload",
         "Automatikus verziókezelés (ugyanaz a név → új verzió)",
         "Színes címkék, csillagozás",
         "Ékezet-független keresés (név + leírás + címke)",
         "Tömeges műveletek (áthelyezés, törlés)",
         "Privát Supabase Storage bucket, csak admin/staff RLS",
     ]),
    ("20. Audit log",
     "tulaj",
     "ki mit változtatott — bizonyíték",
     [
         "Minden admin művelet rögzítve (INSERT/UPDATE/DELETE)",
         "Actor user_id + email + name",
         "Before/after JSON snapshot",
         "Changed fields lista",
         "Modul-szintű csoportosítás",
         "Részletes detail dialog",
     ]),
    ("21. Multi-format image generator",
     "marketing",
     "social media tartalom 1 kattintással",
     [
         "Mai napi ajánlat → Facebook post (1200×630)",
         "→ Instagram post (1080×1080)",
         "→ Instagram story (1080×1920)",
         "Brand watermark automatikusan",
         "Letöltés vagy direkt megosztás",
     ]),
    ("22. Biztonság & GDPR",
     "tulaj",
     "törvényi compliance bizonyítottan",
     [
         "RLS minden táblán, role-based hozzáférés",
         "Audit log a teljes admin tevékenységről",
         "Cookie consent banner localStorage-vel",
         "EU 14 allergén kötelező jelölés",
         "Privát Storage bucket-ok (documents, invoices)",
         "Service role kulcs csak edge function-ben, soha frontenden",
         "JWT validáció minden edge function-ben",
     ]),
    ("23. Whitelabel & testreszabás",
     "vendor + új partner",
     "1 nap alatt új brand",
     [
         "Színek: index.css HSL token-ek (primary, accent, bg)",
         "Font: Google Fonts vagy egyedi @font-face",
         "Logó: SVG csere 1 fájlban",
         "Domain: custom domain support (Cloudflare DNS)",
         "Email: saját domain feladó (DNS DKIM/SPF)",
         "PDF generator: BRAND dict — ez a dokumentum is így készült",
     ]),
    ("24. Onboarding & support",
     "új partner",
     "nem maradsz egyedül a bevezetés után",
     [
         "1-2 hetes bevezetési projekt",
         "Konyhai tréning + admin workshop",
         "Email + Slack support",
         "Havi feature-frissítés (új modulok díjmentesen, ha általánosak)",
         "Egyedi fejlesztés óradíjas vagy projekt-alapon",
     ]),
]


def build_feature_catalog(path):
    doc = BaseDocTemplate(path, pagesize=A4,
                          leftMargin=MARGIN, rightMargin=MARGIN,
                          topMargin=25*mm, bottomMargin=20*mm,
                          title=f"{BRAND['product_name']} — Feature Catalog",
                          author=BRAND["vendor"])

    frame = Frame(MARGIN, 18*mm, PAGE_W-2*MARGIN, PAGE_H-43*mm, id="body")
    cover_frame = Frame(MARGIN, 40*mm, PAGE_W-2*MARGIN, PAGE_H-80*mm, id="cover")

    doc.addPageTemplates([
        PageTemplate(id="cover", frames=[cover_frame], onPage=draw_cover_background),
        PageTemplate(id="body", frames=[frame], onPage=draw_background),
    ])

    s = make_styles()
    story = []

    # ---- COVER ----
    story.append(Spacer(1, 80*mm))
    story.append(Paragraph(BRAND["product_name"], s["title"]))
    story.append(Spacer(1, 6))
    story.append(Paragraph("Feature Catalog", s["subtitle"]))
    story.append(Spacer(1, 30))
    story.append(Paragraph(
        "Részletes modul-katalógus minden funkcióval, célközönséggel és üzleti értékkel. "
        "Onboardingra, partner-prezentációra és technikai értékelésre.",
        ParagraphStyle("c", parent=s["body"], textColor=BRAND["text_on_dark"], fontSize=12, leading=18)
    ))
    story.append(NextPageTemplate("body"))
    story.append(PageBreak())

    # ---- TOC ----
    story.append(Paragraph("Tartalomjegyzék", s["h1"]))
    toc_rows = []
    for f in FEATURES:
        toc_rows.append([Paragraph(f[0], ParagraphStyle("t", fontName="Helvetica",
                                                        fontSize=10, textColor=BRAND["text_on_dark"]))])
    toc_rows.append([Paragraph("<b>25. Esettanulmány — Kiscsibe Étterem</b>",
                               ParagraphStyle("t", fontName="Helvetica-Bold",
                                              fontSize=10, textColor=BRAND["accent"]))])
    tt = Table(toc_rows, colWidths=[PAGE_W-2*MARGIN])
    tt.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,-1), BRAND["bg_panel"]),
        ("BOX", (0,0), (-1,-1), 0.5, BRAND["bg_panel_alt"]),
        ("LEFTPADDING", (0,0), (-1,-1), 12),
        ("RIGHTPADDING", (0,0), (-1,-1), 12),
        ("TOPPADDING", (0,0), (-1,-1), 6),
        ("BOTTOMPADDING", (0,0), (-1,-1), 6),
        ("ROWBACKGROUNDS", (0,0), (-1,-1), [BRAND["bg_panel"], BRAND["bg_panel_alt"]]),
    ]))
    story.append(tt)
    story.append(PageBreak())

    # ---- FEATURE PAGES ----
    for i, (title, who, value, items) in enumerate(FEATURES):
        story.append(feature_block(title, who, value, items, s,
                                   screenshot_label=title.split(".")[1].strip().lower() if "." in title else None))
        story.append(Spacer(1, 8))
        # break every 2 features
        if (i+1) % 2 == 0:
            story.append(PageBreak())

    if len(FEATURES) % 2 != 0:
        story.append(PageBreak())

    # ---- CASE STUDY ----
    cs = BRAND["case_study"]
    story.append(Paragraph("25. Esettanulmány — Kiscsibe Étterem", s["h1"]))
    story.append(panel([
        Paragraph(f"<b>{cs['name']}</b> · {cs['location']}", s["h2"]),
        Paragraph(f"<i>„{cs['tagline']}”</i>", s["muted"]),
        Spacer(1, 6),
        Paragraph(
            "A Kiscsibe egy budapesti, hétköznap üzemelő reggeliző és kifőzde. "
            "A klasszikus magyaros házi-koszt mellé egy 2026-os, mobil-first digitális "
            "élményt akartak — papíros rendelési lap és Excel helyett. "
            "A teljes rendszer ezen az alapon épült fel, és élő referenciaként szolgál "
            "minden új partner számára.",
            s["body"]),
        Spacer(1, 8),
        Paragraph("Eredmény számokban", s["h3"]),
        kpi_row(cs["stats"][:3], s),
        Spacer(1, 6),
        kpi_row(cs["stats"][3:], s),
    ], s))
    story.append(Spacer(1, 10))
    story.append(panel([
        Paragraph("Brand-megjelenés", s["h3"]),
        Paragraph(
            f"Sötét navy alap (#1F2A41), arany accent (#F6C22D), krém szöveg (#FFF8E6). "
            f"Sofia Sans heading, sans-serif body. Domain: <b>{cs['url']}</b>. "
            f"PWA telepíthető, push notification engedélyezve. Hidden admin a 5x logó "
            "kattintással. Hétköznap-only branding (szombat-vasárnap zárva).",
            s["body"]),
        Spacer(1, 6),
        Paragraph("Mely modulok használtak élesben", s["h3"]),
        *bullet_list([
            "Étlap (776 tétel), napi ajánlat, fix tételek",
            "Rendelés-leadás, Kanban, KDS print, automatizált email",
            "Kapacitás, kuponok, hulladék-tracking",
            "Számlázás, partner CRM, ÁFA export",
            "AI képgenerátor (Gemini), AI számla OCR, AI árazás",
            "Galéria, dinamikus jogi szövegek, FAQ, announcement popup",
            "Audit log, dokumentumtár (Brand Drive)",
        ], s),
    ], s))
    story.append(PageBreak())

    # ---- BACK COVER ----
    story.append(Spacer(1, 60))
    story.append(Paragraph(f"Kérdés?", s["title"]))
    story.append(Spacer(1, 10))
    story.append(Paragraph(BRAND["contact"], s["h2"]))
    story.append(Spacer(1, 30))
    story.append(panel([
        Paragraph(f"{BRAND['product_name']} — {BRAND['tagline']}", s["body"]),
        Paragraph(f"© 2026 {BRAND['vendor']}. Whitelabel — minden partner brandjére átszínezhető.",
                  s["muted"]),
    ], s))

    doc.build(story)


# ============================================================
# MAIN
# ============================================================
if __name__ == "__main__":
    sales_path = os.path.join(OUTPUT_DIR, "RestaurantOS_SalesDeck.pdf")
    catalog_path = os.path.join(OUTPUT_DIR, "RestaurantOS_FeatureCatalog.pdf")

    print(f"Building sales deck → {sales_path}")
    build_sales_deck(sales_path)
    print(f"Building feature catalog → {catalog_path}")
    build_feature_catalog(catalog_path)
    print("Done.")
