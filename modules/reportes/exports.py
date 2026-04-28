"""
modules/reportes/exports.py
────────────────────────────────────────────────────────────────
Generación de archivos PDF (ReportLab) y Excel (OpenPyXL).
"""
from io import BytesIO
from reportlab.lib.pagesizes import letter, A4
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer

def generar_ticket_pdf(venta) -> bytes:
    """Genera un PDF estilo ticket para una venta."""
    buffer = BytesIO()
    p = canvas.Canvas(buffer, pagesize=(200, 400)) # Tamaño ticket
    
    p.setFont("Helvetica-Bold", 10)
    p.drawCentredString(100, 380, f"{venta.empresa.nombre}")
    p.setFont("Helvetica", 8)
    p.drawCentredString(100, 370, f"Comprobante: {venta.numero_comprobante}")
    p.drawCentredString(100, 360, f"Fecha: {venta.fecha.strftime('%d/%m/%Y %H:%M')}")
    
    p.line(10, 350, 190, 350)
    
    y = 335
    p.drawString(10, y, "Producto")
    p.drawRightString(190, y, "Total")
    
    p.setFont("Helvetica", 7)
    for item in venta.items.all():
        y -= 12
        p.drawString(10, y, f"{item.producto.nombre[:20]} x{item.cantidad}")
        p.drawRightString(190, y, f"{item.subtotal}")
        if y < 50: break # Evitar desborde para el ejemplo
    
    p.line(10, y-5, 190, y-5)
    p.setFont("Helvetica-Bold", 10)
    p.drawString(10, y-20, "TOTAL:")
    p.drawRightString(190, y-20, f"${venta.total}")
    
    p.showPage()
    p.save()
    return buffer.getvalue()

def generar_cierre_caja_pdf(caja, resumen) -> bytes:
    """Genera un PDF formal de cierre de caja (Arqueo)."""
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    styles = getSampleStyleSheet()
    elements = []

    elements.append(Paragraph(f"CIERRE DE CAJA #{caja.id}", styles['Title']))
    elements.append(Paragraph(f"Empresa: {caja.empresa.nombre}", styles['Normal']))
    elements.append(Paragraph(f"Usuario: {caja.usuario_apertura.nombre_completo}", styles['Normal']))
    elements.append(Paragraph(f"Fecha Apertura: {caja.fecha_apertura.strftime('%d/%m/%Y %H:%M')}", styles['Normal']))
    elements.append(Paragraph(f"Fecha Cierre: {caja.fecha_cierre.strftime('%d/%m/%Y %H:%M')}", styles['Normal']))
    elements.append(Spacer(1, 12))

    data = [
        ["Concepto", "Monto"],
        ["Saldo Inicial", f"$ {caja.saldo_inicial}"],
        ["Ventas Totales", f"$ {resumen['total_ventas']}"],
        ["Ingresos Manuales", f"$ {resumen['total_ingresos']}"],
        ["Egresos Manuales", f"$ {resumen['total_egresos']}"],
        ["Saldo Esperado (Sistema)", f"$ {caja.saldo_final_calculado}"],
        ["Saldo Declarado", f"$ {caja.saldo_final_declarado}"],
        ["Diferencia (Sobrante/Faltante)", f"$ {caja.diferencia}"],
    ]

    t = Table(data, colWidths=[300, 100])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    elements.append(t)
    
    doc.build(elements)
    return buffer.getvalue()
