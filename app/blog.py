#!/usr/bin/env python
# -*- coding: utf-8 -*-
from __future__ import unicode_literals  # unicode by default

import datetime
import unicodedata
from collections import defaultdict

from flask import render_template, redirect, url_for
from flask_flatpages import FlatPages

from .app import app
from .util import add_l10n_prefix, remove_l10n_prefix

posts = FlatPages(app, 'blog')
authors = FlatPages(app, 'authors')


def get_post_url(post):
    path = remove_l10n_prefix(post.path)
    date = post.meta['date']
    name = path[9:]
    return '/blog/{}/{}/{}/{}/'.format(date.year, date.month, date.day, name)


def get_post_date(post):
    path = remove_l10n_prefix(post.path)
    year = int(path[0:4])
    month = int(path[4:6])
    day = int(path[6:8])
    return datetime.date(year, month, day)


posts_by_tag = defaultdict(list)
tags = set()

def process_post_tags(post):
    global tags
    tags_ = [(tag.strip(), unicodedata.normalize(
        'NFKD', tag.lower().strip().replace(' ', '_')).encode('ascii', 'ignore')) for
        tag in post.meta.get('tags', '').split(',')]
    for _, tag in tags_:
        posts_by_tag[tag].append(post)
        tags.add((_, tag))
    post.meta['tags'] = tags_


posts_by_category = defaultdict(list)
categories = set()


def process_post_categories(post):
    global categories
    categories_ = [(category.strip(), unicodedata.normalize(
        'NFKD', category.lower().strip().replace(' ', '_')).encode('ascii', 'ignore')) for
        category in post.meta.get('categories', '').split(',')]
    for _, category in categories_:
        posts_by_category[category].append(post)
        categories.add((_, category))
    post.meta['categories'] = categories_


def sort_posts(posts):
    return sorted(posts, key=lambda p: p.meta.get('date'), reverse=True)


def get_posts_by_tag(tag):
    return sort_posts(posts_by_tag[tag])


def get_posts_by_category(category):
    return sort_posts(posts_by_category[category])


def process_post(post):
    post.meta['id'] = 'post'
    post.meta['date'] = get_post_date(post)
    print get_post_url(post)
    process_post_tags(post)
    process_post_categories(post)
    post.permalink = get_post_url(post)
    post.author = authors.get(post.meta['author'])

for post in posts:
    process_post(post)

sorted_authors = sorted(authors, key=lambda a: a.meta.get('pos', 100))
sorted_posts = sort_posts(posts)


from .pages import pages

@app.route('/blog/<int:year>/<int:month>/<int:day>/<path:path>/')
def blog_post_with_date(year, month, day, path):
    ''' Blog post from markdown file '''
    return blog_post_with_category_and_date(None, year, month, day, path)


@app.route('/blog/tags/<string:tag>/')
def blog_posts_by_tag(tag):
    ''' Blog posts by tag '''
    # Render the page
    page = pages.get_or_404(add_l10n_prefix('blog'))
    template = page.meta.get('template', 'page.html')
    today = datetime.datetime.now().strftime("%B %dth %Y")
    return render_template(template, page=page, today=today, pages=pages, posts=get_posts_by_tag(tag), authors=sorted_authors, tags=tags, categories=categories)


@app.route('/blog/<string:category>/<int:year>/<int:month>/<int:day>/<path:path>/')
def blog_post_with_category_and_date(category, year, month, day, path):
    ''' Blog post from markdown file '''
    path = '{:04}{:02}{:02}_{}'.format(year, month, day, path)
    path = add_l10n_prefix(path)
    return blog_post(path)


@app.route('/blog/<string:category>/')
def blog_posts_by_category(category):
    ''' Blog posts by category '''
    # Render the page
    page = pages.get_or_404(add_l10n_prefix('blog'))
    template = page.meta.get('template', 'page.html')
    today = datetime.datetime.now().strftime("%B %dth %Y")
    return render_template(template, page=page, today=today, pages=pages, posts=get_posts_by_category(category), authors=sorted_authors, tags=tags, categories=categories)


def blog_post(path):
    ''' Blog posts from markdown file '''

    # Get the post
    post = posts.get_or_404(path)

    # Get custom template
    template = post.meta.get('template', 'post.html')

    # Verify if need redirect
    redirect_ = post.meta.get('redirect', None)
    if redirect_:
        return redirect(url_for('blog_post', path=redirect_))

    today = datetime.datetime.now().strftime("%B %dth %Y")

    # Render the page
    return render_template(template, post=post, page=post, today=today, pages=pages, posts=posts, authors=authors, tags=tags, categories=categories)
