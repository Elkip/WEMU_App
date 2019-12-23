from django.shortcuts import render

# Create your views here.
def searchArtistOnName():
    print(Artist.objects.all)


if __name__=='__main__':
    searchArtistOnName()
