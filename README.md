Gastos Abertos Website
==================================

Static website for Gastos Abertos Project using Flask.

# Install

## Create Virtual environment

    $ mkvirtualenv py
    $ workon py

## Instal Pyandoc

Do not use pip version, because it has Pandoc binary path hardcoded in it.

    $ git clone git@github.com:kennethreitz/pyandoc.git
    $ cd pyandoc
    $ python setup.py install

## Clone Gastos Aberto Repository

    $ git clone https://github.com/okfn-brasil/gastos_abertos_website.git

## Install dependencies

    $ cd gastos_abertos_website
    $ pip install -r requirements.txt

## Build pages and run

First build the pages to build/ directory:

    $ fab build

Run localserver:

    $ fab run


