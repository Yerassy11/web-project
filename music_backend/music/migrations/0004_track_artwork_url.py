from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('music', '0003_favoritesong'),
    ]

    operations = [
        migrations.AddField(
            model_name='track',
            name='artwork_url',
            field=models.URLField(blank=True, default=''),
        ),
    ]
