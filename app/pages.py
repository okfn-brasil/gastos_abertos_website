#!/usr/bin/env python
# -*- coding: utf-8 -*-
from __future__ import unicode_literals  # unicode by default

import datetime

from flask import render_template, redirect, url_for
from flask_flatpages import FlatPages

from .app import app
from .util import add_l10n_prefix, remove_l10n_prefix
from .blog import authors, sorted_authors, posts, sorted_posts, get_post_url, posts_by_tag, tags, categories, historias_posts, sorted_historias_posts, historia_get_post_url, historias_posts_by_tag, historias_tags, historias_categories


# Add the FlatPages extension
pages = FlatPages(app, 'pages')


@app.route('/<path:path>/')
def page(path):
    ''' All pages from markdown files '''

    # Get the page
    page = pages.get_or_404(add_l10n_prefix(path))

    # Get custom template
    template = page.meta.get('template', 'page.html')

    # Verify if need redirect
    redirect_ = page.meta.get('redirect', None)
    if redirect_:
        return redirect(url_for('page', path=redirect_))

    today = datetime.datetime.now().strftime("%B %dth %Y")

    # Render the page
    return render_template(template, page=page, today=today, pages=pages, posts=sorted_posts, authors=sorted_authors, tags=tags, categories=categories, historias_posts=sorted_historias_posts, historias_tags=historias_tags, historias_categories=historias_categories)
