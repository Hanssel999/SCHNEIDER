from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("users", "0003_routeplanning")]

    operations = [
        migrations.AddField(model_name="driverrouteintake", name="generated_daily_logs", field=models.JSONField(default=list)),
        migrations.AddField(model_name="driverrouteintake", name="route_geometry", field=models.JSONField(default=list)),
    ]
