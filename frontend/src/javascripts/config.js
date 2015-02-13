// For any third party dependencies, like jQuery, place them in the lib folder.
// Configure loading modules from the lib directory,
// except for 'app' ones, which are in a sibling
// directory.
requirejs.config({
    baseUrl: './static',
    paths : {
        riot : 'vendor/riotjs/js/riot',
        // tags : '',
        // ga_interface_example: 'vendor/gastos_abertos_interface_module_example/js'
    },
    packages: [{
        name: "example",
        location: "vendor/gastos_abertos_interface_module_example/js",
    }],
    shim : {
        'riot': {
            exports: 'riot'
        }
    }
});


