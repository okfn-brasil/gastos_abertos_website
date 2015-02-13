// Start loading the main app file. Put all of
// your application logic in there.

require(['example', 'riot'], function (example, riot) {

    window.riot = riot;
    example.init();
});
