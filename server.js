let express = require("express");
let logger = require("morgan");
let mongoose = require("mongoose");
let axios = require("axios");
let cheerio = require("cheerio");
let db = require("./models");
let PORT = 3000;
let app = express();

app.use(logger("dev"));
app.use(express.urlencoded({
    extended: true
}));
app.use(express.json());
app.use(express.static("public"));

mongoose.connect("mongodb://localhost/", {
    useNewUrlParser: true
});

app.get("/scrape", function (req, res) {
    axios.get("http://www.reddit.com/").then(function (response) {
        let $ = cheerio.load(response.data);

        $(".y8HYJ-y_lTUHkQIc1mdCq _2INHSNB8V5eaWp4P0rY_mE").each(function (i, element) {
            let results = {};
            console.log($(this).attr("href"));
            // console.log($(this).find("h3").text());
            results.title = $(this).find("h3").text();
            results.link = "https://www.reddit.com" + $(this)
                .attr("href");

            db.Article.create(results)
                .then(function (dbArticle) {
                    console.log(dbArticle);
                })
                .catch(function (err) {
                    console.log(err);
                });
        });
        res.send("Scrape Complete");
    });
});

app.get("/articles", function (req, res) {
    db.Article.find({})
        .then(function (dbArticle) {
            res.json(dbArticle);
        })
        .catch(function (err) {
            res.json(err);
        });
});

app.get("/articles/:id", function (req, res) {
    db.Article.findOne({
            _id: req.params.id
        })
        .populate("note")
        .then(function (dbArticle) {
            res.json(dbArticle);
        })
        .catch(function (err) {
            res.json(err);
        });
});

app.post("/articles/:id", function(req, res) {
    db.Note.create(req.body)
      .then(function(dbNote) {
        return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true });
      })
      .then(function(dbArticle) {
        res.json(dbArticle);
      })
      .catch(function(err) {
        res.json(err);
      });
  });
  
  app.listen(PORT, function() {
    console.log("App running on port " + PORT + "!");
  });