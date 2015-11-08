# -*- coding: utf-8 -*-
from __future__ import unicode_literals

#
# Common settings
#

AVAILABLE_LOCALES = ['pt_BR', 'en']

DEBUG = True
DEFAULT_LOCALE = 'pt_BR'

FLATPAGES_PAGES_AUTO_RELOAD = DEBUG
FLATPAGES_PAGES_EXTENSION = '.md'
FLATPAGES_PAGES_ROOT = 'pages'

FLATPAGES_POSTS_AUTO_RELOAD = DEBUG
FLATPAGES_POSTS_EXTENSION = '.md'
FLATPAGES_POSTS_ROOT = 'blog'

BABEL_DEFAULT_LOCALE = DEFAULT_LOCALE

API_URL = 'http://demo.gastosabertos.org'
