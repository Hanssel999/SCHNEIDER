from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [("users", "0004_multidayroute")]

    operations = [
        migrations.AddField(
            model_name="driverrouteintake",
            name="user",
            field=models.OneToOneField(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="driver_route",
                to="users.user",
            ),
        ),
    ]