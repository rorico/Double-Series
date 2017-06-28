//get filename from query
$.ajax({
    url: "replayList.json",
    success: function(games) {
        for (var i = 0 ; i < games.length ; i++) {
            val = games[i];
            var file = val;
            var esc = file.replace(/'/g,"&#39;").replace(/"/g,"&quot;");
            $("body").append("<ul><a href='replay?games/" + esc + "'>" + file + "</a></ul>");
        }
    }
});
