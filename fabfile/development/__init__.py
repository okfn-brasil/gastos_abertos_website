# -*- coding:utf-8 -*-

from fabric.api import local


def freeze():
    ''' Creates static html files '''
    local('python site.py build')

def build():
    freeze()

def run():
    local('python site.py')
