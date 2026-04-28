"""
apps/usuarios/serializers.py
────────────────────────────────────────────────────────────────
JWT custom que inyecta empresa_id, email, rol y nombre en el token.
"""
from django.contrib.auth import get_user_model
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

User = get_user_model()


# ─── JWT Custom ───────────────────────────────────────────────

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Extiende SimpleJWT para inyectar claims de negocio en el access token.

    Claims en el payload:
        user_id         UUID del usuario
        email           Email del usuario (campo de login)
        empresa_id      UUID de la empresa (null para superadmins)
        empresa_nombre  Nombre de la empresa
        rol             Rol del usuario
        nombre          Nombre completo del usuario
    """

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # ─── Claims obligatorios según el prompt ──────────────
        token["email"] = user.email
        token["rol"] = user.rol
        token["nombre"] = user.nombre_completo

        if user.empresa_id:
            token["empresa_id"] = str(user.empresa_id)
            token["empresa_nombre"] = user.empresa.nombre if user.empresa else None
        else:
            token["empresa_id"] = None
            token["empresa_nombre"] = None

        return token

    def validate(self, attrs):
        data = super().validate(attrs)

        # Bloquear login si la empresa está suspendida
        if self.user.empresa and not self.user.empresa.activo:
            raise serializers.ValidationError(
                "La empresa está suspendida. Contacte al administrador del sistema."
            )

        # Añadir datos del usuario a la respuesta de login
        data["usuario"] = UsuarioMeSerializer(self.user).data
        return data


# ─── Usuario Serializers ──────────────────────────────────────

class UsuarioMeSerializer(serializers.ModelSerializer):
    """Perfil completo del usuario autenticado. Retornado en login y /me/."""
    nombre_completo = serializers.ReadOnlyField()
    empresa_nombre = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id", "email", "nombre", "apellido", "nombre_completo",
            "rol", "empresa_id", "empresa_nombre", "avatar", "is_active",
        ]
        read_only_fields = ["id", "email", "empresa_id"]

    def get_empresa_nombre(self, obj) -> str | None:
        return obj.empresa.nombre if obj.empresa else None


class UsuarioListSerializer(serializers.ModelSerializer):
    """Serializer ligero para listados."""
    nombre_completo = serializers.ReadOnlyField()

    class Meta:
        model = User
        fields = ["id", "email", "nombre_completo", "rol", "is_active", "created_at"]


class UsuarioCreateSerializer(serializers.ModelSerializer):
    """Crear un usuario dentro de la empresa del admin."""
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ["email", "nombre", "apellido", "telefono", "rol", "password", "password_confirm"]

    def validate(self, attrs):
        if attrs["password"] != attrs.pop("password_confirm"):
            raise serializers.ValidationError({"password_confirm": "Las contraseñas no coinciden."})
        return attrs

    def create(self, validated_data):
        empresa = self.context["request"].empresa
        password = validated_data.pop("password")
        return User.objects.create_user(empresa=empresa, password=password, **validated_data)


class UsuarioUpdateSerializer(serializers.ModelSerializer):
    """Actualizar datos editables del perfil."""

    class Meta:
        model = User
        fields = ["nombre", "apellido", "telefono", "avatar"]


class CambiarPasswordSerializer(serializers.Serializer):
    password_actual = serializers.CharField(write_only=True)
    password_nuevo = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)

    def validate_password_actual(self, value):
        if not self.context["request"].user.check_password(value):
            raise serializers.ValidationError("La contraseña actual es incorrecta.")
        return value

    def validate(self, attrs):
        if attrs["password_nuevo"] != attrs["password_confirm"]:
            raise serializers.ValidationError({"password_confirm": "Las contraseñas no coinciden."})
        return attrs
