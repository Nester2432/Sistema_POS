"""
modules/ventas/services_pdf.py
────────────────────────────────────────────────────────────────
Servicio profesional para generación de tickets de venta en PDF.
Optimizado para impresoras térmicas de 80mm.
"""
import qrcode
from io import BytesIO
from decimal import Decimal
from django.utils import timezone
from reportlab.lib.pagesizes import mm
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT

def generar_ticket_pdf(venta) -> bytes:
    """
    Genera un PDF profesional optimizado para impresoras térmicas de 80mm.
    El ancho es fijo (80mm) y el largo es dinámico según contenido.
    """
    buffer = BytesIO()
    
    # Configuración de ancho (80mm)
    width = 80 * mm
    # Altura inicial (se ajustará con Platypus)
    doc = SimpleDocTemplate(
        buffer,
        pagesize=(width, 500 * mm), # Altura máxima generosa, Platypus ajustará al contenido
        rightMargin=2 * mm,
        leftMargin=2 * mm,
        topMargin=5 * mm,
        bottomMargin=5 * mm
    )

    styles = getSampleStyleSheet()
    
    # Estilos personalizados para ticket térmico
    style_header = ParagraphStyle(
        'Header',
        parent=styles['Normal'],
        fontSize=10,
        leading=12,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold'
    )
    
    style_normal = ParagraphStyle(
        'NormalSmall',
        parent=styles['Normal'],
        fontSize=8,
        leading=10,
        alignment=TA_LEFT
    )

    style_bold = ParagraphStyle(
        'NormalBold',
        parent=style_normal,
        fontName='Helvetica-Bold'
    )

    style_right = ParagraphStyle(
        'NormalRight',
        parent=style_normal,
        alignment=TA_RIGHT
    )

    elements = []

    # ─── ENCABEZADO ───
    elements.append(Paragraph(venta.empresa.nombre.upper(), style_header))
    if hasattr(venta, 'sucursal') and venta.sucursal:
        elements.append(Paragraph(f"Sucursal: {venta.sucursal.nombre}", style_normal))
    
    elements.append(Paragraph(f"Fecha: {venta.fecha.strftime('%d/%m/%Y %H:%M')}", style_normal))
    elements.append(Paragraph(f"Comprobante: {venta.numero_comprobante}", style_bold))
    elements.append(Paragraph(f"Cliente: {venta.cliente_nombre}", style_normal))
    if venta.cliente_documento:
        elements.append(Paragraph(f"Doc: {venta.cliente_documento}", style_normal))
    
    elements.append(Spacer(1, 3 * mm))
    elements.append(Paragraph("-" * 45, style_normal)) # Separador visual

    # ─── TABLA DE PRODUCTOS ───
    # Definición de columnas: Cant, Producto, Subtotal
    data = [["CANT", "PRODUCTO", "TOTAL"]]
    
    for item in venta.items.all():
        nombre_prod = item.producto.nombre
        if item.variante:
            valores = "/".join([v.valor_nombre for v in item.variante.valores_detalle])
            nombre_prod += f" ({valores})"
            
        data.append([
            f"{int(item.cantidad)}",
            Paragraph(nombre_prod, style_normal),
            f"${float(item.subtotal):,.2f}"
        ])

    # Estilo de tabla minimalista para ticket
    table = Table(data, colWidths=[10 * mm, 45 * mm, 20 * mm])
    table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 7),
        ('ALIGN', (0, 0), (0, -1), 'LEFT'),
        ('ALIGN', (2, 0), (2, -1), 'RIGHT'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 1),
        ('TOPPADDING', (0, 0), (-1, -1), 1),
    ]))
    elements.append(table)
    
    elements.append(Paragraph("-" * 45, style_normal))

    # ─── TOTALES ───
    total_data = [
        ["SUBTOTAL:", f"${float(venta.subtotal):,.2f}"],
        ["DESCUENTO:", f"-${float(venta.descuento_total):,.2f}"],
        ["TOTAL:", f"${float(venta.total):,.2f}"]
    ]
    
    t_total = Table(total_data, colWidths=[45 * mm, 30 * mm])
    t_total.setStyle(TableStyle([
        ('FONTNAME', (0, 2), (-1, 2), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('ALIGN', (0, 0), (-1, -1), 'RIGHT'),
    ]))
    elements.append(t_total)
    
    elements.append(Spacer(1, 4 * mm))

    # ─── DESGLOSE DE PAGOS ───
    elements.append(Paragraph("FORMA DE PAGO", style_bold))
    for pago in venta.pagos.all():
        elements.append(Paragraph(
            f"{pago.get_metodo_pago_display()}: ${float(pago.monto):,.2f}", 
            style_normal
        ))
    
    elements.append(Spacer(1, 5 * mm))

    # ─── QR (OPCIONAL PRO) ───
    qr_content = f"Venta:{venta.id}|Total:{venta.total}|Fecha:{venta.fecha.isoformat()}"
    qr = qrcode.QRCode(version=1, box_size=2, border=0)
    qr.add_data(qr_content)
    qr.make(fit=True)
    img_qr = qr.make_image(fill_color="black", back_color="white")
    
    qr_buffer = BytesIO()
    img_qr.save(qr_buffer, format='PNG')
    qr_buffer.seek(0)
    
    qr_image = Image(qr_buffer, width=25 * mm, height=25 * mm)
    qr_image.hAlign = 'CENTER'
    elements.append(qr_image)

    # ─── PIE DE PÁGINA ───
    elements.append(Spacer(1, 3 * mm))
    elements.append(Paragraph("GRACIAS POR SU COMPRA", style_header))
    elements.append(Paragraph("SISTEMA POS SAAS", style_normal))
    
    # Generar PDF
    doc.build(elements)
    
    return buffer.getvalue()
