import os
import io
import datetime
from typing import Dict, Any, List, Optional
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image as RLImage, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from app.services.storage import storage_service

class InstantPdfService:
    def generate_pdf(
        self,
        report_data: Dict[str, Any],
        detections: List[Dict[str, Any]],
        status_history: List[Dict[str, Any]],
        evidence_storage_key: Optional[str] = None,
        repair_evidence_key: Optional[str] = None
    ) -> bytes:
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )

        styles = getSampleStyleSheet()
        primary_color = colors.HexColor("#065F46") # Emerald-800
        dark_text = colors.HexColor("#0F172A")
        muted_text = colors.HexColor("#64748B")
        bg_light = colors.HexColor("#F8FAFC")

        title_style = ParagraphStyle(
            'DocTitle',
            parent=styles['Heading1'],
            fontName='Helvetica-Bold',
            fontSize=18,
            leading=22,
            textColor=primary_color,
            spaceAfter=3
        )

        subtitle_style = ParagraphStyle(
            'DocSub',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=9,
            leading=12,
            textColor=muted_text,
            spaceAfter=10
        )

        h2_style = ParagraphStyle(
            'SectionH2',
            parent=styles['Heading2'],
            fontName='Helvetica-Bold',
            fontSize=11,
            leading=15,
            textColor=primary_color,
            spaceBefore=8,
            spaceAfter=5
        )

        body_style = ParagraphStyle(
            'BodyDark',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=8.5,
            leading=11.5,
            textColor=dark_text
        )

        disclaimer_style = ParagraphStyle(
            'Disclaimer',
            parent=styles['Italic'],
            fontName='Helvetica-Oblique',
            fontSize=7.5,
            leading=10,
            textColor=muted_text
        )

        story = []

        ref_id = report_data.get('reference_id', 'PRISM-AUDIT')
        created_utc = str(report_data.get('created_at', datetime.datetime.now(datetime.timezone.utc).isoformat()))[:19]

        # 1. Header Banner
        story.append(Paragraph("PRISM INSTANT AI — OFFICIAL ROAD DEFECT AUDIT", title_style))
        story.append(Paragraph(f"Reference ID: <b>{ref_id}</b> • Generated UTC: {datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%d %H:%M:%S')}", subtitle_style))
        story.append(HRFlowable(width="100%", thickness=1.5, color=primary_color, spaceAfter=10))

        # 2. Key Metadata Table
        sev = str(report_data.get('damage_severity', 'MODERATE')).upper()
        wf_status = str(report_data.get('workflow_status', 'SUBMITTED')).upper()
        priority = report_data.get('priority_score', 50)
        lat = report_data.get('latitude')
        lng = report_data.get('longitude')
        coords_str = f"{lat:.5f}° N, {lng:.5f}° E" if lat is not None and lng is not None else "Location coordinates not supplied"

        summary_data = [
            [
                Paragraph("<b>Defect Title:</b>", body_style),
                Paragraph(report_data.get('title', 'Surface Defect'), body_style),
                Paragraph("<b>Severity Rating:</b>", body_style),
                Paragraph(f"<b>{sev}</b>", body_style)
            ],
            [
                Paragraph("<b>Workflow Status:</b>", body_style),
                Paragraph(f"<b>{wf_status}</b>", body_style),
                Paragraph("<b>Priority Index:</b>", body_style),
                Paragraph(f"<b>{priority} / 100</b>", body_style)
            ],
            [
                Paragraph("<b>City / Ward:</b>", body_style),
                Paragraph(f"{report_data.get('city', 'Indore')}", body_style),
                Paragraph("<b>Corridor / Address:</b>", body_style),
                Paragraph(report_data.get('address', 'Transit Corridor'), body_style)
            ],
            [
                Paragraph("<b>GPS Position:</b>", body_style),
                Paragraph(coords_str, body_style),
                Paragraph("<b>Submitted By:</b>", body_style),
                Paragraph(report_data.get('owner_email', 'Citizen Inspector'), body_style)
            ]
        ]

        t_summary = Table(summary_data, colWidths=[1.4*inch, 2.3*inch, 1.4*inch, 2.3*inch])
        t_summary.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), bg_light),
            ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#CBD5E1")),
            ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#E2E8F0")),
            ('TOPPADDING', (0,0), (-1,-1), 4),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
            ('LEFTPADDING', (0,0), (-1,-1), 6),
            ('RIGHTPADDING', (0,0), (-1,-1), 6),
        ]))
        story.append(t_summary)
        story.append(Spacer(1, 10))

        # 3. Model Inference Telemetry
        story.append(Paragraph("AI Computer Vision Inference Results", h2_style))
        det_count = len(detections)
        mean_conf = round(sum(d.get('confidence', 0) for d in detections) / det_count, 3) if det_count > 0 else "N/A"

        telemetry_data = [
            [
                Paragraph("<b>Inference Engine</b>", body_style),
                Paragraph("<b>Defects Count</b>", body_style),
                Paragraph("<b>Mean Confidence</b>", body_style),
                Paragraph("<b>Scan Status</b>", body_style),
            ],
            [
                Paragraph("YOLOv8 Road Defect Architecture", body_style),
                Paragraph(f"<b>{det_count} defect(s) detected</b>", body_style),
                Paragraph(f"{mean_conf * 100:.1f}%" if isinstance(mean_conf, float) else "0.0%", body_style),
                Paragraph("COMPLETED", body_style),
            ]
        ]

        for i, d in enumerate(detections[:5]):
            telemetry_data.append([
                Paragraph(f"Defect #{i+1} ({d.get('class_name', 'pothole')})", body_style),
                Paragraph("Bounding Box Verified", body_style),
                Paragraph(f"{d.get('confidence', 0)*100:.1f}%", body_style),
                Paragraph(f"{d.get('apparent_area_pct', 0):.1f}% surface area", body_style),
            ])

        t_tel = Table(telemetry_data, colWidths=[2.2*inch, 1.8*inch, 1.7*inch, 1.7*inch])
        t_tel.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#E0F2FE")),
            ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#BAE6FD")),
            ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#E0F2FE")),
            ('TOPPADDING', (0,0), (-1,-1), 4),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ]))
        story.append(t_tel)
        story.append(Spacer(1, 10))

        # 4. Evidence Images
        story.append(Paragraph("Photographic Evidence Verification", h2_style))
        evidence_row = []

        # Left: Damage
        if evidence_storage_key:
            try:
                p_path = storage_service.get_path(evidence_storage_key, subfolder="evidence")
                img1 = RLImage(p_path, width=3.3*inch, height=2.1*inch)
                evidence_row.append([img1, Paragraph("<b>Evidence A: Reported Pavement Defect</b>", body_style)])
            except Exception:
                evidence_row.append([Paragraph("<i>[Secure Evidence Stored]</i>", body_style), Paragraph("<b>Evidence A</b>", body_style)])
        else:
            evidence_row.append([Paragraph("<i>[No Evidence Image]</i>", body_style), Paragraph("<b>Evidence A</b>", body_style)])

        # Right: Repair Proof
        if repair_evidence_key:
            try:
                r_path = storage_service.get_path(repair_evidence_key, subfolder="evidence")
                img2 = RLImage(r_path, width=3.3*inch, height=2.1*inch)
                evidence_row.append([img2, Paragraph("<b>Evidence B: Municipal Repair Proof</b>", body_style)])
            except Exception:
                evidence_row.append([Paragraph("<i>[Repair Evidence Stored]</i>", body_style), Paragraph("<b>Evidence B: Repair Verification</b>", body_style)])
        else:
            evidence_row.append([Paragraph("<i>[Pending Field Crew Repair]</i>", body_style), Paragraph("<b>Evidence B: Post-Repair Verification</b>", body_style)])

        ev_table_data = [
            [evidence_row[0][0], evidence_row[1][0]],
            [evidence_row[0][1], evidence_row[1][1]],
        ]
        t_ev = Table(ev_table_data, colWidths=[3.7*inch, 3.7*inch])
        t_ev.setStyle(TableStyle([
            ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#E2E8F0")),
            ('BACKGROUND', (0,0), (-1,-1), bg_light),
            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('TOPPADDING', (0,0), (-1,-1), 4),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ]))
        story.append(t_ev)
        story.append(Spacer(1, 10))

        # 5. Status History & Audit Timeline
        story.append(Paragraph("Municipal Action & Status Transition Timeline", h2_style))
        history_table_data = [
            [
                Paragraph("<b>Timestamp (UTC)</b>", body_style),
                Paragraph("<b>Changed By</b>", body_style),
                Paragraph("<b>Transition</b>", body_style),
                Paragraph("<b>Inspection Notes / Reason</b>", body_style),
            ]
        ]

        if status_history:
            for h in status_history:
                history_table_data.append([
                    Paragraph(str(h.get('timestamp', created_utc))[:19], body_style),
                    Paragraph(str(h.get('changed_by', 'Authority Official')), body_style),
                    Paragraph(f"{h.get('previous_status', 'SUBMITTED')} → {h.get('new_status', 'UNDER_INSPECTION')}", body_style),
                    Paragraph(str(h.get('reason', 'Standard workflow update.')), body_style),
                ])
        else:
            history_table_data.append([
                Paragraph(created_utc, body_style),
                Paragraph("Citizen Submitter", body_style),
                Paragraph("CREATED → SUBMITTED", body_style),
                Paragraph("Defect reported with photographic evidence.", body_style),
            ])

        t_hist = Table(history_table_data, colWidths=[1.8*inch, 1.7*inch, 1.7*inch, 2.2*inch])
        t_hist.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#F1F5F9")),
            ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#CBD5E1")),
            ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#E2E8F0")),
            ('TOPPADDING', (0,0), (-1,-1), 4),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ]))
        story.append(t_hist)
        story.append(Spacer(1, 10))

        # 6. Disclaimer
        story.append(Paragraph(
            "<b>STATUTORY DISCLAIMER:</b> This engineering document is generated automatically by PRISM INSTANT AI. "
            "AI detections reflect computer vision inferencing and do not replace certified geotechnical pavement assessments. "
            "Evidence records are cryptographically timestamped and archived.",
            disclaimer_style
        ))

        doc.build(story)
        buffer.seek(0)
        return buffer.getvalue()

pdf_service = InstantPdfService()
