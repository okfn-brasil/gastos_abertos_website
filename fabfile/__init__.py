from fabric.state import output

from .development import *


#
# Fabric configuration
#
output['debug'] = False  # see full command list


def help():
    ''' Fabfile documentation '''
    local('python -c "import fabfile; help(fabfile)"')
