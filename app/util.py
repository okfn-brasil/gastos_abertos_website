#!/usr/bin/env python
# -*- coding: utf-8 -*-
from __future__ import unicode_literals  # unicode by default

from .app import app

# l10n helpers

DEFAULT_LOCALE = app.config.get('DEFAULT_LOCALE')
AVAILABLE_LOCALES = app.config.get('AVAILABLE_LOCALES', [])


def has_l10n_prefix(path):
    ''' Verifies if the path have a localization prefix. '''
    return reduce(lambda x, y: x or y, [path.startswith(l)
                  for l in AVAILABLE_LOCALES])


def add_l10n_prefix(path, locale=DEFAULT_LOCALE):
    '''' Add localization prefix if necessary. '''
    return path if has_l10n_prefix(path) else '{}/{}'.format(locale, path)


def remove_l10n_prefix(path, locale=DEFAULT_LOCALE):
    ''' Remove specific localization prefix. '''
    return path if not path.startswith(locale) else path[(len(locale) + 1):]


# Make remove_l10n_prefix accessible to Jinja
app.jinja_env.globals.update(remove_l10n_prefix=remove_l10n_prefix)
