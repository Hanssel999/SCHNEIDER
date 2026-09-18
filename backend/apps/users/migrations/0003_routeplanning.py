from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("users", "0002_driverrouteintake")]

    operations = [
        migrations.AddField(model_name="driverrouteintake", name="current_latitude", field=models.DecimalField(blank=True, decimal_places=6, max_digits=9, null=True)),
        migrations.AddField(model_name="driverrouteintake", name="current_longitude", field=models.DecimalField(blank=True, decimal_places=6, max_digits=9, null=True)),
        migrations.AddField(model_name="driverrouteintake", name="pickup_latitude", field=models.DecimalField(blank=True, decimal_places=6, max_digits=9, null=True)),
        migrations.AddField(model_name="driverrouteintake", name="pickup_longitude", field=models.DecimalField(blank=True, decimal_places=6, max_digits=9, null=True)),
        migrations.AddField(model_name="driverrouteintake", name="dropoff_latitude", field=models.DecimalField(blank=True, decimal_places=6, max_digits=9, null=True)),
        migrations.AddField(model_name="driverrouteintake", name="dropoff_longitude", field=models.DecimalField(blank=True, decimal_places=6, max_digits=9, null=True)),
        migrations.AddField(model_name="driverrouteintake", name="route_distance_miles", field=models.DecimalField(decimal_places=1, default=0, max_digits=8)),
        migrations.AddField(model_name="driverrouteintake", name="generated_timeline", field=models.JSONField(default=list)),
    ]