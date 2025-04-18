from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MaxValueValidator, MinValueValidator

class Availability(models.Model):
    """
    Creates a Django Model representing Availability of every user in the Shoulder to Shoulder Database

        Table Columns:
            user_id (str): fk to user table
            available (bool): if user is available at given time
            day_of_week (str): day of week
            hour (int): hour of day
    """
    DAY_CHOICES = (
        ('Monday', 'Monday'),
        ('Tuesday', 'Tuesday'),
        ('Wednesday', 'Wednesday'),
        ('Thursday', 'Thursday'),
        ('Friday', 'Friday'),
        ('Saturday', 'Saturday'),
        ('Sunday', 'Sunday'),
    )    

    user_id = models.ForeignKey(User, on_delete=models.CASCADE)
    available = models.BooleanField(default = False)

    day_of_week = models.CharField(max_length=10, choices=DAY_CHOICES, default='Monday')
    hour = models.IntegerField(validators=[
        MinValueValidator(1),
        MaxValueValidator(24)],
        default=1
    )

    def __str__(self) -> str:
        return 'User {}, Day {}, Hour {} Available {}'.format(self.user_id, self.day_of_week, self.hour, self.available)
 
