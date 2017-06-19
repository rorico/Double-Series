//get filename from query
$.ajax({
    url: "replayList",
    success: function(games) {
        console.log(games)
        games.reduce(function(a,val) {
            var file = val;
            var esc = file.replace(/'/g,"&#39;").replace(/"/g,"&quot;");
            $("body").append("<ul><a href='replay?games/" + esc + "'>" + file + "</a></ul>");
        })
    }
});
