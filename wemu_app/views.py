from django.shortcuts import render, redirect
from django.http import HttpResponse
from django.db import connection
from django.db.models import Q
from wemu_app.models import ViewData
from catalog.models import *
from django.template import loader
import re
import decimal
from . import extractPDF
from django.core.files.storage import FileSystemStorage
from django.conf import settings
#form stuff
from catalog.models import Artist, Album, Genre, Label, FeaturedIn, CreatedBy, PlayLog
from catalog import forms
from django.forms import inlineformset_factory
#timezone stuff for saving publish date
import datetime
from django.utils import timezone
import os

def homepage(request):
    return render(request, 'homepage.html')

def manageCatalog(request):
    return render(request, 'manageCatalog.html')


def index(request):
    return render(request, 'index.html')


def pdfimport(request):
    return render(request, 'importHistory.html')


def inputAlbum(request):
    # if else for getting form data from create button
    if request.method == 'POST':
        form = forms.CreateAlbum(request.POST)
        # if valid
        if form.is_valid():
            # save article to database and redirect user to article list
            instance = form.save(commit=False)
            # set album pub_date = current time
            #instance.pub_date = timezone.now()
            instance.save()
            return redirect('homepage')
    else:
        form = forms.CreateAlbum()

    return render(request, 'inputAlbum.html', {'form': form})


def inputTrack(request):
    # if else for getting form data from create button
    if request.method == 'POST':
        # check if the form is valid
        form = forms.CreateTrack(request.POST)
        # if valid
        if form.is_valid():
            # save article to database and redirect user to article list
            instance = form.save(commit=False)
            instance.save()
            return redirect('homepage')
    else:
        form = forms.CreateTrack()

    return render(request, 'inputTrack.html', {'form': form})


def viewData(request):
    return render(request, 'viewData.html')


def viewHistory(request):
    trStart = "<tr><td align=\"center\">"
    trMid = "</td><td align=\"center\">"
    trEnd = "</td></tr>"
    table = "<table align=\"center\"><thead><tr>"
    columns = ["Artist Name", "Album Name", "Track Name", "Play Timestamp"]
    for column in columns:
        table += "<th style=\"text-align:center\">"+column+"</th>"
    table += "</tr></thead><tbody>"

    history = PlayLog.objects.filter(play_timestamp__gt = (datetime.datetime.today()-datetime.timedelta(days=30))).order_by('-play_timestamp')
    for hit in history:
        time = hit.play_timestamp.strftime("%b. %d, %Y, %I:%M%p")
        table+=trStart+hit.artist_name+trMid+hit.album_name+trMid+hit.track_name+trMid+time+trEnd
   # history = PlayLog.objects.filter(play_timestamp > (datetime.datetime.now() - timedelta
   # return HttpResponse(history)
    context = {"htmlCode": table}
    template = loader.get_template("/var/www/html/projects/wemu_app/templates/viewHistory.html")
    return HttpResponse(template.render(context, request))

def searchData(request):
    # set up html for table to return
    numberOfHits = 0
    trStart = "<tr><td align=\"center\">"
    trMid = "</td><td align=\"center\">"
    trEnd = "</td></tr>"
    # get what the search criteria and input is
    searchTerm = request.GET.get('Search_Type')
    searchInput = request.GET.get('Search')
    table = "<table align=\"center\">"
    template = loader.get_template("/var/www/html/projects/wemu_app/templates/viewData.html")

    if (searchInput == ""):
        return render(request, 'viewData.html')
    # find results for album title search
    if (searchTerm == "AlbumTitle"):
        # get the table header for the criteria to return
        table += getHeader(["Title", "Publish Date", "Label", "Genre", "Group", "Num Tracks", "Created By"])
        # get the albums that match the input
        hits = Album.objects.filter(title__icontains = searchInput)

        hitDetails = getAlbumInfo(hits)

        # populate the table rows with the values
        for value in hitDetails:
            numberOfHits+=1
            table += trStart+value["Title"]+trMid+value["Publish Date"]+trMid+value["Label"]+trMid+value["Genre"]+trMid+value["Group"]+trMid+value["Num Tracks"]+trMid+value["Created By"]+trEnd

    if (searchTerm == "ArtistName(Artists)"):
        table += getHeader(["First Name", "Last Name", "Instrument"])
        artistName = searchInput.split(' ')
        hits = getArtistNameHits(artistName)

        hitDetails = getArtistInfo(hits)

        for value in hitDetails:
            numberOfHits+=1
            table += trStart+value["First Name"]+trMid+value["Last Name"]+trMid+value["Instrument"]+trEnd

    if (searchTerm == "ArtistName(Albums)"):
        table += getHeader(["Title", "Publish Date", "Label", "Genre", "Group", "Num Tracks", "Created By"])
        artistName = searchInput.split(' ')
        hits = getArtistNameHits(artistName)

        for hit in hits:
            albumIds = CreatedBy.objects.filter(artist_id = hit.artist_id).values_list('album_id')
            for albumId in albumIds:
                album = Album.objects.filter(album_id = albumId[0])
                album = album[0]
                hitDetails = []

                values = {}
                if album.title is None:
                    values["Title"] = ""
                else:
                    values["Title"] = album.title

                if album.pub_date.year is None:
                    values["Publish Date"] = ""
                else:
                    values["Publish Date"] = str(album.pub_date.year)

                if album.label_code is None:
                    values["Label"] = ""
                else:
                    values["Label"] = Label.objects.get(label_code = album.label_code.label_code).company_name

                if album.music_code is None:
                    values["Genre"] = ""
                else:
                    values["Genre"] = album.music_code.genre

                if album.group_name is None:
                    values["Group"] = ""
                else:
                    values["Group"] = album.group_name

                if album.num_tracks is None:
                    values["Num Tracks"] = ""
                else:
                    values["Num Tracks"] = str(album.num_tracks)

                artists = CreatedBy.objects.filter(album_id = album.album_id)
                artistNames = ""
                for artist in artists:
                    artistName = Artist.objects.get(artist_id = artist.artist_id)
                    artistNames += artistName.fname + " " + artistName.lname +", "
                artistNames = artistNames[:-2]

                if artistNames is None:
                    values["Created By"] = ""
                else:
                    values["Created By"] = artistNames

                hitDetails.append(values)

                for value in hitDetails:
                    numberOfHits+=1
                    table += trStart+value["Title"]+trMid+value["Publish Date"]+trMid+value["Label"]+trMid+value["Genre"]+trMid+value["Group"]+trMid+value["Num Tracks"]+trMid+value["Created By"]+trEnd

    if (searchTerm == "ArtistName(Tracks)"):
        table += getHeader(["Album Title", "Name", "Number", "Length", "Artists"])
        artistName = searchInput.split(' ')
        hits = getArtistNameHits(artistName)

        for hit in hits:
            trackIds = FeaturedIn.objects.filter(artist_id = hit.artist_id).values_list('track_id')
            for trackId in trackIds:
                track = Track.objects.filter(track = trackId[0])
                track = track[0]
                hitDetails = []

                values = {}
                albumTitle = Album.objects.get(album_id = track.album_id)
                if albumTitle is None:
                    values["Album"] = ""
                else:
                    values["Album Title"] = albumTitle.title

                if track.track_name is None:
                    values["Name"] = ""
                else:
                    values["Name"] = track.track_name

                if track.track_num is None:
                    values["Number"] = ""
                else:
                    values["Number"] = str(track.track_num)

                if track.track_len is None:
                    values["Length"] = ""
                else:
                    if int((track.track_len%1)*100) > 60:
                        values["Length"] = str(track.track_len+decimal.Decimal('.4')).replace(".", ":")
                    else:
                        values["Length"] = str(track.track_len).replace(".", ":")

                artists = FeaturedIn.objects.filter(track_id = track.track).values_list('artist_id')
                artistNames = ""
                for artist in artists:
                    artistName = Artist.objects.get(artist_id = artist[0])
                    artistNames += artistName.fname + " " + artistName.lname +", "
                artistNames = artistNames[:-2]

                if artistNames is None:
                    values["Artists"] = ""
                else:
                    values["Artists"] = artistNames

                hitDetails.append(values)

                for value in hitDetails:
                    numberOfHits+=1
                    table += trStart+value["Album Title"]+trMid+value["Name"]+trMid+value["Number"]+trMid+value["Length"]+trMid+value["Artists"]+trEnd

    if (searchTerm == "TrackName"):
        table += getHeader(["Album Title", "Name", "Number", "Length", "Artists"])
        trackName = searchInput
        hits = Track.objects.filter(track_name__icontains = trackName)

        hitDetails = getTrackInfo(hits)

        for value in hitDetails:
            numberOfHits+=1
            table += trStart+value["Album Title"]+trMid+value["Name"]+trMid+value["Number"]+trMid+value["Length"]+trMid+value["Artists"]+trEnd

    if (searchTerm == "GroupName"):
        table += getHeader(["Title", "Publish Date", "Label", "Genre", "Group", "Num Tracks", "Created By"])
        groupName = searchInput
        hits = Album.objects.filter(group_name__icontains = groupName)

        hitDetails = getAlbumInfo(hits)

        # populate the table rows with the values
        for value in hitDetails:
            numberOfHits+=1
            table += trStart+value["Title"]+trMid+value["Publish Date"]+trMid+value["Label"]+trMid+value["Genre"]+trMid+value["Group"]+trMid+value["Num Tracks"]+trMid+value["Created By"]+trEnd


    if (searchTerm == "LabelName"):
        table += getHeader(["Title", "Publish Date", "Label", "Genre", "Group", "Num Tracks", "Created By"])
        labelName = searchInput
        try:
            labelCode = Label.objects.get(company_name__icontains = labelName)
            hits = Album.objects.filter(label_code = labelCode)
        except:
            hits = []

        hitDetails = getAlbumInfo(hits)

        # populate the table rows with the values
        for value in hitDetails:
            numberOfHits+=1
            table += trStart+value["Title"]+trMid+value["Publish Date"]+trMid+value["Label"]+trMid+value["Genre"]+trMid+value["Group"]+trMid+value["Num Tracks"]+trMid+value["Created By"]+trEnd

    if (searchTerm == "PublicationYear"):
        table += getHeader(["Title", "Publish Date", "Label", "Genre", "Group", "Num Tracks", "Created By"])
        pubDate = searchInput
        hits = Album.objects.filter(pub_date__year = pubDate)

        hitDetails = getAlbumInfo(hits)

        # populate the table rows with the values
        for value in hitDetails:
            numberOfHits+=1
            table += trStart+value["Title"]+trMid+value["Publish Date"]+trMid+value["Label"]+trMid+value["Genre"]+trMid+value["Group"]+trMid+value["Num Tracks"]+trMid+value["Created By"]+trEnd

    table += "</tbody></table>"
    table = "<center>There are "+str(numberOfHits)+ " results!</center>" + table
    context = {"htmlCode": table}
    return HttpResponse(template.render(context, request))

def getHeader(headerNames):
    headerhtml = "<thead><tr>"
    for header in headerNames:
        headerhtml += "<th style=\"text-align:center\">"+header+"</th>"
    headerhtml += "</tr></thead><tbody>"
    return headerhtml

def getArtistNameHits(artistName):
    if(len(artistName) == 1):
        hits = Artist.objects.filter(Q(fname__icontains = artistName[0]) | Q(lname__icontains = artistName[0]))

    elif(len(artistName) > 1):
        artistFirstName = artistName[0]

        artistLastName = ""
        for i in range(1, len(artistName)):
            artistLastName += artistName[i] + " "
        artistLastName = artistLastName[:-1]

        hits = Artist.objects.filter(fname__icontains = artistFirstName, lname__icontains = artistLastName)
    return hits

def getAlbumInfo(hits):
    hitDetails = []
    # go through the albums returned and get the values needed
    for hit in hits:
        values = {}
        # check to make sure you don't get a none
        values["Title"] = "" if hit.title is None else hit.title
        values["Publish Date"] = "" if hit.pub_date.year is None else str(hit.pub_date.year)
        values["Label"] = "" if hit.label_code is None else Label.objects.get(label_code = hit.label_code.label_code).company_name
        values["Genre"] = "" if hit.music_code is None else hit.music_code.genre
        values["Group"] = "" if hit.group_name is None else hit.group_name
        values["Num Tracks"] = "" if hit.num_tracks is None else str(hit.num_tracks)

        # get all of the artists on the album
        artists = CreatedBy.objects.filter(album_id = hit.album_id)
        artistNames = ""
        for artist in artists:
            artistName = Artist.objects.get(artist_id = artist.artist_id)
            artistNames += artistName.fname + " " + artistName.lname +", "
        artistNames = artistNames[:-2]

        if artistNames is None:
            values["Created By"] = ""
        else:
            values["Created By"] = artistNames

        hitDetails.append(values)
    return hitDetails

def getArtistInfo(hits):
    hitDetails = []
    for hit in hits:
        values={}
        if hit.fname is None:
            values["First Name"] = ""
        else:
            values["First Name"] = hit.fname
        if hit.lname is None:
            values["Last Name"] = ""
        else:
            values["Last Name"] = hit.lname
        if hit.instrument is None:
            values["Instrument"] = ""
        else:
           values["Instrument"] = hit.instrument

        hitDetails.append(values)
    return hitDetails

def getTrackInfo(hits):
    hitDetails = []
    for track in hits:
        values = {}
        albumTitle = Album.objects.get(album_id = track.album_id)
        if albumTitle is None:
            values["Album"] = ""
        else:
            values["Album Title"] = albumTitle.title

        if track.track_name is None:
            values["Name"] = ""
        else:
            values["Name"] = track.track_name

        if track.track_num is None:
            values["Number"] = ""
        else:
            values["Number"] = str(track.track_num)

        if track.track_len is None:
            values["Length"] = ""
        else:
            if int((track.track_len%1)*100) > 60:
                values["Length"] = str(track.track_len+decimal.Decimal('.4')).replace(".", ":")
            else:
                values["Length"] = str(track.track_len).replace(".", ":")

        artists = FeaturedIn.objects.filter(track_id = track.track).values_list('artist_id')
        artistNames = ""
        for artist in artists:
            artistName = Artist.objects.get(artist_id = artist[0])
            artistNames += artistName.fname + " " + artistName.lname +", "
        artistNames = artistNames[:-2]

        if artistNames is None:
            values["Artists"] = ""
        else:
            values["Artists"] = artistNames

        hitDetails.append(values)
    return hitDetails

def insertData(request):
    if not bool(request.FILES):
        return render(request, 'importHistory.html', {
            'warning':'warning'
        })
        
    if request.method == 'POST' and request.FILES['pdf_file']:
        file_pass = request.FILES['pdf_file']
        fs = FileSystemStorage()
        filename = fs.save(file_pass.name, file_pass)
        #uploaded_url = fs.url(file_pass)
        #return HttpResponse(uploaded_url)
       # data = extractPDF.extract_fromTabula( uploaded_url )
        data = extractPDF.extract_fromTabula('/var/www/html/projects/wemu_app/media/'+file_pass.name)
        for item in data:
            log = PlayLog(play_timestamp=item[0], track_name=item[1], album_name=item[2], artist_name=item[3])
            log.save()
    
    os.remove('/var/www/html/projects/wemu_app/media/'+file_pass.name)
    #return HttpResponse(request.GET.get('pdf_file'))
    #return render(request,'viewHistory.html')
    return viewHistory(request)
