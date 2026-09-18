from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("users", "0005_driverrouteintake_user")]

    operations = [
        migrations.AddField(
            model_name="driverrouteintake",
            name="driver_log_data",
            field=models.JSONField(default=dict),
        ),
    ]