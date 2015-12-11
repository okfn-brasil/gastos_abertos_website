#!/usr/bin/env python
# -*- coding: utf-8 -*-
from __future__ import unicode_literals  # unicode by default

import sys
import datetime

from flask import render_template, redirect, url_for
from flask.ext.babel import Babel
from flask_flatpages import FlatPages
from flask_frozen import Freezer

# TODO:
# * Get babel locale from request path

from .app import app
from .util import add_l10n_prefix, remove_l10n_prefix
from .blog import (authors, sorted_authors, posts, sorted_posts, get_post_url,
                   posts_by_tag, posts_by_category)
from .pages import pages

# Add the babel extension
babel = Babel(app)

# Add the Frozen extension
freezer = Freezer(app)


# Frozen url generators

@freezer.register_generator
def default_locale_urls():
    ''' Genarates the urls for default locale without prefix. '''
    for page in pages:
        yield '/{}/'.format(remove_l10n_prefix(page.path))


@freezer.register_generator
def page_urls():
    ''' Genarates the urls with locale prefix. '''
    for page in pages:
        yield '/{}/'.format(page.path)


@freezer.register_generator
def blog_posts_urls():
    for post in posts:
        yield get_post_url(post)

#
# Routes
#

@app.route('/')
def root():
    ''' Main page '''
    # Get the page
    path = 'main'
    page = pages.get_or_404(add_l10n_prefix(path))

    return render_template('root.html', page=page, pages=pages, posts=sorted_posts, authors=authors)


def run():
    if len(sys.argv) > 1 and sys.argv[1] == 'build':
        freezer.freeze()
    else:
        app.run(host='0.0.0.0', port=8000)
