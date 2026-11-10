from django.contrib import admin

from .models import Observation, Station


@admin.register(Station)
class StationAdmin(admin.ModelAdmin):
    list_display = ["id", "name", "river", "city", "state", "alert_level_m"]
    search_fields = ["id", "name", "river", "city"]


@admin.register(Observation)
class ObservationAdmin(admin.ModelAdmin):
    list_display = ["station", "observed_at", "metric", "value"]
    list_filter = ["station", "metric"]
    date_hierarchy = "observed_at"
