# -*- coding:utf-8 -*-

import logging
import os
from os.path import abspath, dirname, join
from os import environ

from fabric.api import *
from fabric.network import ssh
from fabric.operations import local
from fabric.operations import sudo
from fabric.utils import puts
from fabric.colors import green, red
from fabric.api import *
from fabric.context_managers import lcd

BASEDIR = dirname(__file__)
BACKENDDIR = abspath(join(abspath(BASEDIR), '../../'))
HOMEDIR = abspath(join(abspath(BASEDIR), '../../..'))
FRONTENDDIR = abspath(join(abspath(BASEDIR), '../../frontend'))
LOGGER = logging.getLogger(__name__)

requirements_file = abspath(join(abspath(BACKENDDIR), 'requirements.txt'))

# http://docs.fabfile.org/en/1.5/tutorial.html
#
project = "gastosabertos_website"

env.user = 'gastosabertos'
env.hosts = ['gastosabertos.org']
#env.key_filename = '~/.ssh/ga_id_rsa'

def freeze():
    ''' Creates static html files '''
    with prefix('. /home/ubuntu/virtualenvs/venv-system/bin/activate'):
        local('python site.py build')

@task
def build():
    ''''Build markdown and templates'''
    freeze()

def run_server():
    local('python site.py')

def reset():
    """
    Reset local debug env.
    """

    local("rm -rf ./build")
    local("mkdir ./build")

def setup():
    """
    Setup virtual env.
    """

    reset()
    local("virtualenv env")
    # local("workon py")
    activate_this = "env/bin/activate_this.py"
    execfile(activate_this, dict(__file__=activate_this))


# def get_venv():
#     """ Get the current virtual environment name
#         Bail out if we're not in one
#     """
#     try:
#         return os.environ['VIRTUAL_ENV']
#     except KeyError:
#         print 'Not in a virtualenv'
#         exit(1)

def get_pip():
    """ Get an absolute path to the pip executable
        for the current virtual environment
    """
    return 'pip'

def check_for(what, unrecoverable_msg, installation_cmd=None):
    def failure():
        print unrecoverable_msg
        exit()

    try:
        test_result = local("which %s" % what, capture=True)
        return test_result
    except:
        if(installation_cmd):
            print "Unable to find %s, will attempt installation (you might be asked for sudo password below)"
            local(installation_cmd)
        else:
            failure()
        try:
            test_result = local(cmd, capture=True)
            return test_result
        except:
            failure()

def get_node():
    return check_for('node', 'You need to install Node.js to run the Require.js optimiser and the frontend tests')

def get_npm():
    return check_for('npm', 'You need to install Node.js and npm to run gulp, less, require.js optimiser and the frontend tests')

def get_bower():
    return check_for('./node_modules/bower/bin/bower', 'You need to install Bower to be able to install JS libs', 'sudo npm install -g bower')

def get_gulp():
    return check_for('./node_modules/gulp/bin/gulp.js', 'You need to install Gulp to be able to compile front-end JS, stylesheets and run front-end tests', 'sudo npm install -g gulp-cli')

@task
def install_backend_deps():
    """ Install python dependencies from requirements.txt file
    """
    with lcd(BACKENDDIR):
        cmd = '%(pip)s install -r %(requirements_file)s' % {
            'pip': get_pip(),
            'requirements_file': requirements_file
        }
        local(cmd)
    # Install Pandoc
    local("sudo apt-get install pandoc")
    # Install Pyandoc
    with lcd(HOMEDIR):
        local("git clone git@github.com:kennethreitz/pyandoc.git")
        with lcd("pyandoc"):
	    with prefix('. /home/ubuntu/virtualenvs/venv-system/bin/activate'):
            	local("python setup.py install")


@task
def install_frontend_deps():
    """ install front-end dependencies using npm and bower
    """

    with lcd(FRONTENDDIR):
        cmd = '%(npm)s install' % {'npm': get_npm()}
        local(cmd)
        cmd = '%(bower)s install' % {'bower': get_bower()}
        local(cmd)

@task
def install_deps():
    install_backend_deps()
    install_frontend_deps()
    print 'Run `fab build_static` to get everything ready for development'

@task
def build_static():
    setup()
    install_deps()
    with lcd(FRONTENDDIR):
        cmd = '%(gulp)s build' % {'gulp': get_gulp()}
        local(cmd)

@task
def deploy():
    """
    Deploy project to Gastos Abertos server
    """

    project_dir = '/home/gastosabertos/gastos_abertos_website'
    with cd(project_dir):
        run("cp -R build/ build-old/")
        put('build', 'build')
