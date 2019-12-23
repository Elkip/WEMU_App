from django import forms
from catalog import models

class CreateAlbum(forms.ModelForm):
    class Meta:
        model = models.Album
        # what user can enter in
        fields = ['title', 'music_code', 'label_code', 'group_name', 'num_tracks', 'pub_date']

class CreateTrack(forms.ModelForm):
    class Meta:
        model = models.Track
        # what user can enter in
        fields = ['track_name', 'album', 'track_num', 'track_len']
