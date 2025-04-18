from django.db import models
from django.contrib.auth.models import User
import ShoulderToShoulder.settings as s2s_settings


def profile_picture_path(instance, filename):
    return f"profile_pictures/user_{instance.user_id.id}/{filename}"


# https://dev.to/earthcomfy/django-user-profile-3hik
class Profile(models.Model):
    """
    Holds user information not related to authentication.

    Columns:
        user_id: user ID fk from user table
        profile_picture: image uploaded to S3
        last_email_sent: last datetime that the user was sent
                        an email notification
    """

    user_id = models.OneToOneField(User, on_delete=models.CASCADE)
    profile_picture = models.ImageField(
        upload_to=profile_picture_path,
        blank=True,
        default="default/default_profile.jpg",
    )
    last_email_sent = models.DateTimeField(null=True, blank=True)


def __str__(self):
    return self.user.username
