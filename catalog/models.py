# This is an auto-generated Django model module.
# You'll have to do the following manually to clean this up:
#   * Rearrange models' order
#   * Make sure each model has one field with primary_key=True
#   * Make sure each ForeignKey has `on_delete` set to the desired behavior.
#   * Remove `managed = False` lines if you wish to allow Django to create, modify, and delete the table
# Feel free to rename the models, but don't rename db_table values or field names.
from django.db import models


class Artist(models.Model):
    artist_id = models.AutoField(db_column='ARTIST_ID', primary_key=True)  # Field name made lowercase.
    lname = models.CharField(db_column='LName', max_length=40, blank=True, null=True)  # Field name made lowercase.
    fname = models.CharField(db_column='FName', max_length=40, blank=True, null=True)  # Field name made lowercase.
    instrument = models.CharField(db_column='Instrument', max_length=40, blank=True, null=True)  # Field name made lowercase.

    def __str__(self):
        return "%s %s" % (self.fname, self.lname)

    class Meta:
        managed = False
        db_table = 'Artist'
        ordering = ['fname', 'lname']

class Album(models.Model):
    album_id = models.AutoField(db_column='Album_ID', primary_key=True)  # Field name made lowercase.
    title = models.CharField(db_column='Title', max_length=100, blank=True, null=True)  # Field name made lowercase.
    pub_date = models.DateField(db_column='Pub_Date', blank=True, null=True)  # Field name made lowercase.
    label_code = models.ForeignKey('Label', models.SET_NULL, db_column='Label_Code', blank=True, null=True)  # Field name made lowercase.
    music_code = models.ForeignKey('Genre', models.SET_NULL, db_column='Music_Code', blank=True, null=True)  # Field name made lowercase.
    group_name = models.CharField(db_column='Group_Name', max_length=20, blank=True, null=True)  # Field name made lowercase.
    num_tracks = models.IntegerField(db_column='Num_Tracks', blank=True, null=True)  # Field name made lowercase.
    
    def __str__(self):
        return self.title

    class Meta:
        managed = False
        db_table = 'Album'
       # ordering = ['-album_id']
        ordering = ['-pub_date']

class CreatedBy(models.Model):
    album = models.ForeignKey(Album, models.CASCADE, db_column='Album_ID')  # Field name made lowercase.
    artist = models.ForeignKey(Artist, models.CASCADE, db_column='Artist_ID', primary_key=True)  # Field name made lowercase.

    def __str__(self):
        return "%s %s %s" % (self.artist, '-', self.album)

    class Meta:
        managed = False
        db_table = 'Created_By'
        ordering = ['artist', 'album']
        unique_together = (('artist', 'album'),)

class Genre(models.Model):
    genre_code = models.CharField(db_column='Genre_Code', primary_key=True, max_length=4)  # Field name made lowercase.
    genre = models.CharField(db_column='Genre', max_length=10, blank=True, null=True)  # Field name made lowercase.

    def __str__(self):
        return self.genre

    class Meta:
        managed = False
        db_table = 'Genre'
        ordering = ['genre']

class Label(models.Model):
    label_code = models.AutoField(db_column='Label_Code', primary_key=True)  # Field name made lowercase.
    company_name = models.CharField(db_column='Company_Name', max_length=30)  # Field name made lowercase.

    def __str__(self):
        return self.company_name

    class Meta:
        managed = False
        db_table = 'Label'
        ordering = ['company_name']


class Track(models.Model):
    track = models.AutoField(db_column='Track_ID', primary_key=True)
    album = models.ForeignKey(Album, models.CASCADE, db_column='Album_ID')  # Field name made lowercase.
    track_name = models.CharField(db_column='Track_Name', max_length=100)  # Field name made lowercase.
    track_num = models.IntegerField(db_column='Track_Num', blank=True, null=True)  # Field name made lowercase.
    track_len = models.DecimalField(db_column='Track_Len', max_digits=4, decimal_places=2, blank=True, null=True)  # Field name made lowercase.

    def __str__(self):
        #return "%s %s %s %s %s" % (self.track_name, '-', self.album, '-', self.track_len)
        return self.track_name

    class Meta:
        managed = False
        db_table = 'Track'
        ordering = ['track_name']

class FeaturedIn(models.Model):
    track = models.ForeignKey(Track, models.CASCADE, db_column='Track_ID', related_name='song')  # Field name made lowercase.
    artist = models.ForeignKey(Artist, models.CASCADE, db_column='Artist_ID', primary_key=True)  # Field name made lowercase.

    def __str__(self):
        return "%s %s %s" % (self.artist, '-', self.track)

    class Meta:
        managed = False
        db_table = 'Featured_In'
        ordering = ['artist', 'track']
        unique_together = (('track', 'artist'),)

class PlayLog(models.Model):
    play_timestamp = models.DateTimeField(db_column='Play_Timestamp', primary_key=True)  # Field name made lowercase.
    track_name = models.CharField(db_column='Track_Name', max_length=100)
    album_name = models.CharField(db_column='Album_Name', max_length=100)
    artist_name = models.CharField(db_column='Artist_Name', max_length=100)
    
    def __str__(self):
        return "%s %s %s %s %s %s %s" % (self.artist_name, '-', self.album_name, '-', self.track_name, '-', self.play_timestamp)

    class Meta:
        managed = False
        db_table = 'Play_Log'
        ordering = ['-play_timestamp']



