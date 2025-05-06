
{
  let drawTimeout;
  let counter = 0;
  let lastTouch = 0;
  let processingDoubleTap = false;


  // Actually draw the watch face
  let draw = function () {
    var x = g.getWidth() / 2;
    var y = g.getHeight() / 2;
    g.reset().clearRect(Bangle.appRect); // clear whole background (w/o widgets)
    var date = new Date();
    var timeStr = require("locale").time(date, 1); // Hour and minute
    g.setFontAlign(0, 0).setFont("Vector", 50).drawString(timeStr, x, y);
    // Show date and day of week
    var dateStr = require("locale").date(date, 0).toUpperCase() + "\n" +
      require("locale").dow(date, 0).toUpperCase();

    dateStr = "V7: " + counter;
    g.setFontAlign(0, 0).setFont("6x8", 5).drawString(dateStr, x, y + 54);

    // queue next draw
    if (drawTimeout) clearTimeout(drawTimeout);
    drawTimeout = setTimeout(function () {
      drawTimeout = undefined;
      draw();
    }, 60000 - (Date.now() % 60000));
  };

  // Show launcher when middle button pressed
  Bangle.setUI({
    mode: "clock",
    remove: function () {
      // Called to unload all of the clock app
      if (drawTimeout) clearTimeout(drawTimeout);
      drawTimeout = undefined;
      delete Graphics.prototype.setFontAnton;
    }
  });

  // Load widgets
  Bangle.loadWidgets();
  draw();
  setTimeout(Bangle.drawWidgets, 0);

  let doubleTapHandler = function () {
    if (processingDoubleTap) return;
    processingDoubleTap = true;

    counter++;
    Bangle.buzz();
    
    Bluetooth.println("");
    Bluetooth.println(JSON.stringify({
      t:"intent", 
      target:"activity", 
      action:"android.intent.action.VOICE_COMMAND", 
      flags:["FLAG_ACTIVITY_NEW_TASK"]
    }));
  

    setTimeout(() => {
      draw(); // force redraw
    });
    
    setTimeout(() => {
      processingDoubleTap = false;
    }, 2500);
  }

  // Cleanup previous instances
  Bangle.removeAllListeners();

  // Handle touch events
  Bangle.on('touch', (button, e) => {
    Bangle.setLCDPower(1);

    let now = Date.now();
    if (now - lastTouch < 600) { // double touch detected    
      doubleTapHandler();
    }
    lastTouch = now;
  });

  Bangle.on('tap', function(data) {
    Bangle.setLCDPower(1);

    // We care double tap, or double clap, but not at the side of watch
    if (data.double == true && (data.z == 2 || data.z == -2)) {
      doubleTapHandler();
    }
  });

  Bangle.setOptions({
    wakeOnBTN1: true,
    wakeOnBTN2: true,
    wakeOnBTN3: true,
    wakeOnFaceUp: true,
    wakeOnTouch: false, // Handling it manually (bug)
    wakeOnTwist: true,
    lcdPowerTimeout: 5000,
  });
}

