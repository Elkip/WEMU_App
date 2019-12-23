"""wemu_app URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/2.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path
from django.urls import re_path
from django.urls import include
from django.conf import settings
from django.conf.urls.static import static
from django.contrib.staticfiles.urls import staticfiles_urlpatterns
from . import views


urlpatterns = [
    #  (path after link, views.py function hpageome, html file name)
    path('', views.homepage, name = 'homepage'),
    #path('home', views.home, name = 'home'),
    path('admin/', admin.site.urls),
    path('index', views.index, name = 'index'),
    path('pdfimport', views.pdfimport, name = 'importHistory'),
    path('inputAlbum', views.inputAlbum, name = 'inputAlbum'),
    path('inputTrack', views.inputTrack, name = 'inputTrack'),
    path('viewData', views.viewData, name = 'viewData'),
    path('viewHistory', views.viewHistory, name = 'viewHistory'),
    path('manageCatalog', views.manageCatalog, name = 'manageCatalog'),
    re_path(r'^searchData', views.searchData),
    re_path(r'^insertData', views.insertData),
]

urlpatterns += staticfiles_urlpatterns()
