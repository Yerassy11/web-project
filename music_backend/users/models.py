from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.db import models


# ─── Custom Manager (requirement: 1 custom model manager) ────────────────────
class UserManager(BaseUserManager):
    """Custom manager — creates users via email instead of username."""

    def create_user(self, email, username, password=None, **extra):
        if not email:
            raise ValueError('Email is required')
        email = self.normalize_email(email)
        user = self.model(email=email, username=username, **extra)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, username, password=None, **extra):
        extra.setdefault('is_staff', True)
        extra.setdefault('is_superuser', True)
        return self.create_user(email, username, password, **extra)

    # Custom queryset helper — used in views
    def active(self):
        return self.filter(is_active=True)


# ─── Model 1: User ────────────────────────────────────────────────────────────
class User(AbstractBaseUser, PermissionsMixin):
    email      = models.EmailField(unique=True)
    username   = models.CharField(max_length=50, unique=True)
    avatar     = models.ImageField(upload_to='avatars/', null=True, blank=True)
    bio        = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    is_active  = models.BooleanField(default=True)
    is_staff   = models.BooleanField(default=False)

    objects = UserManager()

    USERNAME_FIELD  = 'email'
    REQUIRED_FIELDS = ['username']

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.username