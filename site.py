#!/usr/bin/env python
# -*- coding: utf-8 -*-
from __future__ import unicode_literals  # unicode by default

import sys
import datetime
from collections import OrderedDict
#import pandoc
import pypandoc

from flask import Flask
from flask import render_template, redirect, url_for
from flask.ext.babel import Babel
from flask_flatpages import FlatPages
from flask_frozen import Freezer

#pandoc.core.PANDOC_PATH = '/usr/bin/pandoc'

# TODO:
# * Get babel locale from request path

# Create the Flask app
app = Flask(__name__)

# Load settings
app.config.from_pyfile('settings/common.py')
app.config.from_pyfile('settings/local_settings.py', silent=True)

if len(sys.argv) > 2:
    extra_conf = sys.argv[2]
    app.config.from_pyfile('settings/{}_settings.py'.format(extra_conf), silent=True)

# Add the babel extension
babel = Babel(app)

# Add the FlatPages extension
pages = FlatPages(app, 'pages')
posts = FlatPages(app, 'blog')
authors = FlatPages(app, 'authors')

# Add the Frozen extension
freezer = Freezer(app)

#
# Utils
#

# Frozen url generators

@freezer.register_generator
def default_locale_urls():
    ''' Genarates the urls for default locale without prefix. '''
    for page in pages:
        if not 'main' in page.path:
            yield '/{}/'.format(remove_l10n_prefix(page.path))


@freezer.register_generator
def page_urls():
    ''' Genarates the urls with locale prefix. '''
    for page in pages:
        if not 'main' in page.path:
            yield '/{}/'.format(page.path)


@freezer.register_generator
def posts_urls():
    ''' Genarates the urls with locale prefix. '''
    for post in posts:
        if not 'main' in post.path:
            path = remove_l10n_prefix(post.path)
            year = path[0:4]
            month = path[4:6]
            day = path[6:8]
            name = path[9:]
            print year, month, day, name
            yield '/blog/{}/{}/{}/{}/'.format(year, month, day, name)

# l10n helpers

def has_l10n_prefix(path):
    ''' Verifies if the path have a localization prefix. '''
    return reduce(lambda x, y: x or y, [path.startswith(l)
                  for l in app.config.get('AVAILABLE_LOCALES', [])])


def add_l10n_prefix(path, locale=app.config.get('DEFAULT_LOCALE')):
    '''' Add localization prefix if necessary. '''
    return path if has_l10n_prefix(path) else '{}/{}'.format(locale, path)


def remove_l10n_prefix(path, locale=app.config.get('DEFAULT_LOCALE')):
    ''' Remove specific localization prefix. '''
    return path if not path.startswith(locale) else path[(len(locale) + 1):]


# Make remove_l10n_prefix accessible to Jinja
app.jinja_env.globals.update(remove_l10n_prefix=remove_l10n_prefix)


# Structure helpers

def render_markdown(text):
    ''' Render Markdown text to HTML. '''
    # doc = pandoc.Document()
    # doc.markdown = text.encode('utf8')
    # return unicode(doc.html, 'utf8')
    return pypandoc.convert(text, 'html', format='md')

app.config['FLATPAGES_HTML_RENDERER'] = render_markdown

#
# Routes
#

@app.route('/')
def root():
    ''' Main page '''
    # Get the page
    path = 'main'
    page = pages.get_or_404(add_l10n_prefix(path))

    # TODO: use "root.html"
    return render_template('landingpage.html', page=page, pages=pages)


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
    return render_template(template, page=page, today=today, pages=pages)


@app.route('/blog/<int:year>/<int:month>/<int:day>/<path:path>/')
def blog_post_with_date(year, month, day, path):
    ''' Blog post from markdown file '''
    return blog_post_with_category_and_date(None, year, month, day, path)


@app.route('/blog/<string:category>/<int:year>/<int:month>/<int:day>/<path:path>/')
def blog_post_with_category_and_date(category, year, month, day, path):
    ''' Blog post from markdown file '''
    path = '{:04}{:02}{:02}_{}'.format(year, month, day, path)
    path = add_l10n_prefix(path)
    return blog_post(path)


def blog_post(path):
    ''' Blog posts from markdown file '''

    # Get the post
    post = posts.get_or_404(path)
    author = authors.get(post['author'])

    # Get custom template
    template = post.meta.get('template', 'post.html')

    # Verify if need redirect
    redirect_ = post.meta.get('redirect', None)
    if redirect_:
        return redirect(url_for('post', path=redirect_))

    today = datetime.datetime.now().strftime("%B %dth %Y")

    # Render the page
    return render_template(template, post=post, author=author, page=post, today=today, posts=pages)


if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == 'build':
        freezer.freeze()
    else:
        app.run(host='0.0.0.0', port=8000)
