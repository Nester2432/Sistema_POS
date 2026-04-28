"""
apps/empresas/serializers.py
"""
from rest_framework import serializers
from .models import Empresa, TipoDocumentoChoices, PlanChoices


class EmpresaSerializer(serializers.ModelSerializer):
    moneda = serializers.ReadOnlyField()
    igv = serializers.ReadOnlyField()
    es_enterprise = serializers.ReadOnlyField()

    class Meta:
        model = Empresa
        fields = [
            "id", "nombre", "slug",
            "tipo_documento", "documento_fiscal",
            "email_contacto", "telefono", "direccion",
            "logo", "plan", "activo", "config",
            "moneda", "igv", "es_enterprise",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "slug", "created_at", "updated_at"]


class EmpresaResumenSerializer(serializers.ModelSerializer):
    """Serializer ligero para incluir en payload JWT y relaciones."""

    class Meta:
        model = Empresa
        fields = ["id", "nombre", "slug", "plan", "moneda", "tipo_documento"]


class EmpresaCreateSerializer(serializers.ModelSerializer):
    """Para crear empresas desde la plataforma SaaS (superadmin)."""

    class Meta:
        model = Empresa
        fields = [
            "nombre", "tipo_documento", "documento_fiscal",
            "email_contacto", "telefono", "direccion",
            "logo", "plan", "config",
        ]

    def validate(self, attrs):
        # Verificar unicidad de tipo_documento + documento_fiscal
        tipo = attrs.get("tipo_documento")
        doc = attrs.get("documento_fiscal")
        if Empresa.objects.with_deleted().filter(
            tipo_documento=tipo, documento_fiscal=doc
        ).exists():
            raise serializers.ValidationError({
                "documento_fiscal": "Ya existe una empresa con este documento fiscal."
            })
        return attrs
