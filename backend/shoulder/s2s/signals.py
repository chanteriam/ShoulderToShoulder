from django.core.files import File
from django.db.models.signals import post_save
from django.dispatch import receiver
import os
import shutil
from .db_models import Profile
from django.conf import settings


@receiver(post_save, sender=Profile)
def create_user_profile_folder(sender, instance, created, **kwargs):
    if created:
        user_folder = os.path.join(
            settings.MEDIA_ROOT, "profile_pictures", f"user_{instance.user_id.id}"
        )
        os.makedirs(user_folder, exist_ok=True)

        default_image_src = os.path.join(
            settings.MEDIA_ROOT, "default", "default_profile.jpg"
        )
        default_image_dst = os.path.join(user_folder, "default_profile.jpg")

        if os.path.exists(default_image_src):
            shutil.copy(default_image_src, default_image_dst)
            instance.profile_picture = user_folder
        else:
            print(f"Default image not found at: {default_image_src}")

        if not instance.profile_picture:
            with open(default_image_src, "rb") as f:
                instance.profile_picture.save("default_profile.jpg", File(f), save=True)
