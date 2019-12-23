from django.contrib import admin
from .models import *

# code to allow to more options in admin page
class ArtistModelAdmin(admin.ModelAdmin):

	list_display = ('lname', 'fname', 'instrument')

	list_filter = ('instrument',)

	search_fields = ['lname', 'fname', 'instrument']

	class Meta:
		model = Artist

class AlbumModelAdmin(admin.ModelAdmin):

	list_display = ('title', 'num_tracks', 'music_code', 'label_code', 'pub_date')

	list_filter = ('pub_date', 'music_code')

	search_fields = ['title', 'num_tracks', 'label_code__company_name', 'pub_date']

	class Meta:
		model = Album

class GenreModelAdmin(admin.ModelAdmin):

	list_display = ('genre', 'genre_code')

	list_filter = ('genre',)

	search_fields = ['genre', 'genre_code']

	class Meta:
		model = Genre

class LabelModelAdmin(admin.ModelAdmin):

	list_display = ('company_name', 'label_code')

	search_fields = ['company_name', 'label_code']

	class Meta:
		model = Label


class TrackModelAdmin(admin.ModelAdmin):

        list_display = ('track_name', 'album', 'track_len')

        search_fields = ['album__title', 'track_name', 'track_len']

        autocomplete_fields = ['album']        

        class Meta:
                model = Track

class CreatedByModelAdmin(admin.ModelAdmin):

        list_display = ('artist', 'album')

        search_fields = ['album__title', 'artist__fname', 'artist__lname']

        autocomplete_fields = ['artist', 'album']

        class Meta:
                model = CreatedBy

class FeaturedInModelAdmin(admin.ModelAdmin):

        list_display = ('artist', 'track')

        search_fields = ['artist__fname', 'artist__lname', 'track__track_name']

        autocomplete_fields = ['artist', 'track']

        class Meta:
                model = FeaturedIn

class PlayLogModelAdmin(admin.ModelAdmin):

	list_display = ('artist_name', 'album_name', 'track_name', 'play_timestamp')

	list_filter = ('play_timestamp',)

	search_fields = ['album_name', 'track_name', 'play_timestamp', 'artist_name']

	class Meta:
		model = PlayLog

# Register your models here.
admin.site.register(Artist, ArtistModelAdmin)
admin.site.register(Album, AlbumModelAdmin)
admin.site.register(Genre, GenreModelAdmin)
admin.site.register(Label, LabelModelAdmin)
admin.site.register(Track, TrackModelAdmin)
admin.site.register(CreatedBy, CreatedByModelAdmin)
admin.site.register(FeaturedIn, FeaturedInModelAdmin)
admin.site.register(PlayLog, PlayLogModelAdmin)

