from django.contrib import admin

from .models import CrimeTypes, Solutions,AwarenessResource, Flair

# Register your models here.
admin.site.register(CrimeTypes)
admin.site.register(Solutions)
admin.site.register(AwarenessResource)
admin.site.register(Flair)