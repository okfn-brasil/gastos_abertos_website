#!/usr/bin/env python
# -*- coding: utf-8 -*-
from __future__ import unicode_literals  # unicode by default

import sys

from flask import Flask
import pypandoc


def config_app(app):
    # Structure helpers
    def render_markdown(text):
        ''' Render Markdown text to HTML. '''
        return pypandoc.convert(text, 'html', format='md')

    app.config['FLATPAGES_HTML_RENDERER'] = render_markdown

    # Load settings
    app.config.from_pyfile('../settings/common.py')
    app.config.from_pyfile('../settings/local_settings.py', silent=True)

    if len(sys.argv) > 2:
        extra_conf = sys.argv[2]
        app.config.from_pyfile('../settings/{}_settings.py'.format(extra_conf), silent=True)


# Create the Flask app
app = Flask(__name__, static_folder='../static', template_folder='../templates')
config_app(app)
