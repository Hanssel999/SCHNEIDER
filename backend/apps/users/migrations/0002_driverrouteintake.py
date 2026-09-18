from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("users", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="DriverRouteIntake",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("current_location", models.CharField(max_length=200)),
                ("pickup_location", models.CharField(max_length=200)),
                ("dropoff_location", models.CharField(max_length=200)),
                ("current_cycle_used", models.DecimalField(decimal_places=1, max_digits=4)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
        ),
    ]