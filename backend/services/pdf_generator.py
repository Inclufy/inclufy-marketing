from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from io import BytesIO
from datetime import datetime

def generate_blueprint_pdf(blueprint_data: dict) -> BytesIO:
    """Generate comprehensive Growth Blueprint PDF"""
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=2*cm, leftMargin=2*cm, topMargin=2*cm, bottomMargin=2*cm)
    
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle('CustomTitle', parent=styles['Heading1'], fontSize=24, textColor=colors.HexColor('#7C3AED'), alignment=TA_CENTER, spaceAfter=30)
    heading_style = ParagraphStyle('CustomHeading', parent=styles['Heading2'], fontSize=16, textColor=colors.HexColor('#7C3AED'), spaceAfter=12, spaceBefore=20)
    
    story = []
    
    # Title Page
    story.append(Paragraph("Inclufy Growth Blueprint™", title_style))
    story.append(Spacer(1, 0.5*cm))
    story.append(Paragraph(f"<b>{blueprint_data['blueprint']['company_name']}</b>", styles['Heading2']))
    story.append(Paragraph(f"Generated: {datetime.now().strftime('%d %B %Y')}", styles['Normal']))
    story.append(Spacer(1, 1*cm))
    
    # Executive Summary
    overall_score = blueprint_data['blueprint'].get('overall_score', 0)
    story.append(Paragraph("Executive Summary", heading_style))
    
    summary_data = [
        ['Marketing Health Score', f"{overall_score}/100"],
        ['Website Quality', f"{blueprint_data.get('status_quo', {}).get('website_score', 0)}%"],
        ['SEO Performance', f"{blueprint_data.get('status_quo', {}).get('seo_score', 0)}%"],
        ['Content Quality', f"{blueprint_data.get('status_quo', {}).get('content_score', 0)}%"],
        ['Social Media', f"{blueprint_data.get('status_quo', {}).get('social_score', 0)}%"],
    ]
    
    summary_table = Table(summary_data, colWidths=[10*cm, 5*cm])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F3F4F6')),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
        ('ALIGN', (1, 0), (-1, -1), 'RIGHT'),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 12),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ('GRID', (0, 0), (-1, -1), 1, colors.white)
    ]))
    story.append(summary_table)
    story.append(Spacer(1, 1*cm))
    
    # Strengths
    status_quo = blueprint_data.get('status_quo')
    if status_quo and status_quo.get('strengths'):
        story.append(Paragraph("Sterktes", heading_style))
        for strength in status_quo['strengths']:
            story.append(Paragraph(f"✓ {strength}", styles['Normal']))
            story.append(Spacer(1, 0.2*cm))
        story.append(Spacer(1, 0.5*cm))
    
    # Weaknesses
    if status_quo and status_quo.get('weaknesses'):
        story.append(Paragraph("Zwaktes", heading_style))
        for weakness in status_quo['weaknesses']:
            story.append(Paragraph(f"• {weakness}", styles['Normal']))
            story.append(Spacer(1, 0.2*cm))
        story.append(Spacer(1, 0.5*cm))
    
    # Page Break
    story.append(PageBreak())
    
    # Recommendations
    story.append(Paragraph("Aanbevolen Acties", heading_style))
    recommendations = blueprint_data.get('recommendations', [])
    for i, rec in enumerate(recommendations[:5], 1):
        story.append(Paragraph(f"<b>{i}. {rec['title']}</b> ({rec['priority']})", styles['Heading3']))
        story.append(Paragraph(rec['description'], styles['Normal']))
        story.append(Paragraph(f"Impact: {rec['impact_score']}/10 | Effort: {rec['effort_score']}/10 | Timeline: {rec.get('estimated_timeline_days', 'N/A')} days", styles['Italic']))
        story.append(Spacer(1, 0.5*cm))
    
    # Opportunities
    if blueprint_data.get('opportunities'):
        story.append(PageBreak())
        story.append(Paragraph("Kansen", heading_style))
        for opp in blueprint_data['opportunities']:
            story.append(Paragraph(f"<b>{opp['title']}</b>", styles['Heading3']))
            story.append(Paragraph(opp['description'], styles['Normal']))
            if opp.get('potential_value'):
                story.append(Paragraph(f"Potentiële waarde: {opp['potential_value']}", styles['Italic']))
            story.append(Spacer(1, 0.5*cm))
    
    # Threats
    if blueprint_data.get('threats'):
        story.append(Paragraph("Bedreigingen", heading_style))
        for threat in blueprint_data['threats']:
            story.append(Paragraph(f"<b>{threat['title']}</b> (Severity: {threat['severity']})", styles['Heading3']))
            story.append(Paragraph(threat['description'], styles['Normal']))
            if threat.get('mitigation_strategy'):
                story.append(Paragraph(f"Mitigatie: {threat['mitigation_strategy']}", styles['Italic']))
            story.append(Spacer(1, 0.5*cm))
    
    # Footer
    story.append(Spacer(1, 2*cm))
    story.append(Paragraph("Generated by Inclufy Growth Blueprint™", styles['Italic']))
    story.append(Paragraph("Powered by AI", styles['Italic']))
    
    doc.build(story)
    buffer.seek(0)
    return buffer
