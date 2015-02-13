// Start loading the main app file. Put all of
// your application logic in there.

require(['example', 'riot'], function (app, riot) {

    window.riot = riot;
    app.init();
});
