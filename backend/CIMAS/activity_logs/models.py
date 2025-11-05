from django.db import models
from django.conf import settings
from django.utils import timezone

class ActivityLog(models.Model):
    id = models.AutoField(primary_key=True, db_column='log_id')  # matches frontend naming
    user = models.ForeignKey(settings.AUTH_USER_MODEL, models.DO_NOTHING)
    action = models.CharField(max_length=50, blank=True, null=True)
    timestamp = models.DateTimeField(default=timezone.now)
    target_table = models.CharField(max_length=100, blank=True, null=True)
    target_id = models.IntegerField(blank=True, null=True)

    class Meta:
        db_table = 'activity_log'
        ordering = ['-timestamp']  # Most recent first
    
    def __str__(self):
        return f"{self.user} - {self.action} - {self.target_table}:{self.target_id} at {self.timestamp}"
