# js-quickconnectid
A JS library to fetch the DSM url based on a quickconnect ID.

```javascript
var quickconnect = new QuickConnect([QUICKCONNECTID);
var serverURL = quickconnect.determineServerURL(successFunction, failureFunction);
```
e.g.

```javascript
var quickconnect = new QuickConnect("dsmid");
var serverURL = quickconnect.determineServerURL(function(url) {
  alert(url);
}, function(error) {
  alert(error);
});
```

[![Code Climate](https://codeclimate.com/github/js-quickconnectid/codeclimate/badges/gpa.svg)](https://codeclimate.com/github/js-quickconnectid/codeclimate)
